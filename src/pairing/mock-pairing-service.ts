import {
  type DiscoveredCube,
  MemorySessionStore,
  PAIRING_SESSION_KEY,
  PairingError,
  type PairingService,
  type PairingSession,
  type SessionStore,
} from './pairing-service.ts';

const DEFAULT_CUBES: DiscoveredCube[] = [
  { cubeId: 'cube-living', displayName: 'Living Room Cube', signalStrength: -42, alreadyPaired: false },
  { cubeId: 'cube-kitchen', displayName: 'Kitchen Cube', signalStrength: -58, alreadyPaired: false },
  { cubeId: 'cube-office', displayName: 'Office Cube', signalStrength: -71, alreadyPaired: false },
];

export interface MockPairingOptions {
  store?: SessionStore;
  cubes?: DiscoveredCube[];
  /** When true, discover() rejects with discovery_failed. */
  failDiscovery?: boolean;
  /** Cube ids that reject pair(). */
  failPairIds?: Set<string>;
}

export class MockPairingService implements PairingService {
  private readonly store: SessionStore;
  private readonly cubes: DiscoveredCube[];
  private failDiscovery: boolean;
  private readonly failPairIds: Set<string>;

  constructor(options: MockPairingOptions = {}) {
    this.store = options.store ?? new MemorySessionStore();
    this.cubes = (options.cubes ?? DEFAULT_CUBES).map((c) => ({ ...c }));
    this.failDiscovery = options.failDiscovery ?? false;
    this.failPairIds = options.failPairIds ?? new Set();
  }

  setFailDiscovery(value: boolean): void {
    this.failDiscovery = value;
  }

  async discover(): Promise<DiscoveredCube[]> {
    if (this.failDiscovery) {
      throw new PairingError('discovery_failed', 'Could not scan for cubes (mock failure)');
    }
    const session = await this.getSession();
    return this.cubes.map((cube) => ({
      ...cube,
      alreadyPaired: session?.cubeId === cube.cubeId,
    }));
  }

  async pair(cubeId: string): Promise<PairingSession> {
    const cube = this.cubes.find((c) => c.cubeId === cubeId);
    if (!cube) {
      throw new PairingError('not_found', `Cube ${cubeId} was not found`);
    }
    if (this.failPairIds.has(cubeId)) {
      throw new PairingError('pair_failed', `Pairing with ${cube.displayName} failed`);
    }
    const existing = await this.getSession();
    if (existing?.cubeId === cubeId) {
      throw new PairingError('already_paired', `${cube.displayName} is already paired`);
    }
    const session: PairingSession = {
      cubeId: cube.cubeId,
      displayName: cube.displayName,
      sessionToken: `mock-token-${cube.cubeId}`,
      pairedAt: new Date().toISOString(),
    };
    await this.store.setItem(PAIRING_SESSION_KEY, JSON.stringify(session));
    return { ...session };
  }

  async getSession(): Promise<PairingSession | null> {
    const raw = await this.store.getItem(PAIRING_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PairingSession;
    } catch {
      await this.store.removeItem(PAIRING_SESSION_KEY);
      return null;
    }
  }

  async reconnect(): Promise<PairingSession> {
    const session = await this.getSession();
    if (!session) {
      throw new PairingError('not_paired', 'No paired cube to reconnect');
    }
    const refreshed: PairingSession = {
      ...session,
      sessionToken: `mock-token-${session.cubeId}-reconnected`,
      pairedAt: session.pairedAt,
    };
    await this.store.setItem(PAIRING_SESSION_KEY, JSON.stringify(refreshed));
    return { ...refreshed };
  }

  async disconnect(): Promise<void> {
    await this.store.removeItem(PAIRING_SESSION_KEY);
  }
}
