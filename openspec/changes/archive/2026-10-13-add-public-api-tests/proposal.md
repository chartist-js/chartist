# Proposal

## Why

The core rewrite (`define-core-architecture`) moves almost every module of `packages/chartist/src`, and the 1.x unit tests import those modules directly, so they move and change with them. Before the core is touched, we need a test suite that sees Chartist only as users do, through the published entry points. Then an API break shows up as a failing test, not as a bug report after release. The `public-api` spec requires this suite to pass against the 1.5 code before core implementation starts.

## What Changes

- **Public API suite** in `packages/chartist/test/api/` that imports only `chartist` (the package name), resolved to the built package. A guard fails the suite if a test imports from `src`.
- **Export surface lists**, checked in:
  - runtime export names of the root entry (58 in 1.5), compared with the ESM build, the CJS build and the UMD global `Chartist`;
  - exported type names from the built declaration files, so removing a type-only export (e.g. `LineChartOptions`) is caught too;
  - a check that every export name of the published 1.5.0 package is in the list.
- **Type tests** (Vitest `expectTypeOf`, typecheck mode) compiled against the built `.d.ts` files: chart constructors and methods, options and data types, event payload types, `Svg`, `SvgPath`, `Interpolation` and the axis classes.
- **Behavior tests** in jsdom for the documented 1.x API: `LineChart`/`BarChart`/`PieChart` creation, `update`, `detach`, `on`/`off`, the 1.x events, plugins, responsive options, `Svg`/`SvgList`/`SvgPath`, `easings`, `Interpolation`, axis classes and the exported helpers. They assert observable output (DOM structure, classes, `ct:` attributes, event payloads), not internals.
- **Two Nx targets**, following `test:visual` and `test:visual:v1`:
  - `test:api` runs the suite against the local build and depends on `build`;
  - `test:api:v1` runs the same suite against the published `chartist@1.5.0` (the existing `chartist-v1` dev dependency). This proves that the tests describe 1.5 behavior and not the current implementation.
- Both targets join the local gate. The unit test config excludes `test/api`.

No library code changes. No breaking changes vs 1.x: the suite only records the current 1.x surface.

## Out of scope

- Tests for the v2 functional API (`chart`, `toScene`, layers, the compat plugin). Each core change adds them together with the API (`public-api` spec).
- Running the suite with the compat plugin. That begins with the first core change that moves 1.x events into compat.
- An API report tool such as API Extractor. Type names plus type tests cover the contract with less tooling. This can be revisited for the docs' API reference.
- Package resolution through the `exports` map and the no-bundler path. `test:smoke` already covers them.
- GitHub CI wiring (deferred to the release phase, like the other targets).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `public-api`: the export surface includes type-only exports, and the suite must also pass against the published 1.5.0 package.

## Impact

- `packages/chartist/test/api/`: new tests, export lists, type tests and a Vitest config.
- `packages/chartist/package.json`: `test:api` and `test:api:v1` targets.
- `packages/chartist/vitest.config.ts`: excludes `test/api`.
- `docs/v2-high-level-plan.md`: the local gate includes the new targets.
- Dependencies: none new (Vitest, TypeScript and `chartist-v1` are already present).
