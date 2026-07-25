# 2026-07-25 — Phase 11 transparency, privacy, backup UI (software)

## Checklist

- [x] Logs tab timeline + filters + chain detail (F9.T7 software)
- [x] Privacy history, delete-all, export helper, memory placeholder (F9.T8)
- [x] Backup status / trigger / local store / dry-run restore (F9.T9)
- [x] Mock `getBackup` F10.T1 payload + `clearLogs` / `listMemories`
- [x] Vitest for export, local store, filters, mock/http client
- [ ] Human: real BLE; remote encrypted cloud backup server; legal review
- [ ] Deferred: encrypted-at-rest mobile filesystem for backups

## Summary

Software-only Phase 11 companion UX: transparency logs, privacy controls, and
backup/restore against the seeded mock cube client. Local backups are an
in-memory store (not encrypted at rest).

## Deployment Checklist

- [ ] No new env vars
- [ ] Confirm Expo Logs + Settings screens against `demoCubeClient`
- [ ] Cube `GET /backup/:id` / `DELETE /logs` still optional until Phase 11 cube lands
