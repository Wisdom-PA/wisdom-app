import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { LogEntry } from '../../src/api/types.ts';
import { demoCubeClient } from '../../src/demo/demo-services.ts';
import { filterLogEntries } from '../../src/logs/filter-logs.ts';
import { colors, ui } from '../ui.ts';

export default function LogsScreen() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileFilter, setProfileFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      setEntries(await demoCubeClient.queryLogs({ limit: 50, offset: 0 }));
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

  const filtered = useMemo(
    () =>
      filterLogEntries(entries, {
        profileId: profileFilter || null,
        deviceId: deviceFilter || null,
      }),
    [entries, profileFilter, deviceFilter]
  );

  const selected = filtered.find((e) => e.chain.chainId === selectedId) ?? null;

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.scroll}>
      <Text style={ui.title} accessibilityRole="header">
        Logs
      </Text>
      <Text style={ui.subtitle}>Activity timeline and per-chain transparency</Text>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Filters</Text>
        <TextInput
          style={ui.input}
          value={profileFilter}
          onChangeText={setProfileFilter}
          placeholder="profileId (e.g. profile-adult)"
          autoCapitalize="none"
          accessibilityLabel="Filter by profile id"
        />
        <TextInput
          style={ui.input}
          value={deviceFilter}
          onChangeText={setDeviceFilter}
          placeholder="deviceId (e.g. dev-sofa-lamp)"
          autoCapitalize="none"
          accessibilityLabel="Filter by device id"
        />
        <Pressable
          style={ui.buttonSecondary}
          onPress={() => {
            setProfileFilter('');
            setDeviceFilter('');
          }}
          accessibilityRole="button"
          accessibilityLabel="Clear log filters"
        >
          <Text style={ui.buttonSecondaryText}>Clear filters</Text>
        </Pressable>
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Timeline ({filtered.length})</Text>
        {filtered.length === 0 ? <Text style={ui.muted}>No chains match.</Text> : null}
        {filtered.map((entry) => {
          const firstIntent = entry.intents[0]?.utterance ?? '(no intent)';
          const net = entry.internetCalls.length;
          return (
            <Pressable
              key={entry.chain.chainId}
              style={ui.row}
              onPress={() => setSelectedId(entry.chain.chainId)}
              accessibilityRole="button"
              accessibilityLabel={`Open chain ${entry.chain.chainId}`}
            >
              <Text style={ui.rowTitle}>{firstIntent}</Text>
              <Text style={ui.rowMeta}>
                {entry.chain.chainStartTs} · {entry.chain.deviceId}
              </Text>
              <Text style={ui.rowMeta}>
                profile {entry.chain.initialProfileId ?? '—'} · intents {entry.intents.length} · actions{' '}
                {entry.actions.length} · net {net}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <View style={ui.section}>
          <Text style={ui.sectionTitle}>Chain detail</Text>
          <View style={ui.row}>
            <Text style={ui.rowTitle}>{selected.chain.chainId}</Text>
            <Text style={ui.rowMeta}>
              {selected.chain.chainStartTs} → {selected.chain.chainEndTs ?? 'open'}
            </Text>
            <Text style={ui.rowMeta}>device: {selected.chain.deviceId}</Text>
            <Text style={ui.rowMeta}>
              profiles: initial {selected.chain.initialProfileId ?? '—'}, identified{' '}
              {selected.chain.identifiedProfileId ?? '—'}
            </Text>
          </View>

          <Text style={ui.sectionTitle}>Intents</Text>
          {selected.intents.map((intent) => (
            <View key={`${intent.chainId}-${intent.intentIndex}`} style={ui.row}>
              <Text style={ui.rowTitle}>{intent.utterance}</Text>
              <Text style={ui.rowMeta}>
                {intent.type} · {intent.ts} · profile {intent.profileId ?? '—'}
              </Text>
            </View>
          ))}

          <Text style={ui.sectionTitle}>Actions</Text>
          {selected.actions.length === 0 ? <Text style={ui.muted}>No actions.</Text> : null}
          {selected.actions.map((action) => (
            <View key={`${action.chainId}-${action.actionIndex}`} style={ui.row}>
              <Text style={ui.rowTitle}>
                {action.deviceId} · {action.result}
              </Text>
              <Text style={ui.rowMeta}>{action.ts}</Text>
              {action.errorMessage ? <Text style={ui.error}>{action.errorMessage}</Text> : null}
            </View>
          ))}

          <Text style={ui.sectionTitle}>Internet calls</Text>
          {selected.internetCalls.length === 0 ? <Text style={ui.muted}>No internet calls.</Text> : null}
          {selected.internetCalls.map((call) => (
            <View key={`${call.chainId}-${call.callIndex}`} style={ui.row}>
              <Text style={ui.rowTitle}>
                {call.summary} · {call.result}
              </Text>
              <Text style={ui.rowMeta}>
                {call.serviceCategory} · {call.endpoint}
              </Text>
              {call.errorMessage ? <Text style={ui.error}>{call.errorMessage}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
