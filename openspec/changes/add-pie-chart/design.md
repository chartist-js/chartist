# Design

## Context

- The shared infrastructure exists (`add-bar-chart`): `createPreset`, `PresetChart`, the parity helpers, and compat built from node contexts.
- **1.x `PieChart.createChart`:**
  - normalizes flat (`normalizeData(data)`);
  - takes the area from `createChartRect` without axes;
  - `radius = min(width, height) / 2`, minus half the donut width for donuts (`donutWidth` in px or %);
  - computes the label radius from `labelPosition` and `labelOffset`, and the center of the area;
  - creates one `g` per series up front, then an unclassed labels `g` when `showLabel` is set;
  - per value: skips it for `ignoreEmptyValues`; sets the series name and class; computes the slice path (`SvgPath(!donut)`, arc, a line to the center for pies) with 0.2° overlap except for the first or a single non-zero value, capped at 359.99°; emits `slice`; then the label (center for a single series, `moveLabel` for `preventOverlappingLabelOffset`, `text-anchor` from `determineAnchorPosition`); emits `label`.
  - `created` is `{ chartRect, svg, options }`.
- `donut-animation` is the pie example with 1.x events.

## Goals / Non-Goals

**Goals:**

- `pieChart` output and `PieChart` + compat events identical to 1.5.
- The first polar layer on the v2 pipeline (`coordinates: ['polar']`).

**Non-Goals:**

- New pie features, and a v2 polar axis model (radial axes come with composition in step 6).

## Decisions

### D1 Layout without axes uses the 1.x minimums

The no-axes branch of `layout` computes:

- `width = max(width, left + right)`, `height = max(height, top + bottom)`;
- `x2 = max(width - right, x1 + 1)`, `y1 = max(height - bottom, y2 + 1)`.

These are the `createChartRect` rules without axes. The unit test that expected a 0-size area changes to 1 px.

### D2 The pie layer

`pie(options)` ports `createChart` as described in the Context.

- **Nodes:**
  - per value a series `g`: role `series`, with name and class (empty for ignored values, as 1.x creates the group and leaves it empty);
  - the slice `path`: role `slice`, ctx `{ value, totalDataSum, index, meta, series, path, center, radius, startAngle, endAngle }`;
  - the labels `g` with the `text` nodes: role `label`, ctx `{ index, text, series, meta, x, y }`, no axis.
- **The layer's output** is the series groups and then the labels group, with no wrapper groups (the 1.x structure).
- **`moveLabel`** is a pure function in the layer module. The `PieChart` class keeps a `moveLabel` method that calls it, because 1.x had a public method.

### D3 `pieChart` and `PieChart`

- **Preset:** `pieChart` is a `createPreset` spec with `coordinates: 'polar'`, `padding: chartPadding`, no axes, and the root class `chartDonut` or `chartPie`.
- **Class:** `PieChart extends PresetChart`. `determineAnchorPosition` stays exported from the module, as in 1.x.

### D4 Compat for pies

- **Axis events:** the axis grid and label events only consider label nodes with an axis in their context. Pie labels have none.
- **Per series:** for a series node with a `slice` child, compat emits the slice payload, then the label node of the same index (if any) with the 1.x label payload.
- **No axes:** pie charts have no 1.x axes, so `AXES.pie` returns nothing. `created` is `{ chartRect, svg, options }`, without axes.

### D5 Parity and contract

- **Fixtures:** `test/parity/pie-fixtures.ts` holds the 16 examples (their responsive variants as extra fixtures) and the `PieChart.spec.ts` cases.
- **Tests:** `pie.spec.ts` (markup) and `pie-events.spec.ts` (events) against `chartist-v1`.
- **Contract suites:** `PieChart.spec.ts` and the `test:api` pie constructions get `compat`.

## Risks / Trade-offs

- [Arc and label floating-point drift] → The same `polarToCartesian` and `SvgPath` are used, ported in the same order; the parity fixtures compare numbers as strings.
- [Changing the no-axes layout affects charts built with `chart()`] → Only charts whose padding exceeds their size change: from 0 px to 1 px of area, matching 1.x. Recorded in the spec.

## Migration Plan

Commits:

1. The layout minimums (pipeline tests updated).
2. The layer, preset, wrapper and compat.
3. Parity and contract tests.
4. The example.

Rollback means reverting.
