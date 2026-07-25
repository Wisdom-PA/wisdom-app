import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { Routine, RoutineExecutionResult } from '../../src/api/types.ts';
import { demoCubeClient } from '../../src/demo/demo-services.ts';
import { colors, ui } from '../ui.ts';

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [triggerPhrase, setTriggerPhrase] = useState('');
  const [actionDeviceId, setActionDeviceId] = useState('dev-sofa-lamp');
  const [runResult, setRunResult] = useState<RoutineExecutionResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRoutines(await demoCubeClient.listRoutines());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const selected = routines.find((r) => r.routineId === selectedId) ?? null;

  async function createRoutine() {
    setError(null);
    setMessage(null);
    try {
      const created = await demoCubeClient.createRoutine({
        name: name.trim() || 'New routine',
        ownerProfileId: 'profile-adult',
        triggers: [{ type: 'voice_phrase', config: { phrase: triggerPhrase.trim() || 'run routine' } }],
        conditions: [],
        actions: [
          {
            type: 'device_state',
            config: { deviceId: actionDeviceId.trim() || 'dev-sofa-lamp', state: { on: true } },
          },
        ],
      });
      setCreating(false);
      setName('');
      setTriggerPhrase('');
      setSelectedId(created.routineId);
      setMessage(`Created “${created.name}”`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function runSelected() {
    if (!selected) return;
    setError(null);
    setMessage(null);
    try {
      const result = await demoCubeClient.runRoutine(selected.routineId);
      setRunResult(result);
      setMessage(`Ran “${selected.name}” (${result.results.length} action(s))`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.scroll}>
      <Text style={ui.title} accessibilityRole="header">
        Routines
      </Text>
      <Text style={ui.subtitle}>List, detail, run, and simple create</Text>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}
      {message ? <Text style={ui.success}>{message}</Text> : null}

      <Pressable
        style={ui.button}
        onPress={() => setCreating((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Toggle create routine form"
      >
        <Text style={ui.buttonText}>{creating ? 'Cancel create' : 'Create routine'}</Text>
      </Pressable>

      {creating ? (
        <View style={ui.section}>
          <Text style={ui.sectionTitle}>New routine</Text>
          <TextInput
            style={ui.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            accessibilityLabel="Routine name"
          />
          <TextInput
            style={ui.input}
            value={triggerPhrase}
            onChangeText={setTriggerPhrase}
            placeholder="Voice trigger phrase"
            accessibilityLabel="Trigger phrase"
          />
          <TextInput
            style={ui.input}
            value={actionDeviceId}
            onChangeText={setActionDeviceId}
            placeholder="Device id for on action"
            accessibilityLabel="Action device id"
            autoCapitalize="none"
          />
          <Pressable style={ui.button} onPress={() => void createRoutine()} accessibilityRole="button">
            <Text style={ui.buttonText}>Save</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>All routines</Text>
        {routines.map((routine) => (
          <Pressable
            key={routine.routineId}
            style={ui.row}
            onPress={() => {
              setSelectedId(routine.routineId);
              setRunResult(null);
            }}
            accessibilityRole="button"
            accessibilityLabel={routine.name}
          >
            <Text style={ui.rowTitle}>{routine.name}</Text>
            <Text style={ui.rowMeta}>
              {routine.enabled ? 'Enabled' : 'Disabled'} · {routine.triggers.length} trigger(s) ·{' '}
              {routine.actions.length} action(s)
            </Text>
          </Pressable>
        ))}
      </View>

      {selected ? (
        <View style={ui.section}>
          <Text style={ui.sectionTitle}>Detail: {selected.name}</Text>
          <View style={ui.row}>
            <Text style={ui.rowMeta}>Owner: {selected.ownerProfileId}</Text>
            <Text style={ui.rowMeta}>
              Trigger: {selected.triggers[0]?.type ?? 'none'}{' '}
              {selected.triggers[0] ? JSON.stringify(selected.triggers[0].config) : ''}
            </Text>
            <Text style={ui.rowMeta}>
              Action: {selected.actions[0]?.type ?? 'none'}{' '}
              {selected.actions[0] ? JSON.stringify(selected.actions[0].config) : ''}
            </Text>
          </View>
          <Pressable
            style={ui.button}
            onPress={() => void runSelected()}
            accessibilityRole="button"
            accessibilityLabel={`Run ${selected.name}`}
          >
            <Text style={ui.buttonText}>Run</Text>
          </Pressable>
          {runResult ? (
            <Text style={ui.muted}>
              Last run {runResult.chainId}: {runResult.results.map((r) => `${r.actionIndex}:${r.result}`).join(', ')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
