export interface CubeStatus {
  version: string;
  uptime: number;
  privacyMode: 'normal' | 'paranoid';
  onlineMode: boolean;
  connectedDevices: number;
  activeProfiles: number;
}

export interface CubeConfig {
  defaultPrivacyMode: 'normal' | 'paranoid';
  offlineModeEnabled: boolean;
  timezone: string;
  locale: string;
  wakeWord: string;
  voiceVerbosity: 'short' | 'normal' | 'detailed';
}

export type PatchConfig = Partial<CubeConfig>;

export type DeviceCapability = 'on_off' | 'dimmable' | 'color_temp' | 'color_rgb';

export interface Device {
  deviceId: string;
  displayName: string;
  room: string;
  type: string;
  capabilities: DeviceCapability[];
  online: boolean;
  lastSeen: string;
}

export type PatchDevice = Partial<Pick<Device, 'displayName' | 'room'>>;

export type ProfileRole = 'adult' | 'guest' | 'child';
export type InternetPolicy = 'allowed' | 'allowed_with_prompt' | 'ask_every_time' | 'blocked';

export interface Profile {
  profileId: string;
  preferredName: string;
  role: ProfileRole;
  language: string;
  voiceVerbosity: 'short' | 'normal' | 'detailed';
  internetPolicy: InternetPolicy;
  linkedAdults: string[];
  createdAt: string;
}

export interface CreateProfile {
  preferredName: string;
  role: ProfileRole;
  language: string;
  voiceVerbosity: 'short' | 'normal' | 'detailed';
  internetPolicy: InternetPolicy;
  linkedAdults: string[];
}

export type PatchProfile = Partial<
  Pick<Profile, 'preferredName' | 'language' | 'voiceVerbosity' | 'internetPolicy' | 'linkedAdults'>
>;

export interface RoutineTrigger {
  type: 'time' | 'device_event' | 'voice_phrase' | 'sunrise' | 'sunset';
  value: string;
}

export interface RoutineCondition {
  type: 'time_window' | 'device_state' | 'presence';
  value: string;
}

export interface RoutineAction {
  type: 'device_control' | 'delay' | 'notification';
  target: string;
  params: Record<string, unknown>;
}

export interface Routine {
  routineId: string;
  name: string;
  enabled: boolean;
  triggers: RoutineTrigger[];
  conditions: RoutineCondition[];
  actions: RoutineAction[];
  createdAt: string;
}

export interface CreateRoutine {
  name: string;
  triggers: RoutineTrigger[];
  conditions: RoutineCondition[];
  actions: RoutineAction[];
}

export interface LogIntent {
  intentIndex: number;
  ts: string;
  utterance: string;
  type: string;
  targets: string[];
  parameters: Record<string, unknown>;
  profileId: string;
}

export interface LogAction {
  actionIndex: number;
  intentIndex: number;
  ts: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  result: string;
  error: string | null;
}

export interface LogInternetCall {
  callIndex: number;
  ts: string;
  deviceId: string;
  profileId: string;
  metadata: string;
  serviceCategory: string;
  endpoint: string;
  result: string;
  error: string | null;
}

export interface ChainSummary {
  chainId: string;
  deviceId: string;
  chainStartTs: string;
  chainEndTs: string;
  initialProfileId: string;
}

export interface LogEntry {
  chainId: string;
  summary: ChainSummary;
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

export interface BackupStatus {
  lastBackup: BackupManifest | null;
  inProgress: boolean;
}

export interface RestoreRequest {
  backupId: string;
  mode: 'factory_reset' | 'reset_with_recovery';
}

export interface RestoreResult {
  success: boolean;
  message: string;
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
