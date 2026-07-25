import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import type { CubeConfig } from '../../src/api/types.ts';
import { demoCubeClient, demoPairingService } from '../../src/demo/demo-services.ts';
import type { PairingSession } from '../../src/pairing/pairing-service.ts';
import { colors, ui } from '../ui.ts';

export default function SettingsScreen() {
  const [config, setConfig] = useState<CubeConfig | null>(null);
  const [session, setSession] = useState<PairingSession | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextConfig, nextSession] = await Promise.all([
        demoCubeClient.getConfig(),
        demoPairingService.getSession(),
      ]);
      setConfig(nextConfig);
      setSession(nextSession);
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

  async function toggleOffline(enabled: boolean) {
    setError(null);
    setMessage(null);
    try {
      const updated = await demoCubeClient.patchConfig({ offlineModeEnabled: enabled });
      setConfig(updated);
      setMessage(enabled ? 'Offline mode enabled' : 'Offline mode disabled');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.scroll}>
      <Text style={ui.title} accessibilityRole="header">
        Settings
      </Text>
      <Text style={ui.subtitle}>Cube config, pairing, and Wi-Fi mocks</Text>

      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}
      {message ? <Text style={ui.success}>{message}</Text> : null}

      {config ? (
        <View style={ui.section}>
          <Text style={ui.sectionTitle}>Cube</Text>
          <View style={ui.row}>
            <Text style={ui.rowMeta}>Cube id: {config.cubeId}</Text>
            <Text style={ui.rowMeta}>Privacy default: {config.defaultPrivacyMode}</Text>
            <Text style={ui.rowMeta}>Wake word: {config.wakeWord}</Text>
            <Text style={ui.rowMeta}>Timezone: {config.timezone}</Text>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}
            >
              <Text style={ui.rowTitle}>Offline mode</Text>
              <Switch
                value={config.offlineModeEnabled}
                onValueChange={(v) => void toggleOffline(v)}
                accessibilityLabel="Toggle offline mode"
              />
            </View>
          </View>
        </View>
      ) : null}

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Connectivity (software mock)</Text>
        <View style={ui.row}>
          <Text style={ui.rowTitle}>Pairing</Text>
          <Text style={ui.rowMeta}>{session ? `Paired with ${session.displayName}` : 'Not paired'}</Text>
        </View>
        <Link href="/pairing" asChild>
          <Pressable style={ui.button} accessibilityRole="button" accessibilityLabel="Open pairing">
            <Text style={ui.buttonText}>Open pairing</Text>
          </Pressable>
        </Link>
        <Link href="/wifi" asChild>
          <Pressable style={ui.buttonSecondary} accessibilityRole="button" accessibilityLabel="Open Wi-Fi setup">
            <Text style={ui.buttonSecondaryText}>Open Wi-Fi setup</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
