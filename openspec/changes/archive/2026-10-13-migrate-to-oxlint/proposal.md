## Why

Linting runs on ESLint 8 with the legacy `.eslintrc.json` format, `@typescript-eslint` 5 and Prettier-in-ESLint, and only `packages/chartist` is linted at all; `examples` and `playground` have no lint target. oxlint is the Oxc linter, much faster than ESLint, with built-in TypeScript, Jest/Vitest and import rules, and Nx 23 has a plugin for it (`@nx/oxlint`, marked experimental) that infers `lint` targets.

## What Changes

- Add `@nx/oxlint` and exact-pinned `oxlint`, register the plugin in `nx.json`, and give every project (`chartist`, `examples`, `playground`) an inferred `lint` target.
- One root `.oxlintrc.json` that carries over the 1.x rules oxlint supports (`eqeqeq`, `curly`, `no-console`, `no-var`, `no-shadow`, `no-eval`, …) and the TypeScript recommended set, with overrides for tests (allow `console`, `any`) and the Node scripts. Stylistic rules that only existed for formatting (`brace-style`, `key-spacing`, `no-multi-spaces`, …) are dropped, because oxfmt owns formatting.
- Remove ESLint and everything only it uses: `eslint`, `@typescript-eslint/*`, `eslint-config-prettier`, `eslint-plugin-prettier`, `eslint-plugin-jest`, `eslint-plugin-jest-dom`, `eslint-plugin-testing-library`, `.eslintrc.json`, and Prettier 2 in `packages/chartist`.
- Convert `eslint-disable` comments to `oxlint-disable` (or drop them where the rule no longer exists); oxlint also honors `eslint-disable`, so this is cosmetic and done only where rules were renamed.
- Fix or explicitly suppress any new findings in `examples` and `playground`, which are linted for the first time.

**Breaking changes vs 1.x:** none. Development tooling only.

## Out of scope

- Type-aware linting (oxlint's `--type-aware` with tsgolint): evaluated later, after the core architecture work.
- New stricter rule sets beyond carrying over 1.x intent.
- Formatting (`migrate-to-oxfmt`) and testing (`migrate-to-vitest`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No behavior changes; `skip_specs: true`.

## Impact

- New: `.oxlintrc.json`, `@nx/oxlint` plugin entry in `nx.json`, `lint` targets for `examples` and `playground`.
- Removed: `packages/chartist/.eslintrc.json`, the explicit `lint` script, ESLint and Prettier 2 dev dependencies.
- Edited: `package.json` files, a few `eslint-disable` comments, `pnpm-lock.yaml`, the plan's tech table.
- Depends on `migrate-to-oxfmt` (Prettier-in-ESLint goes away together with ESLint).
