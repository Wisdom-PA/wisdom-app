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
