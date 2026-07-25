import type { ExportPayload, LogEntry, Profile } from '../api/types.ts';

export function buildExportPayload(input: { profiles: Profile[]; logs: LogEntry[]; exportedAt?: string }): string {
  const payload: ExportPayload = {
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    profiles: input.profiles.map((p) => ({ ...p, linkedAdults: [...p.linkedAdults] })),
    logs: input.logs,
  };
  return JSON.stringify(payload);
}
