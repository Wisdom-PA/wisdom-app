import type { CubeClient } from './cube-client.ts';
import type {
  BackupStatus,
  ChatMessage,
  ChatResponse,
  CreateProfile,
  CreateRoutine,
  CubeConfig,
  CubeStatus,
  Device,
  LogEntry,
  PatchConfig,
  PatchDevice,
  PatchProfile,
  Profile,
  RestoreRequest,
  RestoreResult,
  Routine,
} from './types.ts';

let nextId = 1;
function uid(): string {
  return `mock-${nextId++}`;
}

export class MockCubeClient implements CubeClient {
  private config: CubeConfig = {
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
  private backupStatus: BackupStatus = { lastBackup: null, inProgress: false };

  async getStatus(): Promise<CubeStatus> {
    return {
      version: '0.1.0',
      uptime: 3600,
      privacyMode: this.config.defaultPrivacyMode,
      onlineMode: !this.config.offlineModeEnabled,
      connectedDevices: this.devices.size,
      activeProfiles: this.profiles.size,
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
    return [...this.devices.values()];
  }

  async getDevice(deviceId: string): Promise<Device> {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error(`Device ${deviceId} not found`);
    return { ...device };
  }

  async patchDevice(deviceId: string, patch: PatchDevice): Promise<Device> {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error(`Device ${deviceId} not found`);
    Object.assign(device, patch);
    return { ...device };
  }

  async removeDevice(deviceId: string): Promise<void> {
    if (!this.devices.delete(deviceId)) throw new Error(`Device ${deviceId} not found`);
  }

  async listProfiles(): Promise<Profile[]> {
    return [...this.profiles.values()];
  }

  async getProfile(profileId: string): Promise<Profile> {
    const profile = this.profiles.get(profileId);
    if (!profile) throw new Error(`Profile ${profileId} not found`);
    return { ...profile };
  }

  async createProfile(data: CreateProfile): Promise<Profile> {
    const profile: Profile = {
      profileId: uid(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.profiles.set(profile.profileId, profile);
    return { ...profile };
  }

  async patchProfile(profileId: string, patch: PatchProfile): Promise<Profile> {
    const profile = this.profiles.get(profileId);
    if (!profile) throw new Error(`Profile ${profileId} not found`);
    Object.assign(profile, patch);
    return { ...profile };
  }

  async removeProfile(profileId: string): Promise<void> {
    if (!this.profiles.delete(profileId)) throw new Error(`Profile ${profileId} not found`);
  }

  async listRoutines(): Promise<Routine[]> {
    return [...this.routines.values()];
  }

  async getRoutine(routineId: string): Promise<Routine> {
    const routine = this.routines.get(routineId);
    if (!routine) throw new Error(`Routine ${routineId} not found`);
    return { ...routine };
  }

  async createRoutine(data: CreateRoutine): Promise<Routine> {
    const routine: Routine = {
      routineId: uid(),
      ...data,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    this.routines.set(routine.routineId, routine);
    return { ...routine };
  }

  async removeRoutine(routineId: string): Promise<void> {
    if (!this.routines.delete(routineId)) throw new Error(`Routine ${routineId} not found`);
  }

  async queryLogs(params: { limit: number; offset: number }): Promise<LogEntry[]> {
    return this.logs.slice(params.offset, params.offset + params.limit);
  }

  async getChain(chainId: string): Promise<LogEntry> {
    const entry = this.logs.find((l) => l.chainId === chainId);
    if (!entry) throw new Error(`Chain ${chainId} not found`);
    return entry;
  }

  async getBackupStatus(): Promise<BackupStatus> {
    return { ...this.backupStatus };
  }

  async triggerBackup(): Promise<BackupStatus> {
    this.backupStatus = {
      lastBackup: {
        backupId: uid(),
        schemaVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        cubeId: 'mock-cube',
        backupType: 'full',
        checksum: 'mock-checksum',
      },
      inProgress: false,
    };
    return { ...this.backupStatus };
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
    this.devices.set(device.deviceId, device);
  }

  seedLog(entry: LogEntry): void {
    this.logs.push(entry);
  }
}
