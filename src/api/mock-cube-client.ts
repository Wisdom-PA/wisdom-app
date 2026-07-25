import { defaultInternetPolicy, normalizeCreateProfile } from '../profiles/policy.ts';
import type { CubeClient } from './cube-client.ts';
import type {
  BackupStatus,
  ChatMessage,
  ChatResponse,
  ConsentStatus,
  CreateProfile,
  CreateRoutine,
  CubeConfig,
  CubeStatus,
  Device,
  GrantConsentBody,
  GrantConsentResponse,
  LogEntry,
  PatchConfig,
  PatchDevice,
  PatchProfile,
  Profile,
  RestoreRequest,
  RestoreResult,
  Routine,
  RoutineActionResult,
  RoutineExecutionResult,
  RunRoutineBody,
} from './types.ts';

let nextId = 1;
function uid(prefix = 'mock'): string {
  return `${prefix}-${nextId++}`;
}

const DEFAULT_CONSENT_TTL_MS = 15 * 60 * 1000;

export class MockCubeClient implements CubeClient {
  private config: CubeConfig = {
    cubeId: 'mock-cube',
    defaultPrivacyMode: 'paranoid',
    offlineModeEnabled: false,
    timezone: 'Europe/London',
    locale: 'en',
    wakeWord: 'hey wisdom',
    voiceVerbosity: 'normal',
  };

  private devices: Map<string, Device> = new Map();
  private profiles: Map<string, Profile> = new Map();
  private routines: Map<string, Routine> = new Map();
  private logs: LogEntry[] = [];
  private consentExpiry = new Map<string, number>();
  private backupStatus: BackupStatus = { lastBackup: null, inProgress: false };

  async getStatus(): Promise<CubeStatus> {
    return {
      cubeId: this.config.cubeId,
      version: '0.1.0',
      uptimeSeconds: 3600,
      privacyMode: this.config.defaultPrivacyMode,
      internetConnected: !this.config.offlineModeEnabled,
      offlineModeEnabled: this.config.offlineModeEnabled,
      pairedDevicesCount: this.devices.size,
      profilesCount: this.profiles.size,
      activeProfileId: [...this.profiles.keys()][0] ?? null,
    };
  }

  async getConfig(): Promise<CubeConfig> {
    return { ...this.config };
  }

  async patchConfig(patch: PatchConfig): Promise<CubeConfig> {
    Object.assign(this.config, patch);
    return { ...this.config };
  }

  async listDevices(): Promise<Device[]> {
    return [...this.devices.values()].map((d) => this.cloneDevice(d));
  }

  async getDevice(deviceId: string): Promise<Device> {
    return this.cloneDevice(this.requireDevice(deviceId));
  }

  async patchDevice(deviceId: string, patch: PatchDevice): Promise<Device> {
    const device = this.requireDevice(deviceId);
    if (patch.displayName !== undefined) device.displayName = patch.displayName;
    if (patch.room !== undefined) device.room = patch.room;
    if (patch.tags !== undefined) device.tags = [...patch.tags];
    return this.cloneDevice(device);
  }

  async setDeviceState(deviceId: string, state: Record<string, unknown>): Promise<Device> {
    const device = this.requireDevice(deviceId);
    if (!device.reachable) {
      throw new Error(`Device ${device.displayName} is unreachable`);
    }
    device.state = { ...device.state, ...state };
    return this.cloneDevice(device);
  }

  async removeDevice(deviceId: string): Promise<void> {
    if (!this.devices.delete(deviceId)) throw new Error(`Device ${deviceId} not found`);
  }

  async listProfiles(): Promise<Profile[]> {
    return [...this.profiles.values()].map((p) => ({ ...p, linkedAdults: [...p.linkedAdults] }));
  }

  async getProfile(profileId: string): Promise<Profile> {
    const profile = this.profiles.get(profileId);
    if (!profile) throw new Error(`Profile ${profileId} not found`);
    return { ...profile, linkedAdults: [...profile.linkedAdults] };
  }

  async createProfile(data: CreateProfile): Promise<Profile> {
    const normalized = normalizeCreateProfile(data);
    const profile: Profile = {
      profileId: uid('profile'),
      preferredName: normalized.preferredName,
      role: normalized.role,
      language: normalized.language ?? 'en',
      voiceVerbosity: normalized.voiceVerbosity ?? 'normal',
      internetPolicy: normalized.internetPolicy ?? defaultInternetPolicy(normalized.role),
      linkedAdults: [...(normalized.linkedAdults ?? [])],
      createdAt: new Date().toISOString(),
    };
    this.profiles.set(profile.profileId, profile);
    return { ...profile, linkedAdults: [...profile.linkedAdults] };
  }

  async patchProfile(profileId: string, patch: PatchProfile): Promise<Profile> {
    const profile = this.profiles.get(profileId);
    if (!profile) throw new Error(`Profile ${profileId} not found`);
    if (patch.internetPolicy !== undefined) {
      if (profile.role === 'child' && patch.internetPolicy !== 'never') {
        throw new Error('Child profiles must have internet policy "never"');
      }
      profile.internetPolicy = patch.internetPolicy;
    }
    if (patch.preferredName !== undefined) profile.preferredName = patch.preferredName;
    if (patch.language !== undefined) profile.language = patch.language;
    if (patch.voiceVerbosity !== undefined) profile.voiceVerbosity = patch.voiceVerbosity;
    if (patch.linkedAdults !== undefined) profile.linkedAdults = [...patch.linkedAdults];
    return { ...profile, linkedAdults: [...profile.linkedAdults] };
  }

  async removeProfile(profileId: string): Promise<void> {
    if (!this.profiles.delete(profileId)) throw new Error(`Profile ${profileId} not found`);
  }

  async listRoutines(): Promise<Routine[]> {
    return [...this.routines.values()].map((r) => this.cloneRoutine(r));
  }

  async getRoutine(routineId: string): Promise<Routine> {
    return this.cloneRoutine(this.requireRoutine(routineId));
  }

  async createRoutine(data: CreateRoutine): Promise<Routine> {
    const now = new Date().toISOString();
    const routine: Routine = {
      routineId: uid('routine'),
      name: data.name,
      ownerProfileId: data.ownerProfileId,
      enabled: data.enabled ?? true,
      triggers: data.triggers.map((t) => ({ ...t, config: { ...t.config } })),
      conditions: (data.conditions ?? []).map((c) => ({ ...c, config: { ...c.config } })),
      actions: data.actions.map((a) => ({ ...a, config: { ...a.config } })),
      createdAt: now,
      updatedAt: now,
    };
    this.routines.set(routine.routineId, routine);
    return this.cloneRoutine(routine);
  }

  async removeRoutine(routineId: string): Promise<void> {
    if (!this.routines.delete(routineId)) throw new Error(`Routine ${routineId} not found`);
  }

  async runRoutine(routineId: string, body: RunRoutineBody = {}): Promise<RoutineExecutionResult> {
    const routine = this.requireRoutine(routineId);
    if (!routine.enabled) {
      throw new Error(`Routine ${routineId} is disabled`);
    }
    const chainId = uid('chain');
    const profileId = body.profileId ?? routine.ownerProfileId;
    const results: RoutineActionResult[] = [];

    for (let actionIndex = 0; actionIndex < routine.actions.length; actionIndex++) {
      const action = routine.actions[actionIndex];
      if (!action) continue;
      try {
        if (action.type === 'device_state') {
          const deviceId = String(action.config.deviceId ?? '');
          const state = (action.config.state as Record<string, unknown> | undefined) ?? {};
          await this.setDeviceState(deviceId, state);
        }
        results.push({ actionIndex, result: 'success' });
      } catch (err) {
        results.push({
          actionIndex,
          result: 'failure',
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const entry: LogEntry = {
      chain: {
        chainId,
        deviceId: 'cube',
        chainStartTs: new Date().toISOString(),
        chainEndTs: new Date().toISOString(),
        initialProfileId: profileId,
        identifiedAtTs: null,
        identifiedProfileId: null,
        privacyModeChanges: [],
      },
      intents: [
        {
          chainId,
          intentIndex: 0,
          ts: new Date().toISOString(),
          utterance: `Run routine ${routine.name}`,
          type: 'routine_run',
          targets: [],
          parameters: { routineId },
          profileId,
        },
      ],
      actions: [],
      internetCalls: [],
    };
    this.logs.unshift(entry);

    return { chainId, results };
  }

  async getRoutineHistory(routineId: string, limit = 20): Promise<LogEntry[]> {
    await this.getRoutine(routineId);
    return this.logs
      .filter((entry) =>
        entry.intents.some((intent) => intent.type === 'routine_run' && intent.parameters.routineId === routineId)
      )
      .slice(0, limit);
  }

  async grantInternetConsent(body: GrantConsentBody): Promise<GrantConsentResponse> {
    const profile = await this.getProfile(body.profileId);
    if (profile.internetPolicy === 'never') {
      throw new Error('Internet consent denied for this profile policy');
    }
    const ttl = body.ttlMs ?? DEFAULT_CONSENT_TTL_MS;
    const expiresAtMs = Date.now() + ttl;
    this.consentExpiry.set(body.profileId, expiresAtMs);
    return { expiresAt: new Date(expiresAtMs).toISOString() };
  }

  async getInternetConsent(profileId: string): Promise<ConsentStatus> {
    const expiresAtMs = this.consentExpiry.get(profileId);
    if (expiresAtMs === undefined || expiresAtMs <= Date.now()) {
      this.consentExpiry.delete(profileId);
      return { active: false, expiresAt: null };
    }
    return { active: true, expiresAt: new Date(expiresAtMs).toISOString() };
  }

  async revokeInternetConsent(profileId: string): Promise<void> {
    this.consentExpiry.delete(profileId);
  }

  async queryLogs(params: { limit: number; offset: number }): Promise<LogEntry[]> {
    return this.logs.slice(params.offset, params.offset + params.limit);
  }

  async getChain(chainId: string): Promise<LogEntry> {
    const entry = this.logs.find((l) => l.chain.chainId === chainId);
    if (!entry) throw new Error(`Chain ${chainId} not found`);
    return entry;
  }

  async getBackupStatus(): Promise<BackupStatus> {
    return {
      lastBackup: this.backupStatus.lastBackup ? { ...this.backupStatus.lastBackup } : null,
      inProgress: this.backupStatus.inProgress,
    };
  }

  async triggerBackup(): Promise<BackupStatus> {
    this.backupStatus = {
      lastBackup: {
        backupId: uid('backup'),
        schemaVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        cubeId: this.config.cubeId,
        backupType: 'full',
        checksum: 'mock-checksum',
      },
      inProgress: false,
    };
    return this.getBackupStatus();
  }

  async restore(_request: RestoreRequest): Promise<RestoreResult> {
    return { success: true, message: 'Mock restore complete' };
  }

  async chat(message: ChatMessage): Promise<ChatResponse> {
    return {
      reply: `Mock response to: ${message.text}`,
      intent: null,
      actionsTaken: [],
    };
  }

  seedDevice(device: Device): void {
    this.devices.set(device.deviceId, {
      ...device,
      tags: [...device.tags],
      capabilities: [...device.capabilities],
      state: { ...device.state },
    });
  }

  seedProfile(profile: Profile): void {
    this.profiles.set(profile.profileId, { ...profile, linkedAdults: [...profile.linkedAdults] });
  }

  seedRoutine(routine: Routine): void {
    this.routines.set(routine.routineId, this.cloneRoutine(routine));
  }

  seedLog(entry: LogEntry): void {
    this.logs.push(entry);
  }

  private requireDevice(deviceId: string): Device {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error(`Device ${deviceId} not found`);
    return device;
  }

  private requireRoutine(routineId: string): Routine {
    const routine = this.routines.get(routineId);
    if (!routine) throw new Error(`Routine ${routineId} not found`);
    return routine;
  }

  private cloneDevice(device: Device): Device {
    return {
      ...device,
      tags: [...device.tags],
      capabilities: [...device.capabilities],
      state: { ...device.state },
    };
  }

  private cloneRoutine(routine: Routine): Routine {
    return {
      ...routine,
      triggers: routine.triggers.map((t) => ({ ...t, config: { ...t.config } })),
      conditions: routine.conditions.map((c) => ({ ...c, config: { ...c.config } })),
      actions: routine.actions.map((a) => ({ ...a, config: { ...a.config } })),
    };
  }
}
