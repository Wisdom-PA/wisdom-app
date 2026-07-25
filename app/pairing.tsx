import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { demoPairingService } from '../src/demo/demo-services.ts';
import { type DiscoveredCube, PairingError, type PairingSession } from '../src/pairing/pairing-service.ts';
import { colors, ui } from './ui.ts';

export default function PairingScreen() {
  const [cubes, setCubes] = useState<DiscoveredCube[]>([]);
  const [session, setSession] = useState<PairingSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [discovered, current] = await Promise.all([demoPairingService.discover(), demoPairingService.getSession()]);
      setCubes(discovered);
      setSession(current);
    } catch (err) {
      const msg =
        err instanceof PairingError ? `${err.code}: ${err.message}` : err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  async function pair(cubeId: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const next = await demoPairingService.pair(cubeId);
      setSession(next);
      setMessage(`Paired with ${next.displayName}`);
      await refresh();
    } catch (err) {
      const msg =
        err instanceof PairingError ? `${err.code}: ${err.message}` : err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function reconnect() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const next = await demoPairingService.reconnect();
      setSession(next);
      setMessage(`Reconnected to ${next.displayName}`);
    } catch (err) {
      const msg =
        err instanceof PairingError ? `${err.code}: ${err.message}` : err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await demoPairingService.disconnect();
      setSession(null);
      setMessage('Disconnected');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.scroll}>
      <Text style={ui.title} accessibilityRole="header">
        Pair cube
      </Text>
      <Text style={ui.subtitle}>Simulated discovery and session token (no Bluetooth)</Text>

      {busy ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}
      {message ? <Text style={ui.success}>{message}</Text> : null}

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Session</Text>
        <View style={ui.row}>
          {session ? (
            <>
              <Text style={ui.rowTitle}>{session.displayName}</Text>
              <Text style={ui.rowMeta}>Token: {session.sessionToken}</Text>
              <Text style={ui.rowMeta}>Paired at: {session.pairedAt}</Text>
            </>
          ) : (
            <Text style={ui.rowMeta}>No active pairing session</Text>
          )}
        </View>
        <Pressable
          style={ui.buttonSecondary}
          onPress={() => void reconnect()}
          disabled={!session || busy}
          accessibilityRole="button"
          accessibilityLabel="Reconnect"
        >
          <Text style={ui.buttonSecondaryText}>Reconnect</Text>
        </Pressable>
        <Pressable
          style={ui.buttonSecondary}
          onPress={() => void disconnect()}
          disabled={!session || busy}
          accessibilityRole="button"
          accessibilityLabel="Disconnect"
        >
          <Text style={ui.buttonSecondaryText}>Disconnect</Text>
        </Pressable>
        <Pressable
          style={ui.button}
          onPress={() => void refresh()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Scan again"
        >
          <Text style={ui.buttonText}>Scan again</Text>
        </Pressable>
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Discovered cubes</Text>
        {cubes.map((cube) => (
          <View key={cube.cubeId} style={ui.row}>
            <Text style={ui.rowTitle}>{cube.displayName}</Text>
            <Text style={ui.rowMeta}>
              Signal {cube.signalStrength} dBm
              {cube.alreadyPaired ? ' · paired' : ''}
            </Text>
            <Pressable
              style={ui.button}
              onPress={() => void pair(cube.cubeId)}
              disabled={busy || cube.alreadyPaired}
              accessibilityRole="button"
              accessibilityLabel={`Pair ${cube.displayName}`}
            >
              <Text style={ui.buttonText}>{cube.alreadyPaired ? 'Paired' : 'Pair'}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
