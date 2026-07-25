# wisdom-app

Wisdom mobile companion: Expo / React Native shell plus a publishable TypeScript
cube API client (`MockCubeClient` / `HttpCubeClient`).

Product docs: sibling **Wisdom** workspace (`Plan.md`, `Tickets.md`,
`GettingStarted.md`).

## Phase 10 (software-only)

Expo tabs and stack screens for:

- **Pairing mock** — Settings → Pair cube (`MockPairingService`, in-memory session store)
- **Wi-Fi mock** — Settings → Wi-Fi setup (`MockWifiProvisioner`)
- **Devices** — room groups, on/off panel, scene buttons via `runRoutine`
- **Routines** — list/detail/run + simple create form
- **Profiles** — list/detail, internet policy edit, guest/child create (child → `never`)
- **Dashboard** — live status from the seeded mock client
- **Settings** — offline mode via `patchConfig`

Real BLE discovery, key exchange, and secure Wi-Fi transfer to hardware remain
human-blocked.

## Phase 11 (software-only)

- **Logs** — chain timeline from `queryLogs`, profile/device filters, tap for
  intents / actions / internetCalls detail
- **Privacy** — conversation history (intents), delete-all via `clearLogs`,
  export-my-data (`buildExportPayload`), empty memories placeholder
- **Backup** — status, trigger, local in-memory store (`MemoryLocalBackupStore`),
  restore dry-run then confirm; F10.T1-shaped `getBackup` on mock
- Encrypted at-rest mobile storage and remote cloud backup remain deferred /
  human-blocked

## Develop

```sh
pnpm install
pnpm run start          # Expo
pnpm run test
pnpm run build          # library dist/
```

Quality gates: `pnpm run lint | format:check | typecheck | test | build`
(coverage ≥90% on `src/`).

## Consume (as a package)

```sh
pnpm add git+ssh://git@github.com/Wisdom-PA/wisdom-app.git
```

```ts
import { MockCubeClient, HttpCubeClient, MockPairingService } from 'wisdom-app';
```

## AI config

Edit `ai/shared/` (not generated `AGENTS.md`), then `pnpm run ai:sync`.

## Branch protection (one-time)

```sh
gh api repos/Wisdom-PA/wisdom-app/rulesets --method POST --input .github/rulesets/main.json
gh api repos/Wisdom-PA/wisdom-app/rulesets --method POST --input .github/rulesets/staging.json
```
