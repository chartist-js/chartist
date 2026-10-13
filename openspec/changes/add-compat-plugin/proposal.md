# Proposal

## Why

`add-line-chart` proved that `lineChart()` renders exactly like 1.x, but `LineChart` is still the 1.x implementation. This change completes step 4 of the `define-core-architecture` Migration Plan:

- `LineChart` becomes a thin wrapper over `lineChart`;
- the opt-in compat plugin brings back the 1.x events, `Svg` usage and 1.x plugins.

It is the first time 1.x users are served by the v2 core, so the contract suites (1.x unit tests, public API suite, visual baseline) must hold.

## What Changes

- **`LineChart` is a wrapper** (`src/charts/LineChart/LineChart.ts`) with no chart logic:
  - it keeps the constructor, the deferred first render, `update(data, options, override)` with 1.x semantics, `detach()` (the chart stays rendered) and `on`/`off`;
  - it keeps the 1.x window-resize re-render, and replaces an earlier chart in the same container;
  - it exposes the 1.x chart fields that plugins use (`container`, `data`, `options`, `svg`, `eventEmitter`).
- **Compat plugin `compat`** (`chartist/compat`), opt-in through `plugins: [compat]`:
  - **Events:** emits `data`, `optionsChanged`, `draw`, `created`, `animationBegin` and `animationEnd`, with the 1.x payloads (including 1.x `Axis` instances, `chartRect` and `Svg` wrappers) and the 1.x order.
  - **Draw timing (author decision 2026-10-13):** `draw` events are emitted right after rendering, in the `mount` phase, with live elements. This replaces the eager-DOM approach of define-core-architecture D6.
  - **`data` handlers** get mutable data. Their changes become the transformed data of the `prepare` phase.
- **Plugins per API** (author decisions 2026-10-13):
  - The functional API (`chart()`, `lineChart()`) accepts only v2 plugins. A function in `plugins` is an error that points to `fromLegacyPlugin`.
  - `fromLegacyPlugin(plugin, options?)` from `chartist/compat` converts a 1.x plugin function into a v2 plugin. It turns on the 1.x events for that chart itself and gives the function a 1.x-style chart object (`container`, `data`, `options`, `svg`, `eventEmitter`, `on`, `off`, `update`, `detach`).
  - The 1.x class API (`new LineChart`) accepts 1.x plugin functions as in 1.x, and passes the `LineChart` instance as `chart`. Like the 1.x events, they need `compat` in `plugins`; without it they're skipped with a one-time warning.
- **Core extension points** (generic, no compat code):
  - plugins can `provide` event names and emit them through the handle (`handle.emit`);
  - `handle.detach()` stops observing size and media but keeps the output;
  - `lineChart` emits `responsive` events when media queries switch the options.
- **Without compat:**
  - a listener for a 1.x event name logs a one-time warning that points to the compat plugin and the migration guide;
  - the class API skips 1.x plugin functions with a one-time warning;
  - the functional API throws for any function in `plugins` (it accepts only v2 plugins).
- **Packaging:**
  - `chartist/compat` in the exports map, built as ESM (`dist/compat.js`), self-contained browser ESM (`dist/compat.min.js`) and CJS (`dist/compat.cjs`). The browser ESM imports `./index.min.js`;
  - a UMD build `dist/compat.umd.js` attaches `Chartist.compat` to the global from `dist/index.umd.js`.
- **Tests:**
  - **1.x tests:** the `LineChart.spec.ts` helpers and the `test:api` 1.x tests add the compat plugin. In `test:api:v1`, `chartist/compat` resolves to a no-op 1.x plugin.
  - **Examples:** the four line examples with `draw` handlers or animations add `compat`.
  - **Parity:**
    - the jsdom parity tests now compare against the published `chartist@1.5.0` (`chartist-v1`), because the local 1.x implementation is gone;
    - a new parity test compares the 1.x `draw`/`created` event sequence and payloads with 1.5.0;
    - `test:visual:v2` is removed, because `test:visual` now renders every line example through `lineChart`.

## Out of scope

- `BarChart` and `PieChart` stay 1.x implementations with native events until step 5. During that time, only `LineChart` needs compat for 1.x events.
- Moving the legacy surface to `src/legacy/` (author decision 2026-10-13: after bar and pie). The exports stay unchanged either way.
- Running 0.x community plugins.

## Breaking changes vs 1.x

These are the breaking changes listed in define-core-architecture, now in effect for `LineChart`:

- **BREAKING (restored by adding `compat`):** `LineChart` no longer emits `data`, `optionsChanged`, `draw`, `created`, `animationBegin` and `animationEnd` without the compat plugin. A listener for one of them logs a one-time warning.
- **BREAKING (restored by adding `compat`):** 1.x plugin functions on a `LineChart` run only with the compat plugin.
- **Not breaking, but new:** `lineChart()` and `chart()` reject plugin functions; 1.x plugins go through `fromLegacyPlugin`. These APIs are new in v2, so no 1.x code is affected.
- **Behavior difference with `compat`:** `draw` handlers run after the whole chart is rendered. An element a handler appends to `data.group` ends up after the group's other elements instead of between them (stacking order only). The examples and contract suites are unaffected.

Without listeners or plugins, `LineChart` output is identical to 1.5. The visual baseline and the parity tests prove it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `v1-compatibility`: `draw` events are emitted after rendering in 1.x order (replaces live DOM at the compose boundary); 1.x plugins run on the class API with `compat`, and on the functional API through `fromLegacyPlugin`.
- `chart-pipeline`: plugins can provide and emit custom events; the functional API accepts only v2 plugins.
- `chart-composition`: the chart handle can detach without removing the output.
- `library-distribution`: the `chartist/compat` entry in all build formats and in the exports map.

## Impact

- `packages/chartist/src/`:
  - `charts/LineChart/LineChart.ts` becomes the wrapper; the 1.x line code is deleted (the jsdom parity tests keep comparing with 1.5.0);
  - new `compat/`;
  - extension points in `chart/` and `presets/`.
- `packages/chartist/tsdown.config.ts`, `package.json` (exports map, targets), `.size-limit.json` (a compat budget; `import { LineChart }` re-baselined).
- `packages/examples`: four line examples import `compat`.
- Tests: `LineChart.spec.ts`, `test/api`, `test/parity`, the visual harness and `test:smoke` (the compat entry in Node and in a browser).
