# Design

## Context

- The line chart pattern exists (`add-line-chart`, `add-compat-plugin`): a layer, a preset controller (`createLineChart`), the `LineChart` wrapper extending `BaseChart`, compat events built from node contexts, and parity against `chartist-v1`.
- **1.x `BarChart.createChart`:**
  - normalizes with the value dimension (`horizontalBars ? 'x' : 'y'`) and `distributed: true`;
  - computes the value axis bounds from stacked sums (`getSerialSums`) when `stackBars` is set and `stackMode !== true`;
  - creates the value axis with `{ ...axisOptions, highLow, referenceValue: 0 }` and the label axis as `StepAxis({ ticks })`, or the configured classes;
  - draws grids and labels of the label axis first, then of the value axis;
  - per series: bars offset by `seriesBarDistance` around the step center (only for `StepAxis` label axes), stacked per value index with separate positive and negative stacks in `accumulate-relative`, clamped to the chart area, skipping holes after updating the stack;
  - emits `draw` per bar, then `created`.
- **`stacked` and `with-circle-modify-drawing`** are the bar examples with 1.x events.

## Goals / Non-Goals

**Goals:**

- `barChart` output and `BarChart` + compat events identical to 1.5 (parity tests, visual baseline).
- Shared preset and class infrastructure, so pie is a small change.

**Non-Goals:**

- New bar features; changing 1.x bar semantics, including its quirks (the forced `referenceValue: 0`, clamping).

## Decisions

### D1 Generic preset controller

`presets/preset.ts` exports:

- `createPreset({ kind, defaults, config(data, options), rootClass(options) })`, which returns the controller (`handle`, `setData`, `setOptions`, `render`, `options()`, `data()`) with the 1.x merge rules, window responsive options and `responsive` events, plus the preset state (`kind`, `options`, `data`, `update`, `detach`) for compat;
- the shared grid and label layers (axis order given by the preset);
- `axesConfig` helpers.

`createLineChart` and `createBarChart` are thin uses of it.

### D2 Axes: normalization options, kind and stretch

- `AxesConfig` gains `normalize?: { multi?: true | 'x' | 'y'; distributed?: boolean }` (default: `true`, not distributed). `cartesianAxes` passes these to `normalizeData`.
- `ScaleAxis` gains `kind` (`'step' | 'autoScale' | 'fixedScale' | string`) and `stretch?`.
  - `legacyAxis` sets the kind from the instance: a 1.x `StepAxis` instance reports `step`, and its `stretch` is copied.
  - The bar layer applies the step-center offset only for `kind === 'step'`, like 1.x's `instanceof StepAxis`.
- **Bar value axis:** the preset wraps the value axis factory so `create` receives `highLow` (stack sums when stacking) and `referenceValue: 0`, computed from the normalized series in the axis context. The label axis default is `stepAxis` with ticks from the labels (only the first one for `distributeSeries` + `stackBars`).

### D3 The bar layer

`bar(options)` ports the series loop: `labelAxis`/`valueAxis` from `horizontalBars`, `zeroPoint`, the stacks, `periodHalfLength`, `biPol`, the clamping, and `ct:value`/`ct:meta`.

- Nodes:
  - series `g` with role `series`;
  - `line.ct-bar` with role `bar` and ctx `{ value, valueIndex, meta, series, seriesIndex, x1, y1, x2, y2 }`.
- `getSerialSums` moves into the layer module.

### D4 Classes: `PresetChart`

- `charts/PresetChart.ts` (an abstract class extending `BaseChart`) holds the wrapper logic of `LineChart`: the queue, the install-time handle, `update`, `detach`, the filtered `'*'`, plugin splitting, field sync and window resize.
- `LineChart` and `BarChart` only pass their preset factory and defaults.
- The public API test of the direct prototype becomes `instanceof BaseChart`. `BaseChart` is still in the chain, so user `instanceof` checks keep working.

### D5 Compat

- **Axis order:** grid and label events follow the order of the axes in the scene (first appearance among the grid nodes, then the label nodes), so bars get label axis first and line charts X first, as in 1.x.
- **1.x axis instances:** built by preset kind:
  - `line`: as today;
  - `bar`: value axis `AutoScaleAxis` (or the configured class) with `highLow` and `referenceValue: 0`, label axis `StepAxis({ ticks })` (or the class), assigned to `axisX`/`axisY` by `horizontalBars`.
- **Payloads:**
  - `bar` draw payload: `{ type: 'bar', value, index, meta, series, seriesIndex, axisX, axisY, chartRect, group, element, x1, y1, x2, y2 }`;
  - `created`: `{ chartRect, axisX, axisY, svg, options }`.

### D6 Parity and contract

- **Fixtures:** `test/parity/bar-fixtures.ts` holds the 17 bar examples' data and options and the `BarChart.spec.ts` cases.
- **Tests:** `bar.spec.ts` (markup) and `bar-events.spec.ts` (events) against `chartist-v1`.
- **Contract suites:** `BarChart.spec.ts` adds `compat` in its helper. The `test:api` bar constructions get `withCompat`.

## Risks / Trade-offs

- [Floating-point drift in stacking and clamping] → The arithmetic is ported in the same order; the parity fixtures compare numbers as strings.
- [Refactoring the line preset onto `createPreset` could regress line parity] → The line parity and event parity suites run unchanged.
- [`import { BarChart }` grows like `LineChart` did] → Measured and recorded; it shrinks when `BaseChart` loses its 1.x paths after pie.

## Migration Plan

Commits:

1. Refactor the line preset and wrapper onto the shared infrastructure (line suites green).
2. The bar layer, preset, wrapper and compat.
3. Parity and contract tests.
4. Examples.

Rollback means reverting.
