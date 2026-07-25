import type { LogEntry, LogIntent } from '../api/types.ts';

export interface LogFilters {
  profileId?: string | null;
  deviceId?: string | null;
}

export function filterLogEntries(entries: LogEntry[], filters: LogFilters): LogEntry[] {
  const profileId = filters.profileId?.trim() || null;
  const deviceId = filters.deviceId?.trim() || null;
  if (!profileId && !deviceId) return entries;

  return entries.filter((entry) => {
    const matchesProfile =
      !profileId ||
      entry.chain.initialProfileId === profileId ||
      entry.chain.identifiedProfileId === profileId ||
      entry.intents.some((i) => i.profileId === profileId) ||
      entry.internetCalls.some((c) => c.profileId === profileId);

    const matchesDevice =
      !deviceId ||
      entry.chain.deviceId === deviceId ||
      entry.actions.some((a) => a.deviceId === deviceId) ||
      entry.internetCalls.some((c) => c.deviceId === deviceId);

    return matchesProfile && matchesDevice;
  });
}

/** Conversation history = intents only (F9.T8). */
export function collectIntents(entries: LogEntry[]): LogIntent[] {
  return entries.flatMap((e) => e.intents).sort((a, b) => b.ts.localeCompare(a.ts));
}
