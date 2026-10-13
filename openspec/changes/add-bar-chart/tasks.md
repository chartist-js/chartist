# Tasks

## 1. Shared infrastructure

- [ ] 1.1 `presets/preset.ts`: `createPreset` (merge rules, responsive, `responsive` event, preset state), the shared grid and label layers with the axis order given by the preset, and `lineChart`/`createLineChart` rebuilt on it. Verify: line unit, parity and event parity tests pass unchanged.
- [ ] 1.2 `charts/PresetChart.ts` with the wrapper logic, and `LineChart` as a subclass; relax the `test:api` prototype check to `instanceof BaseChart`. Verify: `LineChart.spec.ts` and `test:api` pass.
- [ ] 1.3 Axes: `normalize` options in `AxesConfig`/`cartesianAxes`, `kind` and `stretch` on `ScaleAxis` (factories and `legacyAxis`). Verify: unit tests for both, including a 1.x `StepAxis` class reporting `step`.

## 2. Bar chart

- [ ] 2.1 `layers/bar.ts` (D3), with `getSerialSums`. Verify: unit tests for stacking (all modes), horizontal bars, distributed series, holes and clamping on the scene.
- [ ] 2.2 `presets/barDefaults.ts` and `presets/barChart.ts` (value axis with `highLow` and `referenceValue: 0`, label axis ticks, root classes, grid and label order). Verify: unit tests for structure and responsive options.
- [ ] 2.3 `BarChart` as a `PresetChart` subclass, replacing the 1.x implementation; `BarChart.spec.ts` adds `compat`. Verify: the 1.x bar tests pass.
- [ ] 2.4 Compat: axis order from the scene, 1.x bar axes, `bar` payloads. Verify: line event parity unchanged, and bar unit tests for payload fields.

## 3. Parity and contract

- [ ] 3.1 `test/parity/bar-fixtures.ts`, `bar.spec.ts` and `bar-events.spec.ts` against `chartist-v1`. Verify: all fixtures pass; a deliberate change to `seriesBarDistance` handling fails with a readable diff.
- [ ] 3.2 `test:api`: `withCompat` for bar constructions using events, export lists (`barChart`, `bar`, new types), and `bar.v2.api.ts` for the delta scenarios. Verify: `test:api` and `test:api:v1` pass.
- [ ] 3.3 The `stacked` and `with-circle-modify-drawing` examples import `compat`. Verify: `test:visual` and `test:visual:v1` pass unchanged.

## 4. Integration

- [ ] 4.1 Size budgets (`import { barChart }`, `import { BarChart }` re-baselined, whole package), recorded in the plan; the plan roadmap updated. Verify: the full local gate and the format check pass.

## Workflow follow-up

- Archive `add-bar-chart` and sync `chart-composition`.
- Next: `add-pie-chart`, then the legacy surface move.
