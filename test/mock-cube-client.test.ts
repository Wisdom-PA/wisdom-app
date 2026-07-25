import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockCubeClient } from '../src/api/mock-cube-client.ts';
import type { Device, LogEntry } from '../src/api/types.ts';

describe('MockCubeClient', () => {
  let client: MockCubeClient;

  beforeEach(() => {
    client = new MockCubeClient();
  });

  describe('status', () => {
    it('returns cube status aligned with cube OpenAPI', async () => {
      const status = await client.getStatus();
      expect(status.version).toBe('0.1.0');
      expect(status.privacyMode).toBe('paranoid');
      expect(status.pairedDevicesCount).toBe(0);
      expect(status.offlineModeEnabled).toBe(false);
      expect(status.cubeId).toBe('mock-cube');
    });
  });

  describe('config', () => {
    it('returns default config', async () => {
      const config = await client.getConfig();
      expect(config.defaultPrivacyMode).toBe('paranoid');
      expect(config.wakeWord).toBe('hey wisdom');
      expect(config.cubeId).toBe('mock-cube');
    });

    it('patches config including offline mode', async () => {
      const updated = await client.patchConfig({ timezone: 'US/Pacific', offlineModeEnabled: true });
      expect(updated.timezone).toBe('US/Pacific');
      expect(updated.offlineModeEnabled).toBe(true);

      const status = await client.getStatus();
      expect(status.internetConnected).toBe(false);
    });
  });

  describe('devices', () => {
    const testDevice: Device = {
      deviceId: 'dev-1',
      displayName: 'Sofa Lamp',
      room: 'Living Room',
      tags: ['light'],
      capabilities: ['on_off', 'dimmable'],
      reachable: true,
      state: { on: false },
    };

    it('lists empty devices', async () => {
      expect(await client.listDevices()).toEqual([]);
    });

    it('manages devices via seed → get → patch → setState → remove', async () => {
      client.seedDevice(testDevice);

      const listed = await client.listDevices();
      expect(listed).toHaveLength(1);
      expect(listed[0]?.displayName).toBe('Sofa Lamp');
      expect(listed[0]?.reachable).toBe(true);

      const fetched = await client.getDevice('dev-1');
      expect(fetched.room).toBe('Living Room');

      const patched = await client.patchDevice('dev-1', { room: 'Bedroom' });
      expect(patched.room).toBe('Bedroom');

      const powered = await client.setDeviceState('dev-1', { on: true });
      expect(powered.state.on).toBe(true);

      await client.removeDevice('dev-1');
      expect(await client.listDevices()).toHaveLength(0);
    });

    it('throws on missing or unreachable device state', async () => {
      await expect(client.getDevice('nope')).rejects.toThrow('not found');
      await expect(client.patchDevice('nope', {})).rejects.toThrow('not found');
      await expect(client.removeDevice('nope')).rejects.toThrow('not found');
      await expect(client.setDeviceState('nope', { on: true })).rejects.toThrow('not found');

      client.seedDevice({ ...testDevice, deviceId: 'off', reachable: false });
      await expect(client.setDeviceState('off', { on: true })).rejects.toThrow('unreachable');
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

    it('defaults child internet policy to never and rejects upgrades', async () => {
      await expect(
        client.createProfile({
          preferredName: 'Kid',
          role: 'child',
          internetPolicy: 'ask_every_time',
        })
      ).rejects.toThrow('never');

      const child = await client.createProfile({ preferredName: 'Kid', role: 'child' });
      expect(child.internetPolicy).toBe('never');

      await expect(client.patchProfile(child.profileId, { internetPolicy: 'ask_every_time' })).rejects.toThrow('never');
    });

    it('throws on missing profile', async () => {
      await expect(client.getProfile('nope')).rejects.toThrow('not found');
      await expect(client.patchProfile('nope', {})).rejects.toThrow('not found');
      await expect(client.removeProfile('nope')).rejects.toThrow('not found');
    });
  });

  describe('routines', () => {
    it('creates, runs, and manages routines', async () => {
      client.seedDevice({
        deviceId: 'dev-1',
        displayName: 'Lamp',
        room: 'Living Room',
        tags: [],
        capabilities: ['on_off'],
        reachable: true,
        state: { on: false },
      });

      const created = await client.createRoutine({
        name: 'Good Morning',
        ownerProfileId: 'profile-1',
        triggers: [{ type: 'time', config: { hour: 7 } }],
        conditions: [],
        actions: [{ type: 'device_state', config: { deviceId: 'dev-1', state: { on: true } } }],
      });
      expect(created.name).toBe('Good Morning');
      expect(created.enabled).toBe(true);
      expect(created.ownerProfileId).toBe('profile-1');

      const run = await client.runRoutine(created.routineId);
      expect(run.chainId).toBeTruthy();
      expect(run.results[0]?.result).toBe('success');
      expect((await client.getDevice('dev-1')).state.on).toBe(true);

      const history = await client.getRoutineHistory(created.routineId);
      expect(history).toHaveLength(1);

      await client.removeRoutine(created.routineId);
      expect(await client.listRoutines()).toHaveLength(0);
    });

    it('records partial failure when a run action fails', async () => {
      const created = await client.createRoutine({
        name: 'Broken',
        ownerProfileId: 'p1',
        triggers: [{ type: 'voice_phrase', config: { phrase: 'go' } }],
        actions: [{ type: 'device_state', config: { deviceId: 'missing', state: { on: true } } }],
      });
      const run = await client.runRoutine(created.routineId);
      expect(run.results[0]?.result).toBe('failure');
    });

    it('covers disabled runs, optional fields, and non-device actions', async () => {
      const disabled = await client.createRoutine({
        name: 'Off',
        ownerProfileId: 'p1',
        enabled: false,
        triggers: [{ type: 'time', config: { hour: 1 } }],
        conditions: [{ type: 'presence', config: { present: true } }],
        actions: [{ type: 'notification', config: { message: 'hi' } }],
      });
      await expect(client.runRoutine(disabled.routineId)).rejects.toThrow('disabled');

      const active = await client.createRoutine({
        name: 'Notify',
        ownerProfileId: 'owner',
        triggers: [{ type: 'voice_phrase', config: { phrase: 'ping' } }],
        actions: [
          { type: 'delay', config: { ms: 1 } },
          { type: 'device_state', config: { deviceId: '' } },
        ],
      });
      const run = await client.runRoutine(active.routineId, { profileId: 'runner' });
      expect(run.results[0]?.result).toBe('success');
      expect(run.results[1]?.result).toBe('failure');
    });

    it('throws on missing routine', async () => {
      await expect(client.getRoutine('nope')).rejects.toThrow('not found');
      await expect(client.removeRoutine('nope')).rejects.toThrow('not found');
      await expect(client.runRoutine('nope')).rejects.toThrow('not found');
    });
  });

  describe('internet consent', () => {
    it('grants, reads, and revokes consent', async () => {
      const profile = await client.createProfile({
        preferredName: 'Adult',
        role: 'adult',
        internetPolicy: 'ask_every_time',
      });
      const granted = await client.grantInternetConsent({ profileId: profile.profileId });
      expect(granted.expiresAt).toBeTruthy();

      const status = await client.getInternetConsent(profile.profileId);
      expect(status.active).toBe(true);

      await client.revokeInternetConsent(profile.profileId);
      expect((await client.getInternetConsent(profile.profileId)).active).toBe(false);
    });

    it('expires consent after ttl', async () => {
      vi.useFakeTimers();
      const profile = await client.createProfile({ preferredName: 'Adult', role: 'adult' });
      await client.grantInternetConsent({ profileId: profile.profileId, ttlMs: 1000 });
      vi.advanceTimersByTime(1500);
      expect((await client.getInternetConsent(profile.profileId)).active).toBe(false);
      vi.useRealTimers();
    });

    it('rejects consent for never policy', async () => {
      const child = await client.createProfile({ preferredName: 'Kid', role: 'child' });
      await expect(client.grantInternetConsent({ profileId: child.profileId })).rejects.toThrow('denied');
    });
  });

  describe('profile patches', () => {
    it('patches optional profile fields including child never policy', async () => {
      const adult = await client.createProfile({ preferredName: 'A', role: 'adult' });
      const patched = await client.patchProfile(adult.profileId, {
        preferredName: 'A2',
        voiceVerbosity: 'short',
        linkedAdults: ['x'],
        internetPolicy: 'allowed_with_prompt',
      });
      expect(patched.preferredName).toBe('A2');
      expect(patched.voiceVerbosity).toBe('short');
      expect(patched.linkedAdults).toEqual(['x']);

      const child = await client.createProfile({ preferredName: 'C', role: 'child' });
      const kept = await client.patchProfile(child.profileId, { internetPolicy: 'never' });
      expect(kept.internetPolicy).toBe('never');
    });
  });

  describe('device patches', () => {
    it('patches displayName and tags', async () => {
      client.seedDevice({
        deviceId: 'd1',
        displayName: 'Old',
        room: 'A',
        tags: [],
        capabilities: ['on_off'],
        reachable: true,
        state: {},
      });
      const patched = await client.patchDevice('d1', { displayName: 'New', tags: ['light'] });
      expect(patched.displayName).toBe('New');
      expect(patched.tags).toEqual(['light']);
    });
  });

  describe('logs', () => {
    it('queries empty logs', async () => {
      const logs = await client.queryLogs({ limit: 10, offset: 0 });
      expect(logs).toEqual([]);
    });

    it('queries seeded logs', async () => {
      const entry: LogEntry = {
        chain: {
          chainId: 'chain-1',
          deviceId: 'dev-1',
          chainStartTs: '2026-01-01T00:00:00Z',
          chainEndTs: '2026-01-01T00:01:00Z',
          initialProfileId: 'p-1',
          identifiedAtTs: null,
          identifiedProfileId: null,
          privacyModeChanges: [],
        },
        intents: [],
        actions: [],
        internetCalls: [],
      };
      client.seedLog(entry);

      const logs = await client.queryLogs({ limit: 10, offset: 0 });
      expect(logs).toHaveLength(1);

      const chain = await client.getChain('chain-1');
      expect(chain.chain.deviceId).toBe('dev-1');
    });

    it('clears logs', async () => {
      client.seedLog({
        chain: {
          chainId: 'chain-x',
          deviceId: 'cube',
          chainStartTs: '2026-01-01T00:00:00Z',
          chainEndTs: null,
          initialProfileId: null,
          identifiedAtTs: null,
          identifiedProfileId: null,
          privacyModeChanges: [],
        },
        intents: [],
        actions: [],
        internetCalls: [],
      });
      await client.clearLogs();
      expect(await client.queryLogs({ limit: 10, offset: 0 })).toEqual([]);
    });

    it('throws on missing chain', async () => {
      await expect(client.getChain('nope')).rejects.toThrow('not found');
    });
  });

  describe('memories', () => {
    it('lists empty memories by default', async () => {
      expect(await client.listMemories()).toEqual([]);
    });

    it('lists seeded memories', async () => {
      client.seedMemory({
        memoryId: 'm1',
        profileId: 'p1',
        label: 'Favourite colour blue',
        createdAt: '2026-07-25T00:00:00.000Z',
      });
      expect(await client.listMemories()).toHaveLength(1);
    });
  });

  describe('backup', () => {
    it('returns initial backup status', async () => {
      const status = await client.getBackupStatus();
      expect(status.lastBackup).toBeNull();
      expect(status.inProgress).toBe(false);
    });

    it('triggers backup with F10.T1 payload sections', async () => {
      client.seedProfile({
        profileId: 'p1',
        preferredName: 'A',
        role: 'adult',
        language: 'en',
        voiceVerbosity: 'normal',
        internetPolicy: 'ask_every_time',
        linkedAdults: [],
        createdAt: '2026-07-25T00:00:00.000Z',
      });
      const status = await client.triggerBackup();
      expect(status.lastBackup).not.toBeNull();
      expect(status.lastBackup?.backupType).toBe('full');
      const id = status.lastBackup?.backupId;
      expect(id).toBeTruthy();
      if (!id) throw new Error('expected backup id');
      const payload = await client.getBackup(id);
      expect(payload.manifest.backupId).toBe(id);
      expect(payload.profiles).toHaveLength(1);
      expect(payload.settings.cubeId).toBe('mock-cube');
      expect(payload.routines).toEqual([]);
      expect(payload.devices).toEqual([]);
      expect(payload.memories).toEqual([]);
      expect(payload.logs_intents).toEqual([]);
    });

    it('dry-runs then restores', async () => {
      const status = await client.triggerBackup();
      const backupId = status.lastBackup?.backupId;
      expect(backupId).toBeTruthy();
      if (!backupId) throw new Error('expected backup id');
      const dry = await client.restore({ backupId, mode: 'factory_reset', dryRun: true });
      expect(dry.success).toBe(true);
      expect(dry.dryRun).toBe(true);
      const result = await client.restore({ backupId, mode: 'device_routine_recovery', dryRun: false });
      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(false);
      expect(result.mode).toBe('device_routine_recovery');
    });

    it('fails restore for unknown backup', async () => {
      const result = await client.restore({ backupId: 'missing', mode: 'factory_reset' });
      expect(result.success).toBe(false);
    });

    it('throws on missing getBackup', async () => {
      await expect(client.getBackup('nope')).rejects.toThrow('not found');
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
