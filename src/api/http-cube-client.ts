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

export class HttpCubeClient implements CubeClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const msg = (body as { error?: { message?: string } })?.error?.message ?? res.statusText;
      throw new Error(`Cube API ${res.status}: ${msg}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  async getStatus(): Promise<CubeStatus> {
    return this.request('/status');
  }

  async getConfig(): Promise<CubeConfig> {
    return this.request('/config');
  }
  async patchConfig(patch: PatchConfig): Promise<CubeConfig> {
    return this.request('/config', { method: 'PATCH', body: JSON.stringify(patch) });
  }

  async listDevices(): Promise<Device[]> {
    return this.request('/devices');
  }
  async getDevice(deviceId: string): Promise<Device> {
    return this.request(`/devices/${deviceId}`);
  }
  async patchDevice(deviceId: string, patch: PatchDevice): Promise<Device> {
    return this.request(`/devices/${deviceId}`, { method: 'PATCH', body: JSON.stringify(patch) });
  }
  async removeDevice(deviceId: string): Promise<void> {
    return this.request(`/devices/${deviceId}`, { method: 'DELETE' });
  }

  async listProfiles(): Promise<Profile[]> {
    return this.request('/profiles');
  }
  async getProfile(profileId: string): Promise<Profile> {
    return this.request(`/profiles/${profileId}`);
  }
  async createProfile(data: CreateProfile): Promise<Profile> {
    return this.request('/profiles', { method: 'POST', body: JSON.stringify(data) });
  }
  async patchProfile(profileId: string, patch: PatchProfile): Promise<Profile> {
    return this.request(`/profiles/${profileId}`, { method: 'PATCH', body: JSON.stringify(patch) });
  }
  async removeProfile(profileId: string): Promise<void> {
    return this.request(`/profiles/${profileId}`, { method: 'DELETE' });
  }

  async listRoutines(): Promise<Routine[]> {
    return this.request('/routines');
  }
  async getRoutine(routineId: string): Promise<Routine> {
    return this.request(`/routines/${routineId}`);
  }
  async createRoutine(data: CreateRoutine): Promise<Routine> {
    return this.request('/routines', { method: 'POST', body: JSON.stringify(data) });
  }
  async removeRoutine(routineId: string): Promise<void> {
    return this.request(`/routines/${routineId}`, { method: 'DELETE' });
  }

  async queryLogs(params: { limit: number; offset: number }): Promise<LogEntry[]> {
    return this.request(`/logs?limit=${params.limit}&offset=${params.offset}`);
  }
  async getChain(chainId: string): Promise<LogEntry> {
    return this.request(`/logs/${chainId}`);
  }

  async getBackupStatus(): Promise<BackupStatus> {
    return this.request('/backup/status');
  }
  async triggerBackup(): Promise<BackupStatus> {
    return this.request('/backup/trigger', { method: 'POST' });
  }
  async restore(request: RestoreRequest): Promise<RestoreResult> {
    return this.request('/backup/restore', { method: 'POST', body: JSON.stringify(request) });
  }

  async chat(message: ChatMessage): Promise<ChatResponse> {
    return this.request('/chat', { method: 'POST', body: JSON.stringify(message) });
  }
}
