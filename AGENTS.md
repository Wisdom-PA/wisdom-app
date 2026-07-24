<!-- DO NOT EDIT — generated from ai/ by `pnpm run ai:sync` -->
<!-- Source of truth: ai/shared/*.md — edit there and run `pnpm run ai:sync` -->

# wisdom-app

This repository was generated from the company skeleton (factory baseline). It
carries the house standards for its selected stack(s), a single-source AI
config (`ai/` → generated `AGENTS.md`, `.claude/`, `.cursor/`), and CI gates
that enforce both.

- Deploy target: none (mobile companion; Expo/React Native layer to be added).
- Every task runs through `pnpm run <task>` (Python tasks wrap `poetry run`).
- Branch flow: `anywhere → staging → main` (squash into staging, merge into main),
  enforced by the committed rulesets in `.github/rulesets/`.

---

# What this service does

Mobile companion for the Wisdom on-device home assistant. Configures the cube,
shows privacy/internet transparency, manages profiles, devices, routines, and
backup/restore. Product plan and tickets live in the Wisdom docs workspace
(`Plan.md`, `Tickets.md`, `GettingStarted.md`).

This repo starts as a **TypeScript package** from the company skeleton; the
Expo / React Native app shell is the next layer on top of that baseline.

## Feature map

- package baseline — shared TS utilities and publishable API surface — `src/index.ts`
- _(pending)_ companion UI — Expo RN tabs/stacks, cube API client — TBD

---

# Conventions

## Editing rules (read this first)

- **Never hand-edit generated files**: `AGENTS.md`, `.cursor/rules/*`, and the
  generated capabilities under `.claude/skills|agents|commands`. Edit
  `ai/shared/*.md` or `ai/capabilities/<name>/` and run `pnpm run ai:sync`.
  CI fails on drift (`ai-config-drift`).
- Environment access goes through the typed schema only: `src/env.ts` (TS),
  `app/settings.py` (Python), `env.ts` (frontend). Never read raw
  `process.env` / `os.environ` elsewhere.
- No secrets in code, ever. `.env` files are git-ignored; `.env.example`
  documents every variable with safe local values.

## Style

- TS/JS: Biome is the single formatter+linter (`pnpm run lint` = `biome check`).
  Backend profile: width 120, indent 2. Frontend profile: width 100, indent 4,
  single-quote JSX, Tailwind class sorting. Named exports; no `console.log`
  in shipped code (`console.error` allowed).
- Python: Ruff formats and lints (width 120, single quotes); mypy strict.
- Naming: TS/JS is camelCase (PascalCase types/components); Python is
  snake_case (Ruff enforces). snake_case in TS only where an EXTERNAL contract
  dictates it (DB columns, third-party payloads) — and it stays at that
  boundary, mapped to camelCase before it spreads inward.
- Commits follow Conventional Commits (commitlint enforces; lefthook runs it).

## Code organisation

- Balance DRY against simplicity: three similar lines of code often beat a
  premature abstraction; don't create abstractions for one-time operations.
- If a function does too many things, split it into smaller focused functions;
  if a file passes ~300 lines, consider splitting it logically.

## Quality gates (all must pass — `/ship` runs them)

lint + format-check + typecheck + tests (**≥90% global coverage**) + build.

---

# Repo-specific rules

<!-- Rules UNIQUE to this repo — NOT house standards (those live in
     10-conventions.md and the stack files). Injected by the `project-context`
     agent from ai/context/questions.json after init; revise with the
     `update-project-context` skill. Keep this list to genuine repo-specific
     invariants (domain rules, integration constraints) — anything house-wide
     belongs in 10-conventions.md instead. -->

## Domain rules

- _None yet — run the `project-context` agent (or `/update-project-context`) to
  populate this._

---

# Working practices

## Side effects — before making changes

When modifying code, always consider what else your change touches:

- **Callers and imports** — search for usages before changing a signature;
  check what depends on the code being changed.
- **Tests** — will existing tests break; do they need updating to stay aligned
  with the implementation? If tests don't exist for what you're changing,
  create them when justified.
- **Schemas & generated docs** — request/response changes happen in the Zod /
  Pydantic schemas (validation AND OpenAPI derive from them — never edit the
  spec or validation separately).
- **README** — update it when a change adds features, configuration, or setup
  requirements.
- Run the affected gates after changes to catch unintended breakage.

## Audit trail

All non-trivial change sets are logged in `docs/audit-trail/`, one Markdown
file per related set of changes, named `YYYY-MM-DD_short-description.md`.

- **Start** a non-trivial task (multi-file change, refactor, feature) by
  creating the entry with a checklist of planned work; tick items off and add
  discovered work as you go — it gives the human visibility during the task.
- **Finish** by completing the entry; ask the user before considering the task
  complete ("ready for me to finalize the audit trail entry?"). Never silently
  skip it. If today's entry exists and is unpushed, update it instead of
  creating a new file.
- Each entry contains: date/time; the checklist; files created/updated/deleted;
  a summary of what changed and why; side effects considered; issues spotted
  during implementation; and a **Deployment Checklist** — unchecked `[ ]` items
  for whoever deploys: env vars to add/change (exact names), migrations to run
  and what they do, data backfills, fields/behaviours to verify post-deploy,
  and smoke tests. Omit categories that don't apply rather than writing "N/A".
- The audit file is committed BY THE USER along with the code — never run git
  commit/push yourself.

## Frontend handoff notes

When a backend change affects an external consumer contract (new endpoint,
request/response shape change, validation rule change, new error code, renamed
field), write a paste-ready handoff note in `docs/notes-for-fe/` named
`YYYY-MM-DD_short-description.md`. Self-contained and consumer-friendly:
endpoint + method, example request/response JSON (with new fields explained),
validation rules to mirror, and error cases (status + when) to handle.
Internal-only changes (refactors, BE-only renames, infra) do NOT need a note;
ask the user first if it isn't obviously consumer-facing.

## Communication

- Explain concepts readably; use a real-world analogy when it genuinely helps.
- When you disagree with an approach, argue back with reasons and offer an
  alternative — but only for genuine concerns, not minor preferences.

## Stability & input paranoia

- Be paranoid about changes that could take the service down: consider edge
  cases, handle errors, never introduce paths that throw uncaught in production.
- Never trust client-side data: validate and sanitise all input at the schema
  boundary; guard against the OWASP Top 10 (the ORM/driver parameterises SQL —
  never interpolate it yourself).
- Never read `.env*` files (secrets) and never search or read `node_modules/`.

---

# Testing

- **Unit tests**: Vitest (TS/frontend, Jest-compatible API) / pytest (Python),
  both configured with a **≥90% global coverage** threshold that fails the run.
  Coverage must assert meaningful behavior, not just execute lines.
- **Test behavior, not implementation**: RTL user-facing queries (`getByRole`,
  `getByLabelText`) on the frontend; API/service-surface tests on backends.
  Snapshots are not a primary assertion.
- **Repository layers are mockable** so services test without a live DB.
- **Stories-as-fixtures** — every component ships `Name.stories.tsx`, and a
  `Name.stories.test.tsx` calls `runStandardStorySuites` from `@/lib/storyTests`
  (composeStories render + axe + EN/CY locale + keyboard checks). Story coverage
  equals component coverage, and the same stories feed the Storybook a11y (axe)
  addon in dev.
- **E2E**: Playwright smokes critical user paths when a frontend is present
  (mocked APIs when the frontend stands alone). Not every page — key flows.
- **Ops behaviors are tested, not assumed**: SIGTERM drain, error-envelope
  byte-parity, /docs gating, and metrics labels all have dedicated tests —
  keep them green when touching those layers.
- Run everything: `pnpm run test` (per stack or from the repo root).

---

# TypeScript Package (ts-package)

This stack builds a publishable TypeScript library — types, utilities, templates,
and OOP classes — that other repos import as a dependency via git or a registry.

## Shape

A package repo has no server, no HTTP surface, no `/health` route, and no
deployment target. It's a pure library with `src/index.ts` barrel-exporting
the public API.

- `src/index.ts` — barrel export; `export const X`, `export type Y`, `export class Z`.
- `tsconfig.json` extending `@repo/tsconfig/node24.json` with `declaration: true`.
- `package.json` with `private: false`, `main`/`module`/`types`/`exports` pointing at
  `dist/`, and `files: ["dist"]` to keep the published size small.
- `tsup.config.ts` building ESM + CJS to `dist/` with source maps and `*.d.ts`
  type declarations.
- `vitest.config.ts` with ≥90% coverage threshold (src files only, build output
  excluded).

## Consume

In another repo:

```sh
# Via git+ssh (recommended):
pnpm add git+ssh://git@github.com/ORG/package-name.git

# Or git+https:
pnpm add git+https://github.com/ORG/package-name.git
```

Then import the public API:

```ts
import { MyClass, myUtility, type MyType } from 'package-name';
```

## Develop

- `pnpm run build` — build `src/index.ts` → `dist/`; omit from `.gitignore`
  (it's published).
- `pnpm run test` — run tests with coverage (enforces ≥90%).
- `pnpm run lint` — Biome (same 120-char width, 2-space indent as the backend).
- `pnpm run typecheck` — `tsc --noEmit`.

## Barrel exports

Keep the public API at `src/index.ts`. Consumers should never import from
subpaths — the barrel is the contract. This enables you to reorganize internal
files without breaking consumers.

## No runtime dependencies

Packages ship with zero runtime dependencies by default. This keeps them lean
and composable; consumers add what they need. If a package genuinely needs
a runtime dep (e.g. a validation library), add it, but prefer `peerDependencies`
to let consumers control versions.

## Versioning

Use Semantic Versioning: `major.minor.patch`.

- Breaking changes → major.
- New public API → minor.
- Bug fixes + refactors (no API change) → patch.

Tag releases in git: `v1.2.3`. Use Conventional Commits (`feat:`, `fix:`,
`BREAKING CHANGE:`) in commit messages so release tooling can auto-increment
versions.
