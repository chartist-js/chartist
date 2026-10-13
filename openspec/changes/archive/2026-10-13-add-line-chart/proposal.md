# Proposal

## Why

Step 4 of the `define-core-architecture` Migration Plan turns the first 1.x chart type into a preset over the v2 core. That proves the architecture can reproduce 1.x exactly. Step 4 covers too much for one reviewable change, so it is split:

- **This change** builds the v2 axes and the line layer, plus the `lineChart()` preset next to the untouched 1.x `LineChart`. It proves output parity.
- **The next change** switches `LineChart` to a wrapper over `lineChart`, moves the legacy surface and adds the compat plugin.

## What Changes

- **Axis factories** (no classes): `stepAxis()`, `autoScaleAxis()` and `fixedScaleAxis()`.
  - They return plain axis objects that compute range, ticks and projection with the 1.x math (`getBounds`, `getHighLow`, `projectLength`).
  - They draw grid lines and labels as scene nodes with roles `grid` and `label`, plus an optional grid background (role `gridBackground`).
  - Presets accept the 1.x axis classes (`axisX: { type: FixedScaleAxis }`) and map them to the factories.
- **Labels.** HTML labels (`foreignObject` + `span`, 1.x structure and inline sizes) are scene nodes. The DOM renderer creates them in the XHTML namespace; the string renderer writes `xmlns` on the span.
- **Line layer** (`line()`):
  - points, line and area paths with the 1.x `Interpolation` functions;
  - per-series options (`series: { name: {...} }`), `areaBase`, holes, `fullWidth`, `reverseData`;
  - the 1.x classes and `ct:value`/`ct:meta`/`ct:series-name` attributes.
  - Point, line and area nodes carry the 1.x draw-event data in their `ctx` (value, meta, x/y, path), so the compat plugin can emit 1.x `draw` events from `compose` later.
- **`lineChart(target, data, options?, responsiveOptions?)`:**
  - takes the 1.x arguments and defaults, and produces the 1.x structure: a `ct-chart-line` svg with grids, series and label groups;
  - window-mode responsive options re-render on media changes, as in 1.x;
  - it renders synchronously and returns the v2 handle.
- **Parity checks:**
  - **jsdom parity tests** render option fixtures (from the 1.x LineChart tests and the line examples) with 1.x `LineChart` and with `lineChart`, and compare normalized markup;
  - **visual parity:** a new `test:visual:v2` target runs the screenshot suite with `LineChart` swapped for a shim over `lineChart`. The 26 line examples that don't use 1.x `draw` events or animations must match the 1.5 baseline pixel for pixel.

No 1.x module changes behavior: `LineChart`, its events and the existing tests stay as they are.

## Out of scope

- Switching `LineChart` to the wrapper, the 1.x deferred first render, the legacy surface move and the compat plugin (next change).
- Bar and pie (step 5), multiple axes and container queries (step 6).
- SVG `text` labels with wrapping. The line preset uses the 1.x HTML labels; SVG text labels come with composable charts in step 6.

## Breaking changes vs 1.x

None. `lineChart` is new, and the 1.x API is unchanged. Parity with 1.x is the acceptance criterion; the parity checks fail on any difference.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chart-composition`: adds axis factories as the v2 axis types, and requires presets to accept the 1.x axis classes as `type`.

## Impact

- `packages/chartist/src/`: new `axes-v2/` (factories), `layers/line.ts`, `presets/lineChart.ts`, `render/` (XHTML in `foreignObject`), and new exports (`lineChart`, `line`, `cartesianAxes`, `stepAxis`, `autoScaleAxis`, `fixedScaleAxis`, all `@experimental`). Nothing in `charts/`, `axes/` or `core/` changes.
- `packages/chartist/test/`: jsdom parity tests, and the visual shim plus the `test:visual:v2` target.
- `test/api`: export list and `*.v2.*` tests for the new exports.
- `.size-limit.json`: an `import { lineChart }` budget from the measured size. It is compared with the 1.x `import { LineChart }` (8.56 kB) and recorded in the plan; the goal is to stay at or below it once the 1.x code is gone.
