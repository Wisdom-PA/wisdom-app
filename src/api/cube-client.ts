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

export interface CubeClient {
  getStatus(): Promise<CubeStatus>;

  getConfig(): Promise<CubeConfig>;
  patchConfig(patch: PatchConfig): Promise<CubeConfig>;

  listDevices(): Promise<Device[]>;
  getDevice(deviceId: string): Promise<Device>;
  patchDevice(deviceId: string, patch: PatchDevice): Promise<Device>;
  removeDevice(deviceId: string): Promise<void>;

  listProfiles(): Promise<Profile[]>;
  getProfile(profileId: string): Promise<Profile>;
  createProfile(data: CreateProfile): Promise<Profile>;
  patchProfile(profileId: string, patch: PatchProfile): Promise<Profile>;
  removeProfile(profileId: string): Promise<void>;

  listRoutines(): Promise<Routine[]>;
  getRoutine(routineId: string): Promise<Routine>;
  createRoutine(data: CreateRoutine): Promise<Routine>;
  removeRoutine(routineId: string): Promise<void>;

  queryLogs(params: { limit: number; offset: number }): Promise<LogEntry[]>;
  getChain(chainId: string): Promise<LogEntry>;

  getBackupStatus(): Promise<BackupStatus>;
  triggerBackup(): Promise<BackupStatus>;
  restore(request: RestoreRequest): Promise<RestoreResult>;

  chat(message: ChatMessage): Promise<ChatResponse>;
}
