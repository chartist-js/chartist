# Design

## Context

- `packages/chartist` builds ESM (`dist/index.js`), CJS (`dist/index.cjs`), UMD (`dist/index.umd.js`, global `Chartist`) and declarations (`dist/index.d.ts`, `dist/index.d.cts`) with tsdown. The root entry is the only JS entry; the other exports are styles.
- The published `chartist@1.5.0` is installed as the dev dependency `chartist-v1`. `test:visual:v1` already uses it to check the visual baseline against 1.5.0.
- Measured on `next` (2026-10-13): the local build and 1.5.0 have the same 58 runtime exports (ESM, CJS and UMD alike), and the same 146 exported names in their declarations (values plus types). The UMD global can be read in Node by running the file in an empty `vm` context.
- Unit tests run with Vitest 5 in jsdom (`vitest.config.ts`, `{test,src}/**/*.spec.ts`), and the test setup stubs `window.matchMedia`.
- `test:smoke` already checks resolution through the `exports` map, package fields, and the no-bundler path in a browser.

## Goals / Non-Goals

**Goals:**

- One suite that runs unchanged against the local build and against published 1.5.0.
- Failures name the export, type or behavior that changed.
- Fast enough for the local gate: no browser, a few seconds of Vitest.

**Non-Goals:**

- Re-testing package resolution (covered by `test:smoke`).
- Testing internal edge cases that the 1.x unit tests already cover. The suite covers the public contract, not every branch.

## Decisions

### Resolve `chartist` by alias, chosen per target

- The Vitest config for the suite (`test/api/vitest.config.ts`) aliases `chartist` to `dist/index.js` (target `test:api`) or `node_modules/chartist-v1/dist/index.js` (target `test:api:v1`), selected by the env var `CHARTIST_API_TARGET=local|v1`.
- Type tests use matching tsconfigs (`test/api/tsconfig.json`, `test/api/tsconfig.v1.json`) whose `paths` map `chartist` to the corresponding `index.d.ts`.
- _Alternatives considered:_
  - Self-reference through the package name and the `exports` map. Rejected: it can't point at 1.5.0, and resolution is already tested by `test:smoke`.
  - A separate consumer workspace package (`@chartist/api-tests`). Rejected: an extra Nx project and lockfile entry for the same result, and the v1 run still needs an alias.

### Export lists as checked-in JSON, read with the TypeScript compiler

- `test/api/exports/chartist.json` holds `{ "runtime": [...], "types": [...] }`, sorted. `runtime` is the 58 value names. `types` is every name the declarations export (146, including the values), read with the TypeScript compiler API (`getExportsOfModule` on `index.d.ts`).
- Checks:
  - ESM namespace keys, CJS `require` keys and the UMD global keys each equal `runtime`.
  - The declaration exports equal `types`.
  - Every 1.5.0 runtime and type name (read from `chartist-v1` the same way) is in the list. This check runs in both targets.
- Error messages list unlisted and missing names separately. An update script (`pnpm nx run chartist:test:api:update-exports`) rewrites the list from the build, so additions are deliberate diffs in review.
- _Alternative considered:_ Vitest snapshots. Rejected: snapshot updates (`-u`) are easy to accept without reading, and a JSON list makes the review diff explicit.

### UMD in a `vm` context instead of a browser

- Running `index.umd.js` in an empty `vm` context makes the UMD wrapper take its global branch, which defines `globalThis.Chartist`. That is what a classic `<script>` does.
- Rendering through the UMD build in a real browser is already covered by `test:smoke`.

### Type tests with `expectTypeOf`

- `test/api/**/*.test-d.ts` run in Vitest typecheck mode with the target's tsconfig. They use `expectTypeOf` and `// @ts-expect-error` for invalid usage (e.g. wrong option types).
- Covered:
  - constructor and method signatures of the three charts;
  - option, data and responsive option types;
  - event payload types (`DataEvent`, `PointDrawEvent`, `LineChartCreatedEvent`, …);
  - `Svg`, `SvgPath`, `Interpolation`, `easings` and the axis classes.

### Behavior tests organized by public area

- Test files are `test/api/*.api.ts`, so the unit config doesn't pick them up. The unit config additionally excludes `test/api/**`.
- Areas:
  - `charts` (creation, `update`, `detach`, defaults);
  - `events` (`data`, `optionsChanged`, `draw`, `created`, `animationBegin`/`animationEnd`: order and payload fields);
  - `plugins`;
  - `responsive` (stubbed `matchMedia`);
  - `svg` (`Svg`, `SvgList`, `SvgPath`, `easings`);
  - `interpolation`;
  - `axes` (axis classes as options);
  - `helpers` (the exported utility functions, table-driven).
- Assertions are on output (DOM structure, classes, `ct:` attributes), event payloads and return values.
- Chart rendering waits for the 1.x deferred first render through the public `created` event. No timers are faked.
- A guard test scans `test/api` for imports of `src/` (or relative imports outside `test/api`) and fails with a message naming the file.

### Nx targets

- `test:api`: `CHARTIST_API_TARGET=local vitest run --config test/api/vitest.config.ts --typecheck`. It depends on `build` and is cached, with inputs `build`, `test/api/**` and the externals Vitest, jsdom and TypeScript.
- `test:api:v1`: the same with `v1`. It does not depend on `build` (like `test:visual:v1`), and also reads `package.json` because of the `chartist-v1` version.

## Risks / Trade-offs

- [The tests encode accidental 1.5 behavior as contract] → Assert documented and commonly used behavior. Where a test pins behavior that v2 may intentionally change, mark it with a comment that points to the breaking-change list in `define-core-architecture`.
- [jsdom has no layout (`clientWidth` is 0)] → Charts get an explicit `width`/`height` option, as the 1.x unit tests do. Layout-dependent output is covered by the visual regression suite.
- [The `types` list is large (146 names) and noisy to review] → It is sorted, one name per line, and changes only when the API changes. That is exactly the review signal we want.
- [The v1 and local builds diverge in declaration layout (multi-file vs bundled)] → Compare names through the compiler API, not file contents. Both resolve to the same 146 names today.

## Migration Plan

Add the suite and targets, run both targets green, and add them to the local gate in the plan. Rollback means removing `test/api` and the two targets; no library code changes.
