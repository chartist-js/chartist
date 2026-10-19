## Why

Logarithmic scales are among the oldest open requests: #64 (2014) asks for log axes on both directions, and #1176 asks for decades (100, 1000, 10000, …) spaced evenly on the Y axis. Engineering and science data, growth curves and anything spanning several orders of magnitude are unreadable on a linear scale. The only way today is `chartist-logaxis` by @hansmaad, which monkey patches the 1.x `AutoScaleAxis` and doesn't work with the v2 functional API. v2 made axis types public factories (`AxisFactory`), so a log axis is now a plain addition.

The author decided on 2026-10-19 that new axis types go to `@chartist-js/essentials`, with the log axis (#64) named as one of its first, and planned it for the 2.2.0 milestone.

## What Changes

- **`logAxis(options)` in `@chartist-js/essentials`,** an `AxisFactory` for the presets' `axisX`/`axisY` and for the axes of `cartesianAxes()`:
  - **`base`** (default 10; any finite number above 1, such as 2);
  - **range:** from the data, widened to whole powers of the base, so 100 to 1,000,000 shows four evenly spaced decades (#1176); the axis's own `low` and `high` set it exactly, and layer extents (target lines, stacked bars) widen it as on the other scale axes;
  - **ticks at the powers of the base,** every nth power when decades are closer than `scaleMinSpace`; the `ticks` axis option sets them by hand (such as 10, 16, 25, 40 from #64);
  - **minor ticks** with `minorTicks: true`: grid lines without labels at 2×, 3×, … 9× each power (base 10), or at the powers left out when ticks are thinned;
  - **labels** show the tick value; `labelTransform` formats them, as on every axis;
  - **zero and negative values** have no place on a log scale: they don't count towards the range, and they're drawn at the start of the axis, so bars grow from the axis start and a zero sits on the bottom edge. A `low` or `high` of zero or below, or a `base` of 1 or below, throws.
- **Small additive core extensions in `chartist`,** for what an axis outside the core can't do through today's public API:
  - **Minor grid lines:** a `ScaleAxis` can list `minorTicks`; `axisGrid()` and the presets' grids draw a line for each, with the classes of the axis's grid lines plus `ct-grid-minor` and a lighter default look from `--ct-grid-minor-*` custom properties in the core stylesheet. Labels ignore them.
  - **Axis transforms:** an `AxisFactory` and the `ScaleAxis` it creates can declare a `transform` (`forward`, `inverse`): the axis is linear in `forward(value)`. `trendLine()` fits its line in that space, so a trend on a log axis is straight and follows the data (an exponential or power-law fit), and `Layer.extent` gets the transforms of the layer's axes. The presets' axis wrappers keep a factory's `transform`.
- **`@chartist-js/terminal`** leaves out minor grid lines: at one row per 16 px they'd fill the chart.
- **Docs:** a "Log axis" guide in the `@chartist-js/essentials` docs (decades, bases, minor grid lines, labels, zero values, bars, trend lines, multiple axes), a pointer from the "Axes and scales" guide's axis types, two examples.
- **Tests:** unit tests of the scale math (range, ticks, thinning, minor ticks, projection, zero and negative values, floating-point powers), scene tests with the line, bar, band, target line and trend line layers, a server rendering test, a terminal test, visual examples, API recordings and size budgets.

## Breaking changes vs 1.x

None. 1.x had no log axis. The core additions are optional members (`ScaleAxis.minorTicks`, `ScaleAxis.transform`, `AxisFactory.transform`, `ExtentContext.transforms`) and a new class with its own CSS rule: axes and charts that don't use them produce the same scene, node for node, and `trendLine()` on linear axes fits as before.

## Out of scope

- **Symmetric log scales** (`symlog`, values through zero and negative values on one axis) and **negative-only log axes**: possible later as their own axis type on the same transform hook.
- **Superscript labels** (`10³`) as a built-in format: `labelTransform` can return any text; whether the axis offers a formatter is an open question in the design.
- **Log scales on step axes** and on pie charts.
- **A log option on `autoScaleAxis()` or `fixedScaleAxis()`,** as in `chartist-logaxis` and the 1.x pull requests: the core keeps the axes it shipped in 2.0.
- **Typing `logAxis()` for the 1.x classes:** it's documented for the functional API. The classes' axis `type` takes only `AxisType` (the 1.x axis classes), and widening that type isn't worth it, so `logAxis()` isn't typed for them. That's not a block, just no extra cost spent on them.

## Capabilities

### New Capabilities

- `log-axis`: `logAxis()` in `@chartist-js/essentials`: base, range, ticks and their thinning, minor ticks, projection, zero and negative values, labels, its use with the line, bar, band, target line and trend line layers, multiple axes, server and terminal output, docs and examples.

### Modified Capabilities

- `chart-composition`: new requirements, added without changing the existing ones: minor grid lines from an axis's `minorTicks`, axis transforms, and trend lines fitted in the transformed space of their axes.
- `terminal-rendering`: a new requirement that minor grid lines are left out.

## Impact

- **Depends on `add-essentials-package`:** the `packages/essentials` project, its build, entry, stylesheet, size budgets, API recordings, docs pages under `/packages/essentials/`, the playground's import map, and the gallery's "Essentials" section with the `essentials` example type, where this change's examples go. This change adds the log axis to it and is applied after that change.
- **Coordinates with `add-time-axis`:** both add an axis factory to essentials and touch `src/scales/axis.ts` and `src/scales/grid.ts` in the core (`ScaleAxis.format` there, `minorTicks` and `transform` here). Whichever is applied second rebases on the other. **And with `add-label-thinning`,** which changes how `axisNodes` emits labels: minor grid lines have no labels, so the label filter never sees them.
- `packages/chartist`: `src/scales/axis.ts` (`minorTicks`, `transform`, `AxisTransform`), `src/scales/grid.ts` (minor grid nodes), `src/scales/cartesian.ts` (transforms in the extent context), `src/pipeline/types.ts` (`ExtentContext`), `src/layers/trendLine.ts`, the presets' axis wrappers (`src/presets/lineChart.ts`, `barChart.ts`), `AxisClassNames` (the `gridMinor` class name), `src/styles/` (`.ct-grid-minor`), `src/index.ts` (the `AxisTransform` type), API recordings, type tests, size budgets.
- `packages/essentials`: `src/logAxis.ts` and its specs, the entry, README, API recordings, a size budget entry.
- `packages/terminal`: skipping minor grid nodes, a test.
- `packages/examples`: two new v2 examples in `essentials/` (`log-axis`, `log-log`) with local baselines, recorded by the visual tests (their own package since #1525).
- `apps/docs`: the log axis guide in the essentials docs, a paragraph and link in `axes-and-scales.mdx`.
- No new runtime dependencies.
