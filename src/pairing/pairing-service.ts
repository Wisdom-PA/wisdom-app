export type PairingErrorCode = 'discovery_failed' | 'pair_failed' | 'not_found' | 'already_paired' | 'not_paired';

export class PairingError extends Error {
  readonly code: PairingErrorCode;

  constructor(code: PairingErrorCode, message: string) {
    super(message);
    this.name = 'PairingError';
    this.code = code;
  }
}

export interface DiscoveredCube {
  cubeId: string;
  displayName: string;
  signalStrength: number;
  alreadyPaired: boolean;
}

export interface PairingSession {
  cubeId: string;
  displayName: string;
  sessionToken: string;
  pairedAt: string;
}

export interface SessionStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class MemorySessionStore implements SessionStore {
  private readonly data = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }
}

export interface PairingService {
  discover(): Promise<DiscoveredCube[]>;
  pair(cubeId: string): Promise<PairingSession>;
  getSession(): Promise<PairingSession | null>;
  reconnect(): Promise<PairingSession>;
  disconnect(): Promise<void>;
}

export const PAIRING_SESSION_KEY = 'wisdom.pairing.session';
