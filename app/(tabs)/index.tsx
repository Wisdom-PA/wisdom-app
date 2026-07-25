import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import type { CubeStatus } from '../../src/api/types.ts';
import { demoCubeClient } from '../../src/demo/demo-services.ts';
import { colors, ui } from '../ui.ts';

export default function DashboardScreen() {
  const [status, setStatus] = useState<CubeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const next = await demoCubeClient.getStatus();
      setStatus(next);
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

  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={ui.scroll}
      refreshControl={<RefreshControl refreshing={loading && status !== null} onRefresh={() => void load()} />}
    >
      <Text style={ui.title} accessibilityRole="header">
        Dashboard
      </Text>
      <Text style={ui.subtitle}>Cube status from the mock client</Text>

      {loading && !status ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}

      {status ? (
        <View style={ui.section} accessibilityLabel="Cube status">
          <View style={ui.row}>
            <Text style={ui.statusLine}>Cube: {status.cubeId}</Text>
            <Text style={ui.statusLine}>Version: {status.version}</Text>
            <Text style={ui.statusLine}>Uptime: {status.uptimeSeconds}s</Text>
            <Text style={ui.statusLine}>Privacy: {status.privacyMode}</Text>
            <Text style={ui.statusLine}>Offline mode: {status.offlineModeEnabled ? 'on' : 'off'}</Text>
            <Text style={ui.statusLine}>Internet: {status.internetConnected ? 'connected' : 'offline'}</Text>
            <Text style={ui.statusLine}>Devices: {status.pairedDevicesCount}</Text>
            <Text style={ui.statusLine}>Profiles: {status.profilesCount}</Text>
            <Text style={ui.statusLine}>Active profile: {status.activeProfileId ?? 'none'}</Text>
          </View>
          <Pressable
            style={ui.buttonSecondary}
            onPress={() => void load()}
            accessibilityRole="button"
            accessibilityLabel="Refresh status"
          >
            <Text style={ui.buttonSecondaryText}>Refresh</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}
