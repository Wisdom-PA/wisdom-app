import { MockCubeClient } from '../api/mock-cube-client.ts';
import { MockPairingService } from '../pairing/mock-pairing-service.ts';
import { MemorySessionStore } from '../pairing/pairing-service.ts';
import { MockWifiProvisioner } from '../wifi/mock-wifi-provisioner.ts';

/** Shared in-memory store so pairing session survives screen navigations in the demo app. */
export const demoSessionStore = new MemorySessionStore();
export const demoPairingService = new MockPairingService({ store: demoSessionStore });
export const demoWifiProvisioner = new MockWifiProvisioner();

export function createSeededMockClient(): MockCubeClient {
  const client = new MockCubeClient();
  const now = new Date().toISOString();

  client.seedProfile({
    profileId: 'profile-adult',
    preferredName: 'Alex',
    role: 'adult',
    language: 'en',
    voiceVerbosity: 'normal',
    internetPolicy: 'ask_every_time',
    linkedAdults: [],
    createdAt: now,
  });
  client.seedProfile({
    profileId: 'profile-child',
    preferredName: 'Sam',
    role: 'child',
    language: 'en',
    voiceVerbosity: 'short',
    internetPolicy: 'never',
    linkedAdults: ['profile-adult'],
    createdAt: now,
  });

  client.seedDevice({
    deviceId: 'dev-sofa-lamp',
    displayName: 'Sofa Lamp',
    room: 'Living Room',
    tags: ['light'],
    capabilities: ['on_off', 'dimmable'],
    reachable: true,
    state: { on: false, brightness: 40 },
  });
  client.seedDevice({
    deviceId: 'dev-ceiling',
    displayName: 'Ceiling Lights',
    room: 'Living Room',
    tags: ['light'],
    capabilities: ['on_off'],
    reachable: true,
    state: { on: true },
  });
  client.seedDevice({
    deviceId: 'dev-kitchen',
    displayName: 'Kitchen Pendant',
    room: 'Kitchen',
    tags: ['light'],
    capabilities: ['on_off', 'dimmable'],
    reachable: true,
    state: { on: false, brightness: 70 },
  });
  client.seedDevice({
    deviceId: 'dev-offline',
    displayName: 'Garden Light',
    room: 'Garden',
    tags: ['light'],
    capabilities: ['on_off'],
    reachable: false,
    state: { on: false },
  });

  client.seedRoutine({
    routineId: 'scene-good-morning',
    name: 'Good morning',
    ownerProfileId: 'profile-adult',
    enabled: true,
    triggers: [{ type: 'voice_phrase', config: { phrase: 'good morning' } }],
    conditions: [],
    actions: [
      { type: 'device_state', config: { deviceId: 'dev-sofa-lamp', state: { on: true, brightness: 80 } } },
      { type: 'device_state', config: { deviceId: 'dev-kitchen', state: { on: true, brightness: 90 } } },
    ],
    createdAt: now,
    updatedAt: now,
  });
  client.seedRoutine({
    routineId: 'scene-movie-time',
    name: 'Movie time',
    ownerProfileId: 'profile-adult',
    enabled: true,
    triggers: [{ type: 'voice_phrase', config: { phrase: 'movie time' } }],
    conditions: [],
    actions: [
      { type: 'device_state', config: { deviceId: 'dev-ceiling', state: { on: false } } },
      { type: 'device_state', config: { deviceId: 'dev-sofa-lamp', state: { on: true, brightness: 20 } } },
    ],
    createdAt: now,
    updatedAt: now,
  });
  client.seedRoutine({
    routineId: 'scene-away',
    name: 'Away',
    ownerProfileId: 'profile-adult',
    enabled: true,
    triggers: [{ type: 'voice_phrase', config: { phrase: 'i am leaving' } }],
    conditions: [],
    actions: [
      { type: 'device_state', config: { deviceId: 'dev-sofa-lamp', state: { on: false } } },
      { type: 'device_state', config: { deviceId: 'dev-ceiling', state: { on: false } } },
      { type: 'device_state', config: { deviceId: 'dev-kitchen', state: { on: false } } },
    ],
    createdAt: now,
    updatedAt: now,
  });
  client.seedRoutine({
    routineId: 'routine-evening',
    name: 'Evening wind-down',
    ownerProfileId: 'profile-adult',
    enabled: true,
    triggers: [{ type: 'time', config: { hour: 21, minute: 0 } }],
    conditions: [],
    actions: [{ type: 'device_state', config: { deviceId: 'dev-sofa-lamp', state: { on: true, brightness: 30 } } }],
    createdAt: now,
    updatedAt: now,
  });

  return client;
}

/** Singleton demo client for Expo screens (software-only Phase 10). */
export const demoCubeClient = createSeededMockClient();

export const SCENE_ROUTINE_IDS = ['scene-good-morning', 'scene-movie-time', 'scene-away'] as const;
