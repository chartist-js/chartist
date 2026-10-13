# Proposal

## Why

Composed charts are the most-wanted Chartist feature: bar and line in one chart (#37) and left and right Y axes (#1058, #1405). Since step 4 and 5, the v2 core has layers, axis factories and presets, but a chart still has exactly one X and one Y axis and every layer draws all series. This change (step 6 of the `define-core-architecture` Migration Plan) makes `chart()` composable: several axes, layers bound to them, and each layer drawing its own series.

## API sketch

```ts
import {
  chart,
  cartesianAxes,
  stepAxis,
  autoScaleAxis,
  bar,
  line,
  axisGrid,
  axisLabels
} from 'chartist';

chart('#chart', {
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      { name: 'revenue', data: [120, 150, 170, 210] },
      { name: 'margin', data: [0.12, 0.18, 0.15, 0.22] }
    ]
  },
  axes: cartesianAxes([
    { id: 'quarters', side: 'bottom', type: stepAxis() },
    { id: 'revenue', side: 'left', type: autoScaleAxis(), referenceValue: 0 },
    {
      id: 'margin',
      side: 'right',
      type: autoScaleAxis(),
      labelInterpolationFnc: v => `${+v * 100}%`
    }
  ]),
  layers: [
    axisGrid({ axes: ['quarters', 'revenue'] }),
    bar({ series: ['revenue'], x: 'quarters', y: 'revenue' }),
    line({ series: ['margin'], x: 'quarters', y: 'margin', align: 'center' }),
    axisLabels()
  ]
});
```

## What Changes

- **Axes with ids and sides.**
  - `cartesianAxes()` also takes a list of axes, each with an `id`, a `side` (`top`, `bottom`, `left`, `right`) and the axis options (`offset`, `labelOffset`, `showLabel`, `showGrid`, …).
  - Several axes may share a side; their offsets stack outward.
  - The current `{ x, y }` form keeps working: `x` and `y` are the ids, and the sides come from `position`.
- **Layers bound to axes and series:**
  - every layer may name its X and Y axis by id (`x`, `y`; default `'x'`/`'y'`, or the first axis per direction);
  - it may select its series by index or name (`series`; default: all).
  - Each axis computes its range only from the series of the layers bound to it.
  - Series keep their chart-wide index, so classes (`ct-series-a`, …) and keys stay unique across layers.
- **`axisGrid()` and `axisLabels()` layers:** grid lines and labels as explicit layers for composed charts, for the axes they name (default: all). They use the 1.x geometry and classes, so 1.x CSS applies. The presets keep their internal grid and label layers unchanged.
- **Category alignment:**
  - step axes expose their step length;
  - `line({ align: 'center' })` places points in the middle of each step, so lines line up with bars.
  - The default stays the 1.x position (step start).
- **Compat is unchanged:** the presets (and so the 1.x classes) don't use the new features, so their output and events stay identical to 1.5.

## Out of scope

- SVG text labels with wrapping (`add-svg-text-labels`, next) and container-query responsive options (`add-container-queries`). Composed charts use the HTML labels of the presets until then.
- Polar composition (several pies, radial axes), log or time axes, stacked bars across layers.
- A preset or class for composed charts. Composition is a feature of the functional API only (author decision 2026-10-13): the 1.x classes exist so 1.x users don't break, and new features need the migration to the functional API. The classes and the presets are unchanged.
- 1.x events on composed charts. The compat plugin builds its 1.x `draw` and `created` events per preset (line, bar, pie), so it emits none for `chart()` with custom layers; converted 1.x plugins that rely on `draw` do nothing there. Composed charts use the v2 events (`compose`, `mount`, …). The migration guide says so.

## Breaking changes vs 1.x

None. The 1.x classes and presets are unchanged, as the parity tests and the visual baseline verify. The v2 additions are new options on `@experimental` APIs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chart-composition`: axes with ids and sides, several per side; layers bound to axes and series; grid and label layers; category alignment.

## Impact

- `packages/chartist/src/`:
  - `scales/` (axis list form, per-axis side and stacked offsets in the layout, step length);
  - `pipeline/` (per-layer axis binding and series selection, axis ranges from bound series);
  - `layers/` (`series`/`x`/`y` options on line and bar, `align` on line, new `axisGrid` and `axisLabels`);
  - `scales/grid.ts` (per-axis frames for any side).
- Tests: unit tests, `test:api` (`composition.v2.api.ts`, export lists), and the existing parity and visual suites as the regression guard.
- Examples: two new v2 examples (`composed/bar-and-line`, `composed/two-y-axes`) with their own visual baselines, recorded from v2 since 1.5 has no counterpart.
