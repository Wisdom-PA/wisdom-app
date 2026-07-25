import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import type { Device, Routine } from '../../src/api/types.ts';
import { demoCubeClient, SCENE_ROUTINE_IDS } from '../../src/demo/demo-services.ts';
import { groupDevicesByRoom, isDeviceOn } from '../../src/devices/group-by-room.ts';
import { colors, ui } from '../ui.ts';

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextDevices, nextRoutines] = await Promise.all([
        demoCubeClient.listDevices(),
        demoCubeClient.listRoutines(),
      ]);
      setDevices(nextDevices);
      setRoutines(nextRoutines);
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

  const rooms = useMemo(() => groupDevicesByRoom(devices), [devices]);
  const selected = devices.find((d) => d.deviceId === selectedId) ?? null;
  const scenes = routines.filter((r) => (SCENE_ROUTINE_IDS as readonly string[]).includes(r.routineId));

  async function toggleDevice(device: Device, on: boolean) {
    setMessage(null);
    setError(null);
    try {
      await demoCubeClient.setDeviceState(device.deviceId, { on });
      await load();
      setMessage(`${device.displayName} turned ${on ? 'on' : 'off'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function runScene(routineId: string, name: string) {
    setMessage(null);
    setError(null);
    try {
      const result = await demoCubeClient.runRoutine(routineId);
      const failed = result.results.filter((r) => r.result === 'failure').length;
      await load();
      setMessage(
        failed === 0 ? `Scene “${name}” ran successfully` : `Scene “${name}” finished with ${failed} failure(s)`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.scroll}>
      <Text style={ui.title} accessibilityRole="header">
        Devices
      </Text>
      <Text style={ui.subtitle}>Room-grouped devices and scene shortcuts</Text>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}
      {message ? <Text style={ui.success}>{message}</Text> : null}

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Scenes</Text>
        <View style={ui.chipRow}>
          {scenes.map((scene) => (
            <Pressable
              key={scene.routineId}
              style={ui.chip}
              onPress={() => void runScene(scene.routineId, scene.name)}
              accessibilityRole="button"
              accessibilityLabel={`Run scene ${scene.name}`}
            >
              <Text style={ui.chipText}>{scene.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {rooms.map((group) => (
        <View key={group.room} style={ui.section}>
          <Text style={ui.sectionTitle}>{group.room}</Text>
          {group.devices.map((device) => (
            <Pressable
              key={device.deviceId}
              style={ui.row}
              onPress={() => setSelectedId(device.deviceId)}
              accessibilityRole="button"
              accessibilityLabel={`${device.displayName}, ${device.reachable ? 'reachable' : 'unreachable'}`}
            >
              <Text style={ui.rowTitle}>{device.displayName}</Text>
              <Text style={ui.rowMeta}>
                {device.reachable ? 'Reachable' : 'Unreachable'} · {isDeviceOn(device) ? 'On' : 'Off'}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}

      {selected ? (
        <View style={ui.section} accessibilityLabel="Device control panel">
          <Text style={ui.sectionTitle}>Control: {selected.displayName}</Text>
          <View style={ui.row}>
            <Text style={ui.rowMeta}>Room: {selected.room ?? 'Unassigned'}</Text>
            <Text style={ui.rowMeta}>Capabilities: {selected.capabilities.join(', ') || 'none'}</Text>
            <Text style={ui.rowMeta}>Reachable: {selected.reachable ? 'yes' : 'no'}</Text>
            {selected.capabilities.includes('on_off') ? (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}
              >
                <Text style={ui.rowTitle}>Power</Text>
                <Switch
                  value={isDeviceOn(selected)}
                  onValueChange={(on) => void toggleDevice(selected, on)}
                  disabled={!selected.reachable}
                  accessibilityLabel={`Toggle ${selected.displayName}`}
                />
              </View>
            ) : null}
          </View>
          <Pressable style={ui.buttonSecondary} onPress={() => setSelectedId(null)} accessibilityRole="button">
            <Text style={ui.buttonSecondaryText}>Close panel</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}
