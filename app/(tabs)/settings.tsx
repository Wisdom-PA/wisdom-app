import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import type {
  BackupManifest,
  BackupStatus,
  CubeConfig,
  LogEntry,
  LogIntent,
  MemoryItem,
  Profile,
} from '../../src/api/types.ts';
import { demoCubeClient, demoLocalBackupStore, demoPairingService } from '../../src/demo/demo-services.ts';
import { collectIntents } from '../../src/logs/filter-logs.ts';
import type { PairingSession } from '../../src/pairing/pairing-service.ts';
import { buildExportPayload } from '../../src/privacy/build-export-payload.ts';
import { colors, ui } from '../ui.ts';

type RestoreMode = 'factory_reset' | 'device_routine_recovery';

export default function SettingsScreen() {
  const [config, setConfig] = useState<CubeConfig | null>(null);
  const [session, setSession] = useState<PairingSession | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [storedBackups, setStoredBackups] = useState<BackupManifest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [intents, setIntents] = useState<LogIntent[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [exportPreview, setExportPreview] = useState<string | null>(null);
  const [remoteOptIn, setRemoteOptIn] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{
    backupId: string;
    mode: RestoreMode;
    dryRunMessage: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStored = useCallback(() => {
    setStoredBackups(demoLocalBackupStore.list());
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextConfig, nextSession, nextBackup, nextProfiles, logs, nextMemories] = await Promise.all([
        demoCubeClient.getConfig(),
        demoPairingService.getSession(),
        demoCubeClient.getBackupStatus(),
        demoCubeClient.listProfiles(),
        demoCubeClient.queryLogs({ limit: 100, offset: 0 }),
        demoCubeClient.listMemories(),
      ]);
      setConfig(nextConfig);
      setSession(nextSession);
      setBackupStatus(nextBackup);
      setProfiles(nextProfiles);
      setIntents(collectIntents(logs as LogEntry[]));
      setMemories(nextMemories);
      refreshStored();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [refreshStored]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const lastBackupLabel = useMemo(() => {
    const last = backupStatus?.lastBackup;
    if (!last) return 'No cube backup yet';
    return `${last.backupId} · ${last.createdAt}`;
  }, [backupStatus]);

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

  async function deleteAllHistory() {
    setError(null);
    setMessage(null);
    try {
      await demoCubeClient.clearLogs();
      setIntents([]);
      setMessage('Conversation history deleted');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function exportMyData() {
    setError(null);
    setMessage(null);
    try {
      const [nextProfiles, logs] = await Promise.all([
        demoCubeClient.listProfiles(),
        demoCubeClient.queryLogs({ limit: 500, offset: 0 }),
      ]);
      const json = buildExportPayload({ profiles: nextProfiles, logs });
      setExportPreview(json.slice(0, 280) + (json.length > 280 ? '…' : ''));
      setMessage(`Export ready (${json.length} chars)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function triggerBackup() {
    setError(null);
    setMessage(null);
    setPendingRestore(null);
    try {
      const status = await demoCubeClient.triggerBackup();
      setBackupStatus(status);
      const id = status.lastBackup?.backupId;
      if (id) {
        const payload = await demoCubeClient.getBackup(id);
        demoLocalBackupStore.save(payload);
        refreshStored();
        setMessage(`Backup stored locally: ${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function dryRunRestore(backupId: string, mode: RestoreMode) {
    setError(null);
    setMessage(null);
    try {
      const result = await demoCubeClient.restore({ backupId, mode, dryRun: true });
      if (!result.success) {
        setError(result.message);
        return;
      }
      setPendingRestore({ backupId, mode, dryRunMessage: result.message });
      setMessage(`Dry-run OK — confirm to restore (${mode})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function confirmRestore() {
    if (!pendingRestore) return;
    setError(null);
    setMessage(null);
    try {
      const result = await demoCubeClient.restore({
        backupId: pendingRestore.backupId,
        mode: pendingRestore.mode,
        dryRun: false,
      });
      setPendingRestore(null);
      if (result.success) {
        setMessage(result.message);
        await load();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.scroll}>
      <Text style={ui.title} accessibilityRole="header">
        Settings
      </Text>
      <Text style={ui.subtitle}>Privacy, backup, pairing, and cube toggles</Text>

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
        <Text style={ui.sectionTitle}>Privacy & history</Text>
        <Text style={ui.muted}>Conversation history (intents only)</Text>
        {intents.length === 0 ? <Text style={ui.muted}>No history.</Text> : null}
        {intents.slice(0, 8).map((intent) => (
          <View key={`${intent.chainId}-${intent.intentIndex}`} style={ui.row}>
            <Text style={ui.rowTitle}>{intent.utterance}</Text>
            <Text style={ui.rowMeta}>
              {intent.ts} · {intent.profileId ?? '—'}
            </Text>
          </View>
        ))}
        <Pressable
          style={ui.buttonSecondary}
          onPress={() => void deleteAllHistory()}
          accessibilityRole="button"
          accessibilityLabel="Delete all conversation history"
        >
          <Text style={ui.buttonSecondaryText}>Delete all history</Text>
        </Pressable>
        <Pressable
          style={ui.button}
          onPress={() => void exportMyData()}
          accessibilityRole="button"
          accessibilityLabel="Export my data"
        >
          <Text style={ui.buttonText}>Export my data</Text>
        </Pressable>
        {exportPreview ? (
          <View style={ui.row}>
            <Text style={ui.rowMeta} accessibilityLabel="Export preview">
              {exportPreview}
            </Text>
          </View>
        ) : null}

        <Text style={[ui.sectionTitle, { marginTop: 12 }]}>Memory</Text>
        {memories.length === 0 ? (
          <Text style={ui.muted}>No memories stored (placeholder list).</Text>
        ) : (
          memories.map((m) => (
            <View key={m.memoryId} style={ui.row}>
              <Text style={ui.rowTitle}>{m.label}</Text>
              <Text style={ui.rowMeta}>{m.createdAt}</Text>
            </View>
          ))
        )}
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Backup & restore</Text>
        <View style={ui.row}>
          <Text style={ui.rowTitle}>Cube backup status</Text>
          <Text style={ui.rowMeta}>{lastBackupLabel}</Text>
          <Text style={ui.rowMeta}>
            Local store: {storedBackups.length} backup{storedBackups.length === 1 ? '' : 's'} (in-memory mock; encrypted
            at-rest deferred)
          </Text>
        </View>
        <Pressable
          style={ui.button}
          onPress={() => void triggerBackup()}
          accessibilityRole="button"
          accessibilityLabel="Trigger backup"
        >
          <Text style={ui.buttonText}>Trigger backup</Text>
        </Pressable>

        {storedBackups.map((b) => (
          <View key={b.backupId} style={ui.row}>
            <Text style={ui.rowTitle}>{b.backupId}</Text>
            <Text style={ui.rowMeta}>
              {b.createdAt} · {b.checksum}
            </Text>
            <Pressable
              style={ui.buttonSecondary}
              onPress={() => void dryRunRestore(b.backupId, 'factory_reset')}
              accessibilityRole="button"
              accessibilityLabel={`Dry-run restore factory reset ${b.backupId}`}
            >
              <Text style={ui.buttonSecondaryText}>Restore dry-run (factory reset)</Text>
            </Pressable>
            <Pressable
              style={ui.buttonSecondary}
              onPress={() => void dryRunRestore(b.backupId, 'device_routine_recovery')}
              accessibilityRole="button"
              accessibilityLabel={`Dry-run restore with recovery ${b.backupId}`}
            >
              <Text style={ui.buttonSecondaryText}>Restore dry-run (with recovery)</Text>
            </Pressable>
          </View>
        ))}

        {pendingRestore ? (
          <View style={ui.row}>
            <Text style={ui.rowTitle}>Confirm restore</Text>
            <Text style={ui.rowMeta}>
              {pendingRestore.backupId} · {pendingRestore.mode}
            </Text>
            <Text style={ui.rowMeta}>{pendingRestore.dryRunMessage}</Text>
            <Pressable
              style={ui.button}
              onPress={() => void confirmRestore()}
              accessibilityRole="button"
              accessibilityLabel="Confirm restore"
            >
              <Text style={ui.buttonText}>Confirm restore</Text>
            </Pressable>
            <Pressable
              style={ui.buttonSecondary}
              onPress={() => setPendingRestore(null)}
              accessibilityRole="button"
              accessibilityLabel="Cancel restore"
            >
              <Text style={ui.buttonSecondaryText}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={ui.rowTitle}>Remote backup opt-in</Text>
            <Text style={ui.rowMeta}>UI placeholder — remote encrypted cloud backup server is human-blocked.</Text>
          </View>
          <Switch
            value={remoteOptIn}
            onValueChange={setRemoteOptIn}
            accessibilityLabel="Toggle remote backup opt-in placeholder"
          />
        </View>
        {remoteOptIn ? (
          <Text style={ui.muted}>
            Profiles on device: {profiles.length}. Remote upload not available in software-only Phase 11.
          </Text>
        ) : null}
      </View>

      <View style={ui.section}>
        <Text style={ui.sectionTitle}>Chat (software)</Text>
        <Text style={ui.muted}>
          Text chat with the cube. Phone mic/speaker as satellite (F9.T10.S2) is human-blocked / deferred.
        </Text>
        <Link href="/chat" asChild>
          <Pressable style={ui.button} accessibilityRole="button" accessibilityLabel="Open chat">
            <Text style={ui.buttonText}>Chat</Text>
          </Pressable>
        </Link>
      </View>

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
