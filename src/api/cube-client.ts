import type {
  BackupPayload,
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
  MemoryItem,
  PatchConfig,
  PatchDevice,
  PatchProfile,
  Profile,
  RestoreRequest,
  RestoreResult,
  Routine,
  RoutineExecutionResult,
  RunRoutineBody,
} from './types.ts';

export interface CubeClient {
  getStatus(): Promise<CubeStatus>;

  getConfig(): Promise<CubeConfig>;
  patchConfig(patch: PatchConfig): Promise<CubeConfig>;

  listDevices(): Promise<Device[]>;
  getDevice(deviceId: string): Promise<Device>;
  patchDevice(deviceId: string, patch: PatchDevice): Promise<Device>;
  /** Local/mock control path — cube HTTP does not yet expose applyState. */
  setDeviceState(deviceId: string, state: Record<string, unknown>): Promise<Device>;
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
  runRoutine(routineId: string, body?: RunRoutineBody): Promise<RoutineExecutionResult>;
  getRoutineHistory(routineId: string, limit?: number): Promise<LogEntry[]>;

  grantInternetConsent(body: GrantConsentBody): Promise<GrantConsentResponse>;
  getInternetConsent(profileId: string): Promise<ConsentStatus>;
  revokeInternetConsent(profileId: string): Promise<void>;

  queryLogs(params: { limit: number; offset: number }): Promise<LogEntry[]>;
  getChain(chainId: string): Promise<LogEntry>;
  /** Clears in-memory / cube behaviour logs (privacy delete-all). */
  clearLogs(): Promise<void>;

  listMemories(): Promise<MemoryItem[]>;

  getBackupStatus(): Promise<BackupStatus>;
  triggerBackup(): Promise<BackupStatus>;
  /** Full backup payload (F10.T1). Optional until cube exposes GET /backup/:id. */
  getBackup(backupId: string): Promise<BackupPayload>;
  restore(request: RestoreRequest): Promise<RestoreResult>;

  chat(message: ChatMessage): Promise<ChatResponse>;
}
