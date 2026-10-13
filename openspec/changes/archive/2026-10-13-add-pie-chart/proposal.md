# Proposal

## Why

The pie chart is the last 1.x chart type on the 1.x implementation, and the first one in polar coordinates. Converting it completes step 5 of the `define-core-architecture` Migration Plan for the chart types. After this, every 1.x chart class wraps a v2 preset, and the 1.x drawing code (`createSvg`, `createChartRect`, the 1.x chart bodies) is used only by the legacy surface. That clears the way for the legacy surface move.

## What Changes

- **`pie()` layer** (polar coordinates):
  - slices as `path` elements with the 1.x geometry: `startAngle`, `total`, `donut` and `donutWidth` (px or %), the 0.2° overlap between slices, the 359.99° cap, `ignoreEmptyValues`;
  - a series group per value (also for ignored values, as in 1.x), and an SVG `text` label group;
  - label radius by `labelPosition`/`labelOffset`, `labelDirection` anchors, `labelInterpolationFnc`, and the `preventOverlappingLabelOffset` shifting;
  - nodes with roles `series`, `slice` and `label`, carrying the 1.x draw data.
- **`pieChart(target, data, options?, responsiveOptions?)`:** the 1.x options and output (`ct-chart-pie` or `ct-chart-donut`).
- **`PieChart` becomes a `PresetChart` wrapper** over `pieChart`. It keeps `moveLabel()`, and the module keeps exporting `determineAnchorPosition`.
- **Chart area minimum** (`chart-pipeline`): charts without axes get the 1.x minimums. The chart is at least as large as its padding, and the area at least 1 px wide and high. Before, the area could be 0.
- **Compat for pies:**
  - `slice` and `label` draw events per value (slice, then its label) and `created` with `{ chartRect, svg, options }`, as in 1.x;
  - axis grid and label handling ignores the pie's labels.
- **Parity:** markup and event fixtures for all 16 pie examples and the 1.x `PieChart.spec.ts` cases against `chartist-v1`. The `donut-animation` example adds `compat`.

## Out of scope

- The legacy surface move (next change), and removing the 1.x drawing helpers from the chart classes' bundles.
- New pie features (padding angle, per-slice radius).

## Breaking changes vs 1.x

As for `LineChart` and `BarChart`:

- **BREAKING (restored by adding `compat`):** without the compat plugin, `PieChart` emits no 1.x events and skips 1.x plugin functions, with one-time warnings.
- **Behavior difference with `compat`:** `draw` handlers run after rendering.

Without listeners the output is identical to 1.5 (parity tests and the visual baseline).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chart-pipeline`: the 1.x chart area minimums apply to charts without axes.

## Impact

- `packages/chartist/src/`:
  - `layers/pie.ts`;
  - `presets/pieChart.ts`, `presets/pieDefaults.ts`;
  - `charts/PieChart/PieChart.ts` replaced by the wrapper;
  - the layout without axes in `pipeline/phases.ts`;
  - `compat/` (pie payloads).
- Tests:
  - `PieChart.spec.ts` with `compat`;
  - `test/api` (pie tests with `withCompat`, export lists, `pie.v2.api.ts`);
  - `test/parity` (pie markup and events);
  - the pipeline unit test that expected a 0-size area.
- `.size-limit.json`: `import { pieChart }`, and `import { PieChart }` re-baselined.
