import { describe, expect, it } from 'vitest';
import type { LogEntry, Profile } from '../src/api/types.ts';
import { MemoryLocalBackupStore } from '../src/backup/local-backup-store.ts';
import { collectIntents, filterLogEntries } from '../src/logs/filter-logs.ts';
import { buildExportPayload } from '../src/privacy/build-export-payload.ts';

const sampleLog: LogEntry = {
  chain: {
    chainId: 'c1',
    deviceId: 'dev-1',
    chainStartTs: '2026-07-25T10:00:00.000Z',
    chainEndTs: '2026-07-25T10:00:01.000Z',
    initialProfileId: 'profile-adult',
    identifiedAtTs: null,
    identifiedProfileId: null,
    privacyModeChanges: [],
  },
  intents: [
    {
      chainId: 'c1',
      intentIndex: 0,
      ts: '2026-07-25T10:00:00.000Z',
      utterance: 'Lights on',
      type: 'device_control',
      targets: ['dev-1'],
      parameters: {},
      profileId: 'profile-adult',
    },
  ],
  actions: [
    {
      chainId: 'c1',
      actionIndex: 0,
      intentIndex: 0,
      ts: '2026-07-25T10:00:01.000Z',
      deviceId: 'dev-1',
      beforeState: {},
      afterState: { on: true },
      result: 'success',
      errorMessage: null,
    },
  ],
  internetCalls: [],
};

const otherLog: LogEntry = {
  chain: {
    chainId: 'c2',
    deviceId: 'cube',
    chainStartTs: '2026-07-25T11:00:00.000Z',
    chainEndTs: null,
    initialProfileId: 'profile-child',
    identifiedAtTs: null,
    identifiedProfileId: 'profile-child',
    privacyModeChanges: [],
  },
  intents: [
    {
      chainId: 'c2',
      intentIndex: 0,
      ts: '2026-07-25T11:00:00.000Z',
      utterance: 'Search',
      type: 'question',
      targets: [],
      parameters: {},
      profileId: 'profile-child',
    },
  ],
  actions: [],
  internetCalls: [
    {
      chainId: 'c2',
      callIndex: 0,
      ts: '2026-07-25T11:00:00.500Z',
      deviceId: 'cube',
      profileId: 'profile-child',
      summary: 'blocked',
      serviceCategory: 'search',
      endpoint: 'https://x',
      result: 'blocked',
      errorMessage: 'never',
    },
  ],
};

describe('buildExportPayload', () => {
  it('serialises profiles and logs to JSON', () => {
    const profiles: Profile[] = [
      {
        profileId: 'p1',
        preferredName: 'Alex',
        role: 'adult',
        language: 'en',
        voiceVerbosity: 'normal',
        internetPolicy: 'ask_every_time',
        linkedAdults: [],
        createdAt: '2026-07-25T00:00:00.000Z',
      },
    ];
    const json = buildExportPayload({
      profiles,
      logs: [sampleLog],
      exportedAt: '2026-07-25T12:00:00.000Z',
    });
    const parsed = JSON.parse(json) as { exportedAt: string; profiles: Profile[]; logs: LogEntry[] };
    expect(parsed.exportedAt).toBe('2026-07-25T12:00:00.000Z');
    expect(parsed.profiles).toHaveLength(1);
    expect(parsed.profiles[0]?.preferredName).toBe('Alex');
    expect(parsed.logs).toHaveLength(1);
    expect(parsed.logs[0]?.chain.chainId).toBe('c1');
  });
});

describe('MemoryLocalBackupStore', () => {
  it('saves, lists, and gets backups', () => {
    const store = new MemoryLocalBackupStore();
    store.save({
      manifest: {
        backupId: 'b-1',
        schemaVersion: '1.0.0',
        createdAt: '2026-07-25T12:00:00.000Z',
        cubeId: 'mock-cube',
        backupType: 'full',
        checksum: 'x',
      },
      profiles: [],
      routines: [],
      settings: {
        cubeId: 'mock-cube',
        defaultPrivacyMode: 'paranoid',
        offlineModeEnabled: false,
        timezone: 'Europe/London',
        locale: 'en',
        wakeWord: 'hey wisdom',
        voiceVerbosity: 'normal',
      },
      memories: [],
      devices: [],
      logs_intents: [],
      logs_actions: [],
      logs_internet_calls: [],
    });
    expect(store.size).toBe(1);
    expect(store.list()[0]?.backupId).toBe('b-1');
    expect(store.get('b-1')?.manifest.checksum).toBe('x');
    expect(store.get('missing')).toBeUndefined();
    store.clear();
    expect(store.size).toBe(0);
  });
});

describe('filterLogEntries / collectIntents', () => {
  it('filters by profile and device', () => {
    const all = [sampleLog, otherLog];
    expect(filterLogEntries(all, {})).toHaveLength(2);
    expect(filterLogEntries(all, { profileId: 'profile-adult' })).toEqual([sampleLog]);
    expect(filterLogEntries(all, { deviceId: 'dev-1' })).toEqual([sampleLog]);
    expect(filterLogEntries(all, { profileId: 'profile-child', deviceId: 'cube' })).toEqual([otherLog]);
  });

  it('collects intents newest first', () => {
    const intents = collectIntents([sampleLog, otherLog]);
    expect(intents.map((i) => i.chainId)).toEqual(['c2', 'c1']);
  });
});
