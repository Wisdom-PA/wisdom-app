import type { Device } from '../api/types.ts';

export interface RoomGroup {
  room: string;
  devices: Device[];
}

/** Groups devices by room; null/empty room becomes "Unassigned". */
export function groupDevicesByRoom(devices: Device[]): RoomGroup[] {
  const map = new Map<string, Device[]>();
  for (const device of devices) {
    const room = device.room?.trim() || 'Unassigned';
    const list = map.get(room);
    if (list) {
      list.push(device);
    } else {
      map.set(room, [device]);
    }
  }
  return [...map.entries()]
    .map(([room, roomDevices]) => ({
      room,
      devices: [...roomDevices].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    }))
    .sort((a, b) => a.room.localeCompare(b.room));
}

export function isDeviceOn(device: Device): boolean {
  return device.state.on === true;
}
