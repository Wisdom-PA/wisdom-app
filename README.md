# wisdom-app

Wisdom mobile companion baseline. Generated from the company skeleton
(**ts-package**). Expo / React Native UI will be layered on next.

Product docs: sibling **Wisdom** workspace (`Plan.md`, `Tickets.md`,
`GettingStarted.md`).

## Develop

```sh
pnpm install
pnpm run test
pnpm run build
```

Quality gates: `pnpm run lint | format:check | typecheck | test | build`
(coverage ≥90%).

## Consume (as a package)

```sh
pnpm add git+ssh://git@github.com/Wisdom-PA/wisdom-app.git
```

## AI config

Edit `ai/shared/` (not generated `AGENTS.md`), then `pnpm run ai:sync`.

## Branch protection (one-time)

```sh
gh api repos/Wisdom-PA/wisdom-app/rulesets --method POST --input .github/rulesets/main.json
gh api repos/Wisdom-PA/wisdom-app/rulesets --method POST --input .github/rulesets/staging.json
```
