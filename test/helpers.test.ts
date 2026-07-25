import { describe, expect, it } from 'vitest';
import type { Device } from '../src/api/types.ts';
import { groupDevicesByRoom, isDeviceOn } from '../src/devices/group-by-room.ts';
import {
  allowedInternetPolicies,
  assertInternetPolicyForRole,
  defaultInternetPolicy,
  normalizeCreateProfile,
} from '../src/profiles/policy.ts';

describe('groupDevicesByRoom', () => {
  const devices: Device[] = [
    {
      deviceId: 'b',
      displayName: 'B Lamp',
      room: 'Kitchen',
      tags: [],
      capabilities: ['on_off'],
      reachable: true,
      state: { on: true },
    },
    {
      deviceId: 'a',
      displayName: 'A Lamp',
      room: 'Kitchen',
      tags: [],
      capabilities: ['on_off'],
      reachable: true,
      state: { on: false },
    },
    {
      deviceId: 'c',
      displayName: 'Hall',
      room: null,
      tags: [],
      capabilities: ['on_off'],
      reachable: false,
      state: {},
    },
    {
      deviceId: 'd',
      displayName: 'Spare',
      room: '   ',
      tags: [],
      capabilities: ['on_off'],
      reachable: true,
      state: { on: false },
    },
  ];

  it('groups and sorts rooms and devices', () => {
    const groups = groupDevicesByRoom(devices);
    expect(groups.map((g) => g.room)).toEqual(['Kitchen', 'Unassigned']);
    expect(groups[0]?.devices.map((d) => d.displayName)).toEqual(['A Lamp', 'B Lamp']);
    expect(groups[1]?.devices).toHaveLength(2);
  });

  it('detects on state', () => {
    const onDevice = devices[0];
    const offDevice = devices[1];
    expect(onDevice && isDeviceOn(onDevice)).toBe(true);
    expect(offDevice && isDeviceOn(offDevice)).toBe(false);
  });
});

describe('profile policy helpers', () => {
  it('locks child policies to never', () => {
    expect(allowedInternetPolicies('child')).toEqual(['never']);
    expect(defaultInternetPolicy('child')).toBe('never');
    expect(defaultInternetPolicy('guest')).toBe('ask_every_time');
    expect(normalizeCreateProfile({ preferredName: ' Kid ', role: 'child' }).internetPolicy).toBe('never');
    expect(
      normalizeCreateProfile({
        preferredName: 'Adult',
        role: 'adult',
        internetPolicy: 'allowed_with_prompt',
        language: 'cy',
        voiceVerbosity: 'short',
        linkedAdults: ['x'],
      }).internetPolicy
    ).toBe('allowed_with_prompt');
  });

  it('allows adult policies and asserts invalid ones', () => {
    expect(allowedInternetPolicies('adult')).toContain('allowed_with_prompt');
    expect(() => assertInternetPolicyForRole('adult', 'ask_every_time')).not.toThrow();
    expect(() => assertInternetPolicyForRole('child', 'ask_every_time')).toThrow();
    expect(() =>
      normalizeCreateProfile({ preferredName: 'X', role: 'child', internetPolicy: 'ask_every_time' })
    ).toThrow('never');
    expect(normalizeCreateProfile({ preferredName: 'Ok', role: 'child', internetPolicy: 'never' }).internetPolicy).toBe(
      'never'
    );
  });
});
