# Tasks

## 1. Suite setup

- [x] 1.1 Add `packages/chartist/test/api/vitest.config.ts` (jsdom, globals, `include: ['**/*.api.ts']`, typecheck on `**/*.test-d.ts`) with the `chartist` alias selected by `CHARTIST_API_TARGET=local|v1`, plus `test/api/setup.ts` with the `matchMedia` stub. Verify: a trivial `import { LineChart } from 'chartist'` test passes with both env values and fails with a clear error for an unknown value.
- [x] 1.2 Add `test/api/tsconfig.json` and `test/api/tsconfig.v1.json` whose `paths` map `chartist` to `dist/index.d.ts` and `node_modules/chartist-v1/dist/index.d.ts`. Verify: a trivial `.test-d.ts` passes in typecheck mode against both.
- [x] 1.3 Exclude `test/api/**` in `packages/chartist/vitest.config.ts`. Verify: `pnpm nx test chartist` runs the same number of tests as before.
- [x] 1.4 Add the `test:api` (depends on `build`) and `test:api:v1` targets with cache inputs, and the `test:api:update-exports` script. Verify: `pnpm nx run chartist:test:api` and `pnpm nx run chartist:test:api:v1` both run the trivial tests, and a second run is a cache hit.
- [x] 1.5 Add the guard test that fails on imports from `src/` or relative imports outside `test/api`. Verify: temporarily adding `import '../../src'` to a test file makes the guard fail and name the file.

## 2. Export surface

- [x] 2.1 Write the export-name reader (ESM namespace, CJS `require`, UMD global in a `vm` context, declaration names via the TypeScript compiler API) and generate `test/api/exports/chartist.json` with the update script. Verify: the list has 58 runtime and 146 type names.
- [x] 2.2 Add `exports.api.ts`: ESM, CJS and UMD keys equal `runtime`; declaration names equal `types`; every 1.5.0 name (read from `chartist-v1`) is listed. Failure messages list unlisted and missing names separately. Verify: passes in both targets; removing a name from the JSON or adding a fake one fails with that name in the message.

## 3. Type tests

- [x] 3.1 `charts.test-d.ts`: constructor signatures of `LineChart`, `BarChart`, `PieChart` (data, options, responsive options); `update`, `detach`, `on`, `off` signatures; `@ts-expect-error` for invalid options. Verify: passes in both targets, and an intentionally wrong expectation fails.
- [x] 3.2 `events.test-d.ts`: listener payload types for `data`, `draw` (point, line, area, bar, grid, label, slice), `created` and animation events. Verify: passes in both targets.
- [x] 3.3 `svg.test-d.ts`: `Svg`, `SvgList`, `SvgPath`, `easings`, `Interpolation` factories and axis classes used as option values. Verify: passes in both targets.

## 4. Behavior tests

- [x] 4.1 `charts.api.ts`: creation with selector and element, default output structure and classes for each chart type, `update` with new data and options (merge vs replace), `detach` removes listeners. Verify: passes in both targets.
- [x] 4.2 `events.api.ts`: `data`, `optionsChanged`, `draw` and `created` order and payload fields per chart type; `on`/`off` and `'*'` listeners; `animationBegin`/`animationEnd` with `Svg.animate`. Verify: passes in both targets.
- [x] 4.3 `plugins.api.ts` and `responsive.api.ts`: a 1.x plugin function receives the chart and options and can hook `draw`; responsive options switch with a stubbed `matchMedia` and re-render. Verify: passes in both targets.
- [x] 4.4 `svg.api.ts` and `interpolation.api.ts`: standalone `Svg` building (`elem`, `attr`, `addClass`, `text`, `append`, `replace`, `remove`, `querySelector`, `parent`, `root`), `SvgList`, `SvgPath` parse/stringify/transform, and each `Interpolation` factory's path output for a fixed input. Verify: passes in both targets.
- [x] 4.5 `axes.api.ts`: `FixedScaleAxis`, `AutoScaleAxis`, `StepAxis` as `type` options produce the expected label texts and grid line counts. Verify: passes in both targets.
- [x] 4.6 `helpers.api.ts`: table-driven tests for the exported helper functions (e.g. `getMultiValue`, `normalizeData`, `serialize`/`deserialize`, `alphaNumerate`, `getBounds`, `polarToCartesian`), and a smoke call for each creation helper. Verify: passes in both targets; every runtime export is used by at least one behavior or type test (a coverage check over the export list).

## 5. Integration

- [x] 5.1 Add `test:api` and `test:api:v1` to the local gate in `docs/v2-high-level-plan.md`. Verify: `pnpm nx run-many -t typecheck check build test test:smoke test:size test:visual test:visual:v1 test:api test:api:v1 test:e2e lint` and `pnpm nx format:check --all` pass.
- [x] 5.2 Confirm the suite detects breaks: on a scratch branch, rename an export, change a default option, and drop a `ct:value` attribute. Each causes a `test:api` failure, and `test:api:v1` stays green. Verify: record the three failures in the change notes, then discard the scratch branch.

## Verification notes

Task 5.2 (2026-10-13): the mutations were applied in place to the clean `src/` and restored with `git checkout`, instead of on a scratch branch. Each was built and run against both targets:

- Renaming the `easings` export to `easing`: `test:api` failed 5 tests (ESM, CJS, UMD and declaration export lists, standalone `Svg.animate`) plus the `svg.test-d.ts` type test.
- Changing the LineChart default `showPoint` to `false`: `test:api` failed 10 tests (output, update, event order, payloads, data and draw listeners).
- Dropping `ct:value` from line points: `test:api` failed 1 test (points with `ct:value` and `ct:meta`).
- `test:api:v1` passed 118/118 in all three cases.

## Workflow follow-up

- Archive `add-public-api-tests` and sync the `public-api` spec.
- Start the next core step: the scene graph, renderers and pipeline skeleton (`define-core-architecture` design, Migration Plan step 3).
