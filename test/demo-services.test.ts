import { describe, expect, it } from 'vitest';
import { createSeededMockClient, SCENE_ROUTINE_IDS } from '../src/demo/demo-services.ts';

describe('createSeededMockClient', () => {
  it('seeds devices, profiles, and scene routines', async () => {
    const client = createSeededMockClient();
    const [devices, profiles, routines] = await Promise.all([
      client.listDevices(),
      client.listProfiles(),
      client.listRoutines(),
    ]);
    expect(devices.length).toBeGreaterThanOrEqual(3);
    expect(profiles.some((p) => p.role === 'child')).toBe(true);
    for (const id of SCENE_ROUTINE_IDS) {
      expect(routines.some((r) => r.routineId === id)).toBe(true);
    }
  });
});
