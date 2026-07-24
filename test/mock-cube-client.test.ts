import { beforeEach, describe, expect, it } from 'vitest';
import { MockCubeClient } from '../src/api/mock-cube-client.ts';
import type { Device, LogEntry } from '../src/api/types.ts';

describe('MockCubeClient', () => {
  let client: MockCubeClient;

  beforeEach(() => {
    client = new MockCubeClient();
  });

  describe('status', () => {
    it('returns cube status', async () => {
      const status = await client.getStatus();
      expect(status.version).toBe('0.1.0');
      expect(status.privacyMode).toBe('paranoid');
      expect(status.connectedDevices).toBe(0);
    });
  });

  describe('config', () => {
    it('returns default config', async () => {
      const config = await client.getConfig();
      expect(config.defaultPrivacyMode).toBe('paranoid');
      expect(config.wakeWord).toBe('hey wisdom');
    });

    it('patches config', async () => {
      const updated = await client.patchConfig({ timezone: 'US/Pacific' });
      expect(updated.timezone).toBe('US/Pacific');

      const fetched = await client.getConfig();
      expect(fetched.timezone).toBe('US/Pacific');
    });
  });

  describe('devices', () => {
    const testDevice: Device = {
      deviceId: 'dev-1',
      displayName: 'Sofa Lamp',
      room: 'Living Room',
      type: 'light',
      capabilities: ['on_off', 'dimmable'],
      online: true,
      lastSeen: '2026-01-01T00:00:00Z',
    };

    it('lists empty devices', async () => {
      expect(await client.listDevices()).toEqual([]);
    });

    it('manages devices via seed → get → patch → remove', async () => {
      client.seedDevice(testDevice);

      const listed = await client.listDevices();
      expect(listed).toHaveLength(1);
      expect(listed[0]?.displayName).toBe('Sofa Lamp');

      const fetched = await client.getDevice('dev-1');
      expect(fetched.room).toBe('Living Room');

      const patched = await client.patchDevice('dev-1', { room: 'Bedroom' });
      expect(patched.room).toBe('Bedroom');

      await client.removeDevice('dev-1');
      expect(await client.listDevices()).toHaveLength(0);
    });

    it('throws on missing device', async () => {
      await expect(client.getDevice('nope')).rejects.toThrow('not found');
      await expect(client.patchDevice('nope', {})).rejects.toThrow('not found');
      await expect(client.removeDevice('nope')).rejects.toThrow('not found');
    });
  });

  describe('profiles', () => {
    it('creates and manages profiles', async () => {
      const created = await client.createProfile({
        preferredName: 'Alice',
        role: 'adult',
        language: 'en',
        voiceVerbosity: 'normal',
        internetPolicy: 'allowed_with_prompt',
        linkedAdults: [],
      });
      expect(created.preferredName).toBe('Alice');
      expect(created.profileId).toBeTruthy();

      const listed = await client.listProfiles();
      expect(listed).toHaveLength(1);

      const fetched = await client.getProfile(created.profileId);
      expect(fetched.role).toBe('adult');

      const patched = await client.patchProfile(created.profileId, { language: 'cy' });
      expect(patched.language).toBe('cy');

      await client.removeProfile(created.profileId);
      expect(await client.listProfiles()).toHaveLength(0);
    });

    it('throws on missing profile', async () => {
      await expect(client.getProfile('nope')).rejects.toThrow('not found');
      await expect(client.patchProfile('nope', {})).rejects.toThrow('not found');
      await expect(client.removeProfile('nope')).rejects.toThrow('not found');
    });
  });

  describe('routines', () => {
    it('creates and manages routines', async () => {
      const created = await client.createRoutine({
        name: 'Good Morning',
        triggers: [{ type: 'time', value: '07:00' }],
        conditions: [],
        actions: [{ type: 'device_control', target: 'dev-1', params: { state: 'on' } }],
      });
      expect(created.name).toBe('Good Morning');
      expect(created.enabled).toBe(true);

      const listed = await client.listRoutines();
      expect(listed).toHaveLength(1);

      const fetched = await client.getRoutine(created.routineId);
      expect(fetched.triggers).toHaveLength(1);

      await client.removeRoutine(created.routineId);
      expect(await client.listRoutines()).toHaveLength(0);
    });

    it('throws on missing routine', async () => {
      await expect(client.getRoutine('nope')).rejects.toThrow('not found');
      await expect(client.removeRoutine('nope')).rejects.toThrow('not found');
    });
  });

  describe('logs', () => {
    it('queries empty logs', async () => {
      const logs = await client.queryLogs({ limit: 10, offset: 0 });
      expect(logs).toEqual([]);
    });

    it('queries seeded logs', async () => {
      const entry: LogEntry = {
        chainId: 'chain-1',
        summary: {
          chainId: 'chain-1',
          deviceId: 'dev-1',
          chainStartTs: '2026-01-01T00:00:00Z',
          chainEndTs: '2026-01-01T00:01:00Z',
          initialProfileId: 'p-1',
        },
        intents: [],
        actions: [],
        internetCalls: [],
      };
      client.seedLog(entry);

      const logs = await client.queryLogs({ limit: 10, offset: 0 });
      expect(logs).toHaveLength(1);

      const chain = await client.getChain('chain-1');
      expect(chain.summary.deviceId).toBe('dev-1');
    });

    it('throws on missing chain', async () => {
      await expect(client.getChain('nope')).rejects.toThrow('not found');
    });
  });

  describe('backup', () => {
    it('returns initial backup status', async () => {
      const status = await client.getBackupStatus();
      expect(status.lastBackup).toBeNull();
      expect(status.inProgress).toBe(false);
    });

    it('triggers backup and updates status', async () => {
      const status = await client.triggerBackup();
      expect(status.lastBackup).not.toBeNull();
      expect(status.lastBackup?.backupType).toBe('full');
    });

    it('restores successfully', async () => {
      const result = await client.restore({ backupId: 'b-1', mode: 'factory_reset' });
      expect(result.success).toBe(true);
    });
  });

  describe('chat', () => {
    it('returns a mock response', async () => {
      const response = await client.chat({ text: 'Turn on the lights' });
      expect(response.reply).toContain('Turn on the lights');
      expect(response.intent).toBeNull();
    });
  });
});
