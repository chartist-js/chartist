# Design

## Context

- **The v2 core** (`add-core-pipeline`) exists: scene nodes, the phase emitter, the pipeline, the renderers, `chart()` and custom layers. Its layout only knows padding; there are no axes yet.
- **1.x `LineChart`** (`src/charts/LineChart/LineChart.ts`) draws everything in one pass:
  - `createSvg` and `createChartRect` (axis offsets and positions, a 1 px minimum, the `viewBox` option);
  - axis classes (`StepAxis`, `AutoScaleAxis`, `FixedScaleAxis` extend `Axis`), with `Axis.createGridAndLabels` for grids and HTML labels;
  - the series, drawn with `Interpolation` and `SvgPath`.
- **1.x DOM order** that parity must reproduce:
  - `svg.ct-chart-line` holds `g.ct-grids`, then an unclassed series `g`, then `g.ct-labels`.
  - The grids group has the X grid lines, then the Y grid lines, and the grid background inserted first.
  - The labels group has the X labels, then the Y labels: `foreignObject[style="overflow: visible;"]` containing a `span` with inline px sizes; X labels set width first, Y labels height first.
  - Each series group holds its area paths (each inserted first), then the line (inserted first), then the points. `reverseData` iterates the series in reverse.
  - The root has `width`, `height` and `style="width: …; height: …;"`, plus `viewBox` when set.
- **Visual harness:** it aliases `chartist` per mode (`local`, `v1`). Four line examples use 1.x `draw`/`created` events or SMIL animation: `modify-drawing`, `path-animation`, `simple-svg-animation`, `svg-animation`.

## Goals / Non-Goals

**Goals:**

- `lineChart` output equals 1.x `LineChart` output: markup in jsdom, pixels in Chromium.
- Axes and layers as reusable v2 building blocks for bar, pie and composition (steps 5 and 6).
- No classes in new code (factories and plain objects). `SvgPath` and `Interpolation` are shared 1.x modules, used as they are (define-core-architecture D11).

**Non-Goals:**

- 1.x events, the deferred first render and the class wrapper (next change).
- New axis features (log or time axes, multiple axes per side).

## Decisions

### D1 Modules

```
src/scales/     axis.ts (types, layout math), step.ts, autoScale.ts, fixedScale.ts,
                legacy.ts (adapter for 1.x axis classes), grid.ts (grid + label nodes)
src/layers/     line.ts
src/presets/    lineChart.ts, lineDefaults.ts (copy of the 1.x defaults)
```

- Named `scales/` to avoid confusion with the 1.x `axes/` folder, which stays untouched.
- `lineDefaults.ts` copies the 1.x defaults. The next change makes the 1.x class a wrapper, so the copy becomes the only definition.

### D2 Axis objects and the layout phase

```ts
interface AxisFactory {
  kind: string;
  create(ctx: AxisContext): ScaleAxis;
} // stepAxis(options?) etc.
interface AxisContext {
  dimension: 'x' | 'y';
  series: NormalizedSeries[];
  area: Area;
  options: AxisOptions;
}
interface ScaleAxis {
  dimension: 'x' | 'y';
  ticks: readonly Label[];
  range?: { min: number; max: number };
  length: number; // axis length in px
  project(value, index?, series?): number;
}
```

- **Pipeline extension:**
  - `ResolvedConfig` gains optional `axes: { x?: AxisSetup; y?: AxisSetup }`, where an `AxisSetup` is a factory plus 1.x axis options (`offset`, `position`, `labelOffset`, `showGrid`, `showLabel`, `labelInterpolationFnc`, …).
  - When axes are set, `layout` computes the area with the `createChartRect` rules: offsets per side, the minimum size, and a 1 px minimum area.
  - `layout` then creates the axes from the prepared data. The payload becomes `{ width, height, padding, area, axes }`, and layers receive `axes` in their context.
  - Charts without axes behave as before.
- **Same math as 1.x:** `getHighLow`, `getBounds`, `projectLength` and `getMultiValue` are the existing pure helpers. The step, auto-scale and fixed-scale rules are ported line by line from the 1.x classes, so both produce the same numbers.
- **1.x axis classes** (and custom 1.x subclasses), detected by `prototype.projectValue`, are wrapped by `legacyAxis(type)`:
  - it constructs the class with 1.x arguments (`axisUnits`, normalized series, a `chartRect` with `width()`/`height()`) and reads `ticks`, `range` and `projectValue` from the instance;
  - presets never import the 1.x classes, so they don't land in v2 bundles;
  - `test/api` verifies that a class and the matching factory render the same output.

### D3 Grids, labels and the HTML namespace

- `scales/grid.ts` builds nodes with the 1.x geometry:
  - grid `line` nodes (role `grid`, ctx `{ axis, index }`);
  - an optional grid background `rect` (role `gridBackground`);
  - labels: `foreignObject` (role `label`, ctx `{ axis, index, text }`) containing a `span` with the 1.x classes and an inline `style` (width/height order per axis).
- **Renderers:**
  - The DOM renderer creates the children of a `foreignObject` in the XHTML namespace.
  - The string renderer writes `xmlns="http://www.w3.org/1999/xhtml"` on the first element inside a `foreignObject`.
  - This is a generic rule: any HTML content in a `foreignObject` works.

### D4 The line layer

- `line(options)` returns a `Layer` for cartesian coordinates. It projects with `ctx.axes`, interpolates with the 1.x functions (`monotoneCubic` when `lineSmooth: true`, `none` when `false`, or the given function), and builds:
  - one series `g` per series (role `series`; `ct:series-name`, `ct:meta`, `ct-series ct-series-<letter>` or the series `className`);
  - areas, line and points in the 1.x order (see Context);
  - `ct:value`/`ct:meta` on points as 1.x formats them (`serialize`).
- **Node contexts** carry what 1.x draw events expose:
  - point: `value`, `meta`, `x`, `y`, `seriesIndex`, `valueIndex`, `series`;
  - line/area: `values`, `path` (an `SvgPath` clone), `meta`, `series`.
  - The compat plugin (next change) maps these to 1.x events.

### D5 lineChart: a preset is a config plus an internal plugin

- `lineChart(target, data, options = {}, responsiveOptions)`:
  1. merges `options` into the copied 1.x defaults (`extend`, as 1.x does);
  2. builds a `chart()` config with `axes`, `padding` (`chartPadding`), `width`/`height`, and `layers: [line(...)]`;
  3. installs an internal preset plugin first. In `scene`, the plugin wraps the layer output in the 1.x groups, adds the root `class`, `style` and `viewBox`, and adds the grid and label nodes. User listeners therefore always see the final 1.x structure.
- The root size attributes follow 1.x: `width`/`height` default to `100%`, and the size comes from `viewBox` when it is set.
- **Responsive options (window mode):**
  - the preset evaluates `matchMedia` for each query, extends the options in order, and listens for `change` events;
  - a change re-runs from `resolve`;
  - `destroy` removes the listeners;
  - without `window`, responsive options are ignored, as no media applies.
- **Return value:** the v2 handle (`update`, `destroy`, `on`, `off`). The handle's `update` takes v2 config changes. Updating 1.x data and options (`update(data, options, override)`) is the class wrapper's job in the next change.

### D6 Parity checks

- **jsdom:** `test/parity/line.spec.ts` renders each fixture with `new LineChart` (awaiting `created`) and with `lineChart` into containers mocked to 500 × 300. It compares normalized markup: attributes sorted, numbers kept as written.
  - Fixtures cover the 1.x `LineChart.spec.ts` cases plus the options of every line example: area, holes, interpolations, fullWidth, reverseData, series overrides, fixed and auto axes, labelInterpolationFnc, chartPadding, `viewBox`, `showGridBackground`, classNames.
- **Visual:** `CHARTIST_LIB=v2` aliases `chartist` to `test/visual/fixture/v2-line.ts`. That shim re-exports the local build and replaces `LineChart` with a tiny test-only class around `lineChart`.
  - The spec skips the four event and animation examples in this mode and runs everything else against the 1.5 baseline.
  - New Nx target `test:visual:v2`, on its own port.

## Risks / Trade-offs

- [Floating-point drift between the ported axis math and 1.x] → The same helpers are reused and the rules ported line by line. Parity tests compare numbers as strings, so any drift fails.
- [Container vs svg size: v2 measures the container, 1.x the svg] → The svg is 100% of the container in both. The visual parity run in Chromium is the authority; a mismatch there changes the DOM host to measure the rendered svg.
- [1.x draw event order (grid and label interleaved per tick) differs from the v2 compose order] → It doesn't matter here. The next change's compat plugin must emit `draw` in 1.x order; a design note is left for it.
- [The defaults copy drifts from the 1.x class until the switch] → It's covered by parity tests, and the next change removes the duplicate.

## Migration Plan

Additive only: merge when the gate, the parity tests and `test:visual:v2` are green. Rollback means reverting the commit.

## Open Questions

- Whether `lineChart`'s handle should already accept 1.x-style `update(data, options, override)`. This change keeps the v2 `update` and leaves the 1.x form to the class wrapper. That can be revisited without changing the parity work.
