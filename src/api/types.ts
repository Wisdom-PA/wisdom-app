export interface CubeStatus {
  cubeId: string;
  version: string;
  uptimeSeconds: number;
  privacyMode: 'normal' | 'paranoid';
  internetConnected: boolean;
  offlineModeEnabled: boolean;
  pairedDevicesCount: number;
  profilesCount: number;
  activeProfileId: string | null;
}

export interface CubeConfig {
  cubeId: string;
  defaultPrivacyMode: 'normal' | 'paranoid';
  offlineModeEnabled: boolean;
  timezone: string;
  locale: string;
  wakeWord: string;
  voiceVerbosity: 'short' | 'normal';
}

export type PatchConfig = Partial<
  Pick<CubeConfig, 'defaultPrivacyMode' | 'offlineModeEnabled' | 'timezone' | 'locale' | 'wakeWord' | 'voiceVerbosity'>
>;

export type DeviceCapability = 'on_off' | 'dimmable' | 'color_temp' | 'color_rgb';

export interface Device {
  deviceId: string;
  displayName: string;
  room: string | null;
  tags: string[];
  capabilities: DeviceCapability[];
  reachable: boolean;
  state: Record<string, unknown>;
}

export type PatchDevice = {
  displayName?: string;
  room?: string | null;
  tags?: string[];
};

export type ProfileRole = 'adult' | 'guest' | 'child';
export type InternetPolicy = 'never' | 'ask_every_time' | 'allowed_with_prompt';

export interface Profile {
  profileId: string;
  preferredName: string;
  role: ProfileRole;
  language: string;
  voiceVerbosity: 'short' | 'normal';
  internetPolicy: InternetPolicy;
  linkedAdults: string[];
  createdAt: string;
}

export interface CreateProfile {
  preferredName: string;
  role: ProfileRole;
  language?: string;
  voiceVerbosity?: 'short' | 'normal';
  internetPolicy?: InternetPolicy;
  linkedAdults?: string[];
}

export type PatchProfile = Partial<
  Pick<Profile, 'preferredName' | 'language' | 'voiceVerbosity' | 'internetPolicy' | 'linkedAdults'>
>;

export interface RoutineTrigger {
  type: 'time' | 'sun_event' | 'device_event' | 'voice_phrase' | 'presence';
  config: Record<string, unknown>;
}

export interface RoutineCondition {
  type: 'time_window' | 'presence' | 'device_state';
  config: Record<string, unknown>;
}

export interface RoutineAction {
  type: 'device_state' | 'delay' | 'notification';
  config: Record<string, unknown>;
}

export interface Routine {
  routineId: string;
  name: string;
  ownerProfileId: string;
  enabled: boolean;
  triggers: RoutineTrigger[];
  conditions: RoutineCondition[];
  actions: RoutineAction[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutine {
  name: string;
  ownerProfileId: string;
  enabled?: boolean;
  triggers: RoutineTrigger[];
  conditions?: RoutineCondition[];
  actions: RoutineAction[];
}

export interface RunRoutineBody {
  profileId?: string;
}

export interface RoutineActionResult {
  actionIndex: number;
  result: 'success' | 'failure';
  errorMessage?: string;
}

export interface RoutineExecutionResult {
  chainId: string;
  results: RoutineActionResult[];
}

export interface GrantConsentBody {
  profileId: string;
  ttlMs?: number;
}

export interface GrantConsentResponse {
  expiresAt: string;
}

export interface ConsentStatus {
  active: boolean;
  expiresAt: string | null;
}

export interface LogIntent {
  chainId: string;
  intentIndex: number;
  ts: string;
  utterance: string;
  type: string;
  targets: string[];
  parameters: Record<string, string>;
  profileId: string | null;
}

export interface LogAction {
  chainId: string;
  actionIndex: number;
  intentIndex: number;
  ts: string;
  deviceId: string;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  result: 'success' | 'failure';
  errorMessage: string | null;
}

export interface LogInternetCall {
  chainId: string;
  callIndex: number;
  ts: string;
  deviceId: string;
  profileId: string | null;
  summary: string;
  serviceCategory: string;
  endpoint: string;
  result: 'allowed' | 'blocked' | 'error';
  errorMessage: string | null;
}

export interface ChainSummary {
  chainId: string;
  deviceId: string;
  chainStartTs: string;
  chainEndTs: string | null;
  initialProfileId: string | null;
  identifiedAtTs: string | null;
  identifiedProfileId: string | null;
  privacyModeChanges: Array<{
    atTs: string;
    fromMode: 'paranoid' | 'normal';
    toMode: 'paranoid' | 'normal';
    trigger: 'voice' | 'app' | 'permission_grant';
  }>;
}

export interface LogEntry {
  chain: ChainSummary;
  intents: LogIntent[];
  actions: LogAction[];
  internetCalls: LogInternetCall[];
}

export interface BackupManifest {
  backupId: string;
  schemaVersion: string;
  createdAt: string;
  cubeId: string;
  backupType: 'full';
  checksum: string;
}

/** F10.T1 full backup container (manifest + domain sections; wire keys match cube). */
export interface BackupPayload {
  manifest: BackupManifest;
  profiles: Profile[];
  routines: Routine[];
  settings: CubeConfig;
  memories: MemoryItem[];
  devices: Device[];
  logs_intents: LogIntent[];
  logs_actions: LogAction[];
  logs_internet_calls: LogInternetCall[];
}

export interface BackupStatus {
  lastBackup: BackupManifest | null;
  inProgress: boolean;
}

export interface RestoreRequest {
  backupId: string;
  mode: 'factory_reset' | 'device_routine_recovery';
  /** When true, validate only — no write. */
  dryRun?: boolean;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  backupId: string;
  mode: 'factory_reset' | 'device_routine_recovery';
  dryRun: boolean;
}

/** Placeholder memory row for privacy UI (cube memory store later). */
export interface MemoryItem {
  memoryId: string;
  profileId: string | null;
  label: string;
  createdAt: string;
}

/** Export-my-data payload (logs + profiles); serialised by buildExportPayload. */
export interface ExportPayload {
  exportedAt: string;
  profiles: Profile[];
  logs: LogEntry[];
}

export interface ChatMessage {
  text: string;
  profileId?: string;
}

export interface ChatResponse {
  reply: string;
  intent: string | null;
  actionsTaken: string[];
}
