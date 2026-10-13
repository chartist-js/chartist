# Tasks

## 1. Tests first

- [x] 1.1 Unit: wrapping (fits, long word, empty label, estimate) and the alignment table rows (D5), against fixed measurements.
- [x] 1.2 Unit: mode resolution and precedence (layer > chart > toScene option > renderer default); the 1.x classes drop `labels`.

## 2. Implementation

- [x] 2.1 `Renderer.labels`, `domRenderer()` → `html`; `labels` on the chart config and the `toScene()` options (default `svg`); `LayerContext.labels`.
- [x] 2.2 SVG label module (wrapping, alignment, `text`/`tspan` nodes) plugged into `axisNodes()`; `axisLabels({ labels, align })`.
- [x] 2.3 Presets: `labels` option on `lineChart`/`barChart` with their alignment rows; `PresetChart` drops `labels`.
- [x] 2.4 DOM measurement inside the chart container (D6), estimate as the fallback.

## 3. Verification

- [x] 3.1 `test:api`: the scenarios of the delta (defaults per path, opting in, layer override, string output without `foreignObject`), export lists.
- [x] 3.2 Visual: examples `composed/svg-labels` and SVG-label variants of a line and a bar example (manifest `v2`), baselines recorded from v2 and reviewed against the HTML labels.
- [x] 3.3 Parity suites and the 67 1.5 baselines unchanged.
- [x] 3.4 Sizes recorded in the plan; full gate (`pnpm nx run-many -t typecheck check build test test:smoke test:size test:visual test:visual:v1 test:api test:api:v1 test:e2e lint`, `pnpm nx format:check --all`).
