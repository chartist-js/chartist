# Design

## Context

- **Axes today:** `cartesianAxes({ x, y, reverseData, normalize })` creates at most one X and one Y axis. The layout reserves each axis's `offset` on the side given by `position` (the 1.x `createChartRect` rules). Layers receive `ctx.axes = { x, y }` and the data of all series.
- **Grids and labels:** `scales/grid.ts` (`axisNodes`) draws them with the 1.x geometry. Each axis uses its own options, the chart area and the padding. The presets wrap it in their internal grid and label layers.
- **The line layer** places points at the start of each step (1.x). The bar layer centers bars in each step (1.x).
- **Parity:** the presets and the 1.x classes must not change output or events; the parity suites and the visual baseline guard them.

## Goals / Non-Goals

**Goals:**

- Bar + line and dual-axis charts with `chart()`, using the existing layers and axis factories.
- The shorthand `{ x, y }` and the presets render byte-identically to today.

**Non-Goals:**

- SVG text labels (`add-svg-text-labels`) and container queries (`add-container-queries`).
- Cross-layer stacking, polar composition, new axis types.

## Decisions

### D1 Axis list form

```ts
cartesianAxes([
  { id: 'quarters', side: 'bottom', type: stepAxis() },
  { id: 'revenue', side: 'left', type: autoScaleAxis() },
  { id: 'margin', side: 'right', type: autoScaleAxis() }
], { reverseData?, normalize? })
```

- `side` gives the direction: `top`/`bottom` are X axes, `left`/`right` are Y axes.
- The object form `{ x, y }` maps to ids `x`/`y`. Its sides come from 1.x `position`: X `end` → `bottom`, `start` → `top`; Y `start` → `left`, `end` → `right`.
- Ids must be unique; an unknown id in a layer binding throws `Unknown axis "<id>"`.

### D2 Layout with several axes per side

- Offsets are summed per side. The area is computed with the 1.x formulas generalized to sums:
  - `x1 = left + Σleft`, `x2 = max(w − right − Σright, x1 + 1)`;
  - `y2 = top + Σtop`, `y1 = max(h − bottom − Σbottom, y2 + 1)`;
  - with `w = max(width, Σleft + Σright + left + right)` and the same for `h`.
  - With one axis per direction this is exactly the current `axisArea`, so the shorthand and the presets are unaffected.
- Every axis gets an `inset`: the sum of the offsets of the axes declared before it on the same side, so later axes stack outward.

### D3 Axis creation from bound series

- Normalization runs once for the whole data, as today.
- For each axis, the pipeline collects the series selected by the layers bound to it, and creates the axis from those normalized series only. An axis no layer is bound to uses all series (as the shorthand does).

### D4 Layer binding and series selection

- **`Layer` gains optional fields:**
  - `axes?: { x?: string; y?: string }`;
  - `series?: readonly (number | string)[]`, where strings match series names.
  - `line()` and `bar()` take `x`, `y` and `series` options and expose them through these fields.
- **Defaults:** the first axis per direction, and all series.
- **The layer context gets:**
  - `axes = { x, y }`, the bound axes, so layers stay unchanged;
  - `data` and `normalized` with only the selected series;
  - `seriesIndexes`, which maps the layer's series to their chart-wide indexes.
- **The line and bar layers** use the chart-wide index for the series class letter, `ctx.seriesIndex` and keys. Bar offsets (`biPol`) still count within the layer, as 1.x counts within its chart.

### D5 `axisGrid()` and `axisLabels()`

- `scales/grid.ts` gets a per-axis frame: `{ side, offset, inset, labelOffset, showGrid, showLabel, labelInterpolationFnc, position classes }`. Label positions per side:
  - **bottom:** `y = y1 + inset + labelOffset.y + 5`;
  - **top:** `y = y2 − inset − offset + labelOffset.y + 5`;
  - **left:** `x = x1 − inset − offset + labelOffset.x`;
  - **right:** `x = x2 + inset + labelOffset.x + 10`.
  - With `inset = 0` these are the 1.x formulas.
- The presets keep calling the same geometry, so their output doesn't change.
- **Layers:** `axisGrid({ axes?, background? })` and `axisLabels({ axes? })` render `g.ct-grids` and `g.ct-labels` for the named axes (default: all), with the 1.x classes. The position class is `ct-start` for `top`/`left` and `ct-end` for `bottom`/`right`.

### D6 Category alignment

Step axes expose `step`, the step length. `line({ align: 'center' })` adds `step / 2` to each point along a non-stretched step axis, which is where bars are centered. The default `'start'` keeps the 1.x position.

### D7 Examples and visual baselines

- `packages/examples/composed/bar-and-line` and `composed/two-y-axes` are v2 examples: HTML + TypeScript + CSS, using `chart()`, with the manifest type `composed`.
- Their visual baselines are recorded from the local build. `test:visual:v1` skips the type `composed`, because 1.5 has no counterpart.

## Risks / Trade-offs

- [Series filtering changes indexes inside layers] → Chart-wide indexes are passed explicitly (`seriesIndexes`), and the unit tests cover the classes and keys across layers.
- [A generalized layout regresses the presets] → The formulas reduce to the current ones for one axis per direction. The line, bar and pie parity suites and the visual baseline run unchanged.
- [Visual baselines recorded from v2 only document the current output] → They are reviewed by eye once when recorded, then guard against regressions like the others.

## Migration Plan

Additive. Rollback means reverting.

## Implementation notes

- **Binding lives in `cartesianAxes()`.** `CartesianAxes.bind(layers, data)` resolves each layer's axis ids and series, and `create(data, area, bindings)` gives each axis only its bound series. The presets use the internal `presetAxes()` core without `bind`, so they don't bundle the binding, the list form or the id checks. Without `bind`, every layer draws all series on the first X and Y axis.
- **Layers without series don't shape ranges.** `axisGrid()` and `axisLabels()` declare `series: []`; an axis no series layer is bound to covers all series. Found while reviewing the `two-y-axes` baseline: the grid's default binding to the first Y axis had widened its range to every series.
- **Side placement lives in `layers/axes.ts`.** `axisNodes()` takes an optional `place` function, so the per-side label formulas aren't bundled by the presets. At inset 0 they match the preset geometry (unit test).
- **1.x `series` on the line layer is now `overrides`.** `series` selects series in every layer; the line preset maps the 1.x `series` option to `overrides`.
