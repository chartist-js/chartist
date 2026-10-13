# Tasks

## 1. Axes and layout

- [ ] 1.1 `cartesianAxes` list form with `id` and `side`, the shorthand mapping, unique ids, and `Unknown axis` errors. Verify: unit tests, and the existing scale and pipeline tests pass.
- [ ] 1.2 Layout with per-side offset sums and per-axis `inset` (D2). Verify: unit tests for two axes on one side; `axisArea` results unchanged for one axis per direction.
- [ ] 1.3 Axis creation from bound series (D3) and `step` on step axes. Verify: unit tests for an axis range covering only its layers' series.

## 2. Layers

- [ ] 2.1 `Layer.axes`/`Layer.series`, the per-layer context (bound axes, filtered data, `seriesIndexes`), and `x`/`y`/`series` options on `line()` and `bar()` with chart-wide indexes. Verify: unit tests for classes, keys and contexts across two layers.
- [ ] 2.2 `line({ align: 'center' })`. Verify: unit test that line points match bar centers on a shared step axis.
- [ ] 2.3 Per-axis frames in `scales/grid.ts` and the `axisGrid()`/`axisLabels()` layers (D5). Verify: unit tests for all four sides, stacked insets, and selecting axes; the grid parity test against 1.x stays green.

## 3. Contract and examples

- [ ] 3.1 `test:api`: `composition.v2.api.ts` (the delta scenarios) and the export list update (`axisGrid`, `axisLabels`, new types). Verify: `test:api` and `test:api:v1` pass.
- [ ] 3.2 The examples `composed/bar-and-line` and `composed/two-y-axes`, the manifest type `composed`, baselines recorded from the local build, and `test:visual:v1` skipping `composed`. Verify: `test:visual` and `test:visual:v1` pass; the new screenshots are reviewed.
- [ ] 3.3 The line, bar and pie parity suites and the 1.x unit tests run unchanged. Verify: all green without fixture changes.

## 4. Integration

- [ ] 4.1 Size budgets (`import { chart, cartesianAxes, line, bar, axisGrid, axisLabels }` as a composed-chart entry; the presets re-measured), the plan updated. Verify: the full local gate and the format check pass.

## Workflow follow-up

- Archive `add-composed-charts` and sync `chart-composition`.
- Next: `add-svg-text-labels`, then `add-container-queries`.
