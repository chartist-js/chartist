# Proposal

## Why

Step 5 of the `define-core-architecture` Migration Plan converts the bar and pie charts. `add-line-chart` and `add-compat-plugin` established the pattern: layer, preset, 1.x class wrapper, compat events, and parity against 1.5.0. This change applies it to the bar chart, the second cartesian chart, whose label/value axes, stacking and horizontal mode exercise the axis model beyond the line chart. Pie follows in its own change (the first polar layer).

## What Changes

- **`bar()` layer:**
  - bars as `line` elements with the 1.x geometry;
  - label axis and value axis by `horizontalBars`, `seriesBarDistance` offsets around the step center, and `distributeSeries`;
  - stacking (`stackBars` with `stackMode` `accumulate`, `accumulate-relative` and overlap) and clamping to the chart area;
  - holes keep their stack slot, as in 1.x;
  - nodes with roles `series` and `bar`, carrying the 1.x draw-event data in `ctx`.
- **Axes:**
  - `cartesianAxes()` gets 1.x normalization options (`multi: 'x' | 'y' | true`, `distributed`);
  - `ScaleAxis` exposes `kind` and `stretch`, so layers can tell step axes apart as 1.x did with `instanceof StepAxis`;
  - the bar preset computes the value axis bounds from stacked sums (`highLow`) and forces `referenceValue: 0` like 1.x.
- **`barChart(target, data, options?, responsiveOptions?)`:** the 1.x options and output (`ct-chart-bar`, `ct-horizontal-bars`; grids and labels of the label axis before the value axis).
- **`BarChart` becomes a wrapper** over `barChart` with the 1.x class API, like `LineChart`. The class logic shared by both moves into a common base `PresetChart` (extends `BaseChart`).
- **Generic preset controller:** the `createLineChart` controller (1.x option merge, responsive options, `responsive` events, preset state for compat) becomes `createPreset(...)`, used by line and bar.
- **Compat for bars:**
  - `bar` draw events and `created` with the 1.x payloads, and the 1.x bar axes (`labelAxis`/`valueAxis` setup);
  - grid and label events follow the axis order of the chart, not a fixed X-then-Y order.
- **Parity:** jsdom markup and event parity fixtures for every bar example and the 1.x `BarChart.spec.ts` cases, against `chartist-v1`. The two bar examples with 1.x events (`stacked`, `with-circle-modify-drawing`) add `compat`.

## Out of scope

- The pie chart (next change) and the legacy surface move (after pie).
- New bar features: rounded bars, grouped plus stacked bars, bar width options.

## Breaking changes vs 1.x

The same as for `LineChart` in `add-compat-plugin`, now for `BarChart`:

- **BREAKING (restored by adding `compat`):** without the compat plugin, `BarChart` emits no 1.x events and skips 1.x plugin functions, with one-time warnings.
- **Behavior difference with `compat`:** `draw` handlers run after rendering. Elements appended to `data.group` land at the end of the group.

The output without listeners is identical to 1.5, as the parity tests and the visual baseline check.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chart-composition`: axes report their kind and whether they are stretched, and axis normalization follows the chart type (value dimension, distributed series).

## Impact

- `packages/chartist/src/`:
  - `layers/bar.ts`;
  - `presets/barChart.ts`, `presets/barDefaults.ts` and the generic `presets/preset.ts` (the line preset is refactored onto it);
  - `charts/PresetChart.ts`, with `LineChart` and `BarChart` as thin subclasses;
  - `scales/` (normalization options, `kind`/`stretch`);
  - `compat/` (bar payloads, axis order).
- The 1.x bar implementation in `charts/BarChart/BarChart.ts` is replaced by the wrapper; `getSerialSums` moves to the bar layer.
- Tests:
  - `BarChart.spec.ts` with `compat`;
  - `test/api` (bar tests with `withCompat`, export lists);
  - `test/parity` (bar markup and events);
  - the two bar event examples import `compat`.
  - The public API test that requires `LineChart`'s direct prototype to be `BaseChart` is relaxed to `instanceof BaseChart`, because a shared `PresetChart` sits in between.
- `.size-limit.json`: `import { barChart }`, and `import { BarChart }` re-baselined.
