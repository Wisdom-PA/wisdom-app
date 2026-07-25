import type { BackupManifest, BackupPayload } from '../api/types.ts';

/**
 * In-memory stand-in for mobile “stored backups”.
 * Real encrypted-at-rest filesystem storage is deferred (Phase 11 software v1).
 */
export class MemoryLocalBackupStore {
  private readonly backups = new Map<string, BackupPayload>();

  save(payload: BackupPayload): void {
    this.backups.set(payload.manifest.backupId, structuredClone(payload));
  }

  list(): BackupManifest[] {
    return [...this.backups.values()]
      .map((b) => ({ ...b.manifest }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(backupId: string): BackupPayload | undefined {
    const found = this.backups.get(backupId);
    return found ? structuredClone(found) : undefined;
  }

  clear(): void {
    this.backups.clear();
  }

  get size(): number {
    return this.backups.size;
  }
}
