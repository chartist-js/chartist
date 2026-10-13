# Tasks

## 1. Core extension points

- [x] 1.1 `ChartPlugin.provides`, `ChartHandle.emit` (rejects phase names), the error for function plugins in the functional API (naming `fromLegacyPlugin`; replaces the skip-with-warning), plugin types that allow only plugin objects, and the one-time warning for 1.x event names without a provider. Verify: unit tests for each, including the `chart-pipeline` delta scenarios.
- [x] 1.2 `ChartHandle.detach()` (stops the observer; output and listeners stay) and `destroy()` built on it. Verify: unit test of the `chart-composition` delta scenario.

## 2. Preset controller

- [ ] 2.1 `createLineChart` controller in `presets/lineChart.ts` (`handle`, `setData`, `setOptions(options, override)` with the 1.x merge rule, `options()`, `data()`), `ResolvedConfig.presetOptions`, the `responsive` event on media changes, and media listeners removed on `detach()`. `lineChart()` uses the controller. Verify: existing preset tests pass, and new tests cover `setOptions` with and without override and the `responsive` event.

## 3. LineChart wrapper

- [x] 3.1 Replace the 1.x line implementation in `src/charts/LineChart/LineChart.ts` with the wrapper (D4): deferred init, queued `on`/`off`, 1.x `update`, `detach`, the instances map, window resize, the 1.x fields, plugin splitting (v2 objects, 1.x functions converted through a `compat` found in the list, else skipped with a one-time warning), and `getSeriesOption` kept. Verify: `pnpm nx test chartist` runs the 1.x LineChart tests that don't use 1.x events, and they pass without compat.

## 4. Compat plugin

- [x] 4.1 `src/compat/`: the `data` event with a mutable copy, `optionsChanged` from `responsive`, the 1.x `chartRect` and axis instances, `draw` in 1.x order with 1.x payloads and `created` at mount, the `eventEmitter` bridge, the error for non-DOM renderers. Verify: unit tests per event type, and the `v1-compatibility` delta scenarios.
- [x] 4.2 `fromLegacyPlugin(plugin, options?)` with the 1.x-style facade, and `compat.legacyPlugin(plugin, options, chartObject)` for the class. Events turn on once per chart however many converted plugins there are. Verify: unit tests with a tooltip-like plugin using `chart.container` and `chart.on('draw')`, through `fromLegacyPlugin` with `lineChart()` (facade) and through `new LineChart` with `compat` (the instance).
- [x] 4.3 `LineChart.spec.ts`: the helpers add `plugins: [compat]`. Verify: the whole 1.x LineChart test file passes unchanged otherwise.

## 5. Packaging

- [x] 5.1 tsdown entries for `compat` (ESM, CJS, browser ESM, UMD into `Chartist.compat`) with the core as external and rewritten specifiers, declarations, and `"./compat"` in the exports map. Verify: `dist/compat.*` exist, no compat file contains the core (size check), and `test:smoke` covers Node resolution, the same core instance, `<script type="module">` and the classic UMD scripts.
- [x] 5.2 Size budgets: `import { compat }` from `chartist/compat`, and `import { LineChart }`, `dist/compat.min.js` and `dist/compat.umd.js` re-baselined. Verify: `test:size` passes; numbers recorded in the plan.

## 6. Contract suites

- [x] 6.1 `test:api`: compat in the 1.x behavior tests that use events, the `chartist/compat` alias per target (no-op plugin for v1), the export list update (`chartist/compat` entry list), and `compat.v2.api.ts` (warnings, the function-plugin error, `fromLegacyPlugin` with the facade, mixed plugins). Verify: `test:api` and `test:api:v1` pass.
- [x] 6.2 Parity: `test/parity/line.spec.ts` against `chartist-v1`, and a new `test/parity/line-events.spec.ts` comparing `draw`/`created` sequences and payloads. Verify: all fixtures pass, and a deliberate order change fails with a readable diff.
- [x] 6.3 Visual: the four line event examples import `compat`, the harness aliases `chartist/compat` per mode, and `test:visual:v2` with its shim is removed. Verify: `test:visual` and `test:visual:v1` pass against the unchanged baseline, including the four examples.

## 7. Integration

- [x] 7.1 Remove `test:visual:v2` from the gate in the plan, run the full gate, and update the plan's roadmap (step 4 done). Verify: all targets green, and the format check is clean.

## Workflow follow-up

- Archive `add-compat-plugin` and sync `v1-compatibility`, `chart-pipeline`, `chart-composition` and `library-distribution`.
- Next: step 5 (bar and pie layers and presets, then the legacy surface move).
