import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { demoWifiProvisioner } from '../src/demo/demo-services.ts';
import { WifiProvisionError, type WifiProvisionResult } from '../src/wifi/wifi-provisioner.ts';
import { colors, ui } from './ui.ts';

export default function WifiScreen() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<WifiProvisionResult | null>(demoWifiProvisioner.getLastResult());
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const next = await demoWifiProvisioner.provision({ ssid, password });
      setResult(next);
    } catch (err) {
      const msg =
        err instanceof WifiProvisionError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      setError(msg);
      setResult(demoWifiProvisioner.getLastResult());
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.scroll}>
      <Text style={ui.title} accessibilityRole="header">
        Wi-Fi setup
      </Text>
      <Text style={ui.subtitle}>Mock credential entry — no real transfer to hardware</Text>

      {busy ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={ui.error}>{error}</Text> : null}
      {result?.success ? <Text style={ui.success}>{result.message}</Text> : null}

      <View style={ui.section}>
        <TextInput
          style={ui.input}
          value={ssid}
          onChangeText={setSsid}
          placeholder="SSID"
          autoCapitalize="none"
          accessibilityLabel="Wi-Fi SSID"
        />
        <TextInput
          style={ui.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          accessibilityLabel="Wi-Fi password"
        />
        <Pressable
          style={ui.button}
          onPress={() => void submit()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Send credentials to cube"
        >
          <Text style={ui.buttonText}>Send to cube (mock)</Text>
        </Pressable>
        <Text style={ui.muted}>Tip: SSID “fail-network” simulates a transfer failure.</Text>
      </View>

      {result ? (
        <View style={ui.section}>
          <Text style={ui.sectionTitle}>Last result</Text>
          <View style={ui.row}>
            <Text style={ui.rowMeta}>Status: {result.status}</Text>
            <Text style={ui.rowMeta}>SSID: {result.ssid}</Text>
            <Text style={ui.rowMeta}>{result.message}</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
