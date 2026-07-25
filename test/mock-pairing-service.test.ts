import { beforeEach, describe, expect, it } from 'vitest';
import { MockPairingService } from '../src/pairing/mock-pairing-service.ts';
import { MemorySessionStore, PairingError } from '../src/pairing/pairing-service.ts';

describe('MockPairingService', () => {
  let service: MockPairingService;

  beforeEach(() => {
    service = new MockPairingService({ store: new MemorySessionStore() });
  });

  it('discovers cubes', async () => {
    const cubes = await service.discover();
    expect(cubes.length).toBeGreaterThan(0);
    expect(cubes.every((c) => c.cubeId && c.displayName)).toBe(true);
  });

  it('pairs, stores session, reconnects, and disconnects', async () => {
    const cubes = await service.discover();
    const target = cubes[0];
    expect(target).toBeDefined();
    if (!target) return;

    const session = await service.pair(target.cubeId);
    expect(session.sessionToken).toContain(target.cubeId);
    expect(await service.getSession()).toEqual(session);

    const reconnected = await service.reconnect();
    expect(reconnected.sessionToken).toContain('reconnected');

    await service.disconnect();
    expect(await service.getSession()).toBeNull();
  });

  it('surfaces discovery and pair errors', async () => {
    service.setFailDiscovery(true);
    await expect(service.discover()).rejects.toBeInstanceOf(PairingError);

    service = new MockPairingService({
      store: new MemorySessionStore(),
      failPairIds: new Set(['cube-living']),
    });
    await expect(service.pair('cube-living')).rejects.toMatchObject({ code: 'pair_failed' });
    await expect(service.pair('missing')).rejects.toMatchObject({ code: 'not_found' });
    await expect(service.reconnect()).rejects.toMatchObject({ code: 'not_paired' });
  });

  it('rejects double-pair and clears corrupt session', async () => {
    const store = new MemorySessionStore();
    service = new MockPairingService({ store });
    await service.pair('cube-living');
    await expect(service.pair('cube-living')).rejects.toMatchObject({ code: 'already_paired' });

    await store.setItem('wisdom.pairing.session', '{not-json');
    expect(await service.getSession()).toBeNull();
  });

  it('works with default constructor options', async () => {
    const defaults = new MockPairingService();
    const cubes = await defaults.discover();
    expect(cubes.length).toBeGreaterThan(0);
  });
});
