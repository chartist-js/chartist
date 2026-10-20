# Design

## Context

- **Axis types are public factories.** An `AxisFactory` (`src/scales/axis.ts`) has a `kind` and `create(context)`, which gets the direction, the bound series (`{ x, y }` values), the labels, the chart area, the axis definition's options and the merged layer `extent`, and returns a `ScaleAxis`: `ticks`, `range`, `length` and `project(value)`, the distance in px from the axis start. `stepAxis()`, `autoScaleAxis()` and `fixedScaleAxis()` (`src/scales/factories.ts`) are the references. A log axis fits this contract without core changes for its range, ticks and projection.
- **How the layers use an axis** (read in the code):
  - `line()` and `band()` project every value; `line()`'s area closes at `areaBase` (default 0) clamped into `axis.range`, so it closes at the range's start whenever 0 is below it.
  - `bar()` grows bars from `valueAxis.project(0)`.
  - `targetLine()` projects its value and draws nothing when the result is outside `[0, length]` or not finite; its extent reports the value.
  - `trendLine()` fits a straight line to the raw values and projects only the two ends. Its `extent` runs before the axes exist and gets only the axis ids (`ExtentContext`).
  - Grid lines and labels come from `axisNodes()` (`src/scales/grid.ts`): one grid line and one label per tick; a label's box is as long as the distance to the next tick (1.x); a label function returning `null`, `undefined` or `false` drops both the grid line and the label.
- **The presets wrap the value axis factory** (`barChart.ts` `valueAxis()`, similar in `lineChart.ts`): they return `{ kind, create }`, compute `highLow` with `getHighLow()` (the bar chart adds `referenceValue: 0`) and pass it in the options. Anything else on the user's factory is dropped today.
- **The terminal renderer** (`packages/terminal/src/draw.ts`) draws every `grid` node in box-drawing characters; a cell is 8 × 16 px.
- **Prior art:** `chartist-logaxis` 1.3.1 (hansmaad) patches the 1.x `AutoScaleAxis` with `scale: 'log10'`: range floored and ceiled to decades, a tick per decade, projection `length / log(max/min) × log(value/min)`, minor grid lines evenly spaced between ticks (8 for log, which gives 2× to 9×) with `classNames.gridMinor` (`ct-grid-minor` in its README), and an error for zero or negative values. Users in #64 hit that error with bar charts (the bar chart's reference value 0) and asked for hand-picked ticks (10, 16, 25, … 25,000).
- **Parallel changes:** `add-essentials-package` creates `packages/essentials`; `add-time-axis` adds `ScaleAxis.format` to the core; `add-label-thinning` changes how `axisNodes()` emits labels.

## Goals / Non-Goals

**Goals:**

- A log axis that needs nothing but `type: logAxis()` for the common case: decades from the data, evenly spaced, readable labels.
- Every core layer draws something sensible on it, with no layer-specific options.
- The core additions are general (any custom axis can have minor ticks or a transform), optional, and leave existing scenes unchanged.

**Non-Goals:**

- Changing the core's axis types or their options.
- Symlog or negative log scales (the transform hook leaves room for them).
- Pixel-perfect parity with `chartist-logaxis`: its users migrate by changing the axis type.

## Decisions

### A factory in essentials, not a `scale` option on the core's scale axes

`logAxis()` lives in `@chartist-js/essentials`, as decided for new axis types. Its math is its own: a log range isn't `getBounds()` on transformed bounds, the ticks are powers, not "nice" linear steps.

- _Alternative, `autoScaleAxis({ scale: 'log' })` (chartist-logaxis, the 1.x pull requests, jacobq's `scalingTransformation`):_ grows the core, mixes options that mean nothing on a log scale (`onlyInteger`, `divisor`, `referenceValue`), and contradicts "the core keeps the axes it shipped in 2.0".

### Factory options for the log scale, axis options for the rest

`logAxis({ base, minorTicks })` takes what only a log axis has. `low`, `high`, `ticks`, `scaleMinSpace`, `labelTransform`, `showGrid` and the others stay in the axis definition, as for every axis type, so presets, responsive options and `cartesianAxes()` treat them the same way (a breakpoint can change `low` without recreating the factory).

- _Alternative, everything in `logAxis(options)`:_ one place to look, but two places for `low` and `high` once the axis definition also has them, and responsive options couldn't change them.
- **Ignored options:** `onlyInteger`, `divisor`, `referenceValue`. `highLow` (passed by the presets) is used only where its values are positive, so the bar chart's reference value 0 doesn't break the axis.

### The range is widened to whole powers

From the data, the range runs from `base^floor(log(minPositive))` to `base^ceil(log(max))`; equal ends widen by one power each way; no positive value gives 1 to `base`. This is what #1176 asks for (evenly spaced decades) and what chartist-logaxis did. Explicit `low`/`high` are used exactly, as `fixedScaleAxis()` does. Layer extents widen the range like data (positive parts only).

- **Projection** is `length × ln(value / min) / ln(max / min)`, independent of the base; the base decides only the ticks.
- **Exact tick values:** powers and multiples are rounded to 15 significant digits (`Number(x.toPrecision(15))`), so `3 × 0.1` is `0.3` and labels don't show float noise.

### Ticks: powers, thinned at exponents divisible by n

Every power fits when a decade is at least `scaleMinSpace` px; otherwise every nth, with n = `ceil(scaleMinSpace / decadePx)`, at exponents divisible by n. Anchoring on the exponent (not on the range start) keeps the same ticks while the chart resizes or the data grows by a decade. Inside a single decade (explicit `low`/`high` close together), the ticks fall back to whole multiples of the power (20, 30, …), thinned by the same rule, so the axis never has fewer than two labels when it can avoid it. A `ticks` option replaces all of this (the 10, 16, 25 … case from #64).

### Zero and negative values sit at the axis start

`project()` returns 0 for values of zero or below, and they're left out of the range.

- **Why:** it needs no change in any layer. Bars grow from `project(0)`, which becomes the axis start: the usual look of a log bar chart. Areas already clamp `areaBase` into the range. A zero in a measurement series stays visible, at the bottom, as Chart.js draws it.
- _Alternative, throw (chartist-logaxis, Highcharts' error #10):_ a single zero in live data breaks the chart, and the bar chart's reference value made it throw even without zeros in the data (#64).
- _Alternative, treat them as holes:_ more honest for lines, but every layer would need to ask the axis which values it accepts (a new core hook in line, bar, band, target line and trend line), and bars would still need a baseline. Users who want a gap can pass `null`, which is a hole on every axis. The guide says so.
- **Config errors still throw:** a `base` of 1 or less when `logAxis()` is called, and a `low` or `high` of zero or less when the axis is created, because those are mistakes in code, not in data.

### Minor ticks are a core concept, drawn by the grid

`ScaleAxis.minorTicks` lists them; `axisNodes()` draws a grid line for each, with the extra class `ct-grid-minor` (`classNames.gridMinor`, defaulted in `axisNodes()` with `classNames.gridMinor ?? 'ct-grid-minor'`), the role `grid` and `ctx.minor: true`, before the axis's major grid lines.

- _Alternative, minor ticks in `ticks` with empty labels:_ needs no core change, but the label boxes would shrink to the distance between minor ticks, the default label function would label every minor tick, a falsy label drops the grid line too, and CSS couldn't tell the lines apart.
- **The class name** is the one chartist-logaxis's README uses, so its users' CSS keeps working.
- **The default lives in the grid code,** not in the presets' `classNames` defaults (`lineDefaults`, `barDefaults`): those are the 1.x classes' resolved options, which 1.x code reads back, and a default in the grid code costs nothing and leaves them as they are. `axisGrid()` takes `gridMinor` in its `classNames`; the presets always draw `ct-grid-minor`.
- **The look** is in the core stylesheet (`--ct-grid-minor-color`, `--ct-grid-minor-width`, `--ct-grid-minor-dasharray`, default: the grid color at lower opacity, solid, following `light-dark()` like the grid), since any custom axis can produce minor ticks. It costs a few bytes of CSS.
- **Default off:** `minorTicks: false`, as in chartist-logaxis, so the default chart stays as sparse as the core's axes. See Decisions from review.
- **After thinning,** the powers left out become the minor ticks instead of the 2× to 9× multiples, which would be denser than the ticks themselves.

### A transform hook for trend lines

`AxisTransform` is `{ forward(value): number; inverse(value): number }`; the axis is linear in `forward(value)`. It's declared on the `AxisFactory` (so `extent`, which runs before the axes exist, can use it through `ExtentContext.transforms`) and carried by the `ScaleAxis` it creates. The log axis's transform is `log_base` and `base^x`. `trendLine()` fits in forward space and places its ends with `inverse`; the presets' wrappers spread the user factory so `transform` survives.

- **Why trendLine needs it:** today it fits the raw values and draws a straight segment between the projected ends. On a log axis that segment is neither the linear fit (a curve there) nor a fit of what the reader sees. Fitting in the axis's space gives the straight line readers of a log chart expect: an exponential fit on a log Y axis, a power law on log-log.
- _Alternative, `trendLine()` checks `axis.kind === 'log'`:_ couples the core to a package and to a base it can't see.
- _Alternative, draw the linear fit as a sampled curve:_ honest, but not what a log chart is for, and it needs a path instead of a `line` element.
- _Alternative, leave trend lines out of scope:_ the result would be wrong on screen without an error.
- **The slope in context** is in transformed units (powers per X unit for a log Y axis). The doc comment says so.
- **The correlation in context** is computed in the same space, so on a log axis it says how straight the trend looks on the chart (how well an exponential or power law fits), not how well a straight line fits the raw values. The doc comment says so.

### Terminal output skips minor grid lines

A terminal row is 16 px, so a three-decade axis with minor ticks would have a grid line in nearly every row. The terminal renderer skips `grid` nodes with `ctx.minor`; it's the only renderer change.

### Where the code goes

- `packages/essentials/src/logAxis.ts`: the factory, its option type and doc comment with an example; pure helpers for the range, ticks and minor ticks, exported only inside the package and unit tested on their own.
- `packages/chartist`: `AxisTransform` (type export), `ScaleAxis.minorTicks` and `.transform`, `AxisFactory.transform`, `ExtentContext.transforms`, the optional `gridMinor` class name with its default in the grid code, the minor grid nodes, the trend line fit, the presets' wrappers, the stylesheet rule.
- Examples: `essentials/log-axis` (a `lineChart` of growth from 120 to 850,000 on a log Y axis, labels with `toLocaleString`) and `essentials/log-log` (a `chart()` with two log axes, points, `minorTicks: true` and a `trendLine()` of a power law), in `packages/examples/essentials/` with the `essentials` type, so they show in the gallery's "Essentials" section that the essentials change creates, with `v2: true` and local baselines.

## Risks / Trade-offs

- [A zero drawn at the axis start reads as "very small"] → the guide explains it and shows `null` for gaps; the clamp is documented on `logAxis()`.
- [When the smallest value is an exact power, it sits on the axis edge, and its bar has no length] → the guide shows `low` one power lower; see Decisions from review.
- [Stacked bars on a log axis are misleading (segment lengths aren't proportional)] → they work mechanically; the guide recommends grouped bars or lines.
- [Three changes touch `src/scales/grid.ts` and `axis.ts` in the same weeks] → the proposal names the overlaps; whichever lands second rebases, and the scene tests of each change catch a lost hunk.
- [The transform hook is new public API that's hard to change in 2.x] → it's two functions with an obvious meaning, tested through `trendLine()`; decided stable (Decisions from review).
- [Core size budgets grow] → the minor grid nodes and the trend transform are a few dozen bytes; the budgets are re-measured and the numbers go in the commit message.

## Migration Plan

Additive: no migration for existing charts. Users of `chartist-logaxis` replace `type: Chartist.AutoScaleAxis, scale: 'log10'` with `type: logAxis()` and `showMinorGrid: true` with `logAxis({ minorTicks: true })`; their `.ct-grid-minor` CSS keeps working. The guide has a short note for them. After the release, the author decides whether to comment on and close #64 and #1176 (drafts first, per the GitHub rules).

## Decisions from review

The author decided on 2026-10-20:

- **Minor ticks are off by default,** so charts look as before. Minor grid lines also help on other axes, such as very large charts, so the core cost buys something beyond the log axis.
- **No extra power below an exact power:** the range doesn't drop one more power when the smallest value is exactly a power, as in Chart.js and chartist-logaxis; the guide shows `low` for it.
- **No built-in `10³` format for now:** `labelTransform` covers it.
- **The new core members are stable:** `AxisTransform`, `minorTicks`, `transform` and `ExtentContext.transforms`, with no `@experimental` tag.
- **The minor grid style is in the core stylesheet,** since the core's own scale axes could get subdivisions later too.
- **Zero and negative values are drawn at the axis start,** not thrown on and not turned into holes: one zero in live data never breaks a chart, bar charts work without layer changes, and `null` is there for a gap.
