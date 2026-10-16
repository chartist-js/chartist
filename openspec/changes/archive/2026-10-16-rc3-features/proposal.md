## Why

The road to 2.0 final (`docs/decisions.md`) puts five small, additive items into rc.3, next to the `labelTransform` rename: dark mode defaults (#1463), grouped stacked bars (#262), a trend line (#1209), label alignment per axis (#1487) and line breaks in pie labels (#546). Each is asked for in an open issue and is small on its own; together they make rc.3 worth trying before the update RC (rc.4).

## What Changes

- **Dark mode defaults (#1463):** the default label and grid colors follow the page's `color-scheme`: on a dark scheme, light text and grid lines. Pages without a dark `color-scheme` render exactly as before. The custom properties (`--ct-label-color`, `--ct-grid-color`) still win, and Sass settings switch it off.
- **`offset` on `bar()` (#262):** moves a bar layer's bars along the label axis by a number of px. Two stacked bar layers with opposite offsets draw grouped stacks.
- **`trendLine()` layer (#1209):** fits a least-squares line through each selected series and draws it from the series' first to its last X, in the series' color, dashed by default. Its ends count towards the Y axis.
- **`labelAlign` per axis (#1487):** the axes of the presets (`axisX`, `axisY`) and of `cartesianAxes()` take `labelAlign`, which aligns that axis's SVG text labels and wins over the `align` of `axisLabels()`.
- **Line breaks in pie labels (#546):** a `\n` in a pie or donut label starts a new line, drawn as `tspan`s and centered on the label's anchor.

## Breaking changes vs 1.x

None for pages without a dark `color-scheme` and labels without line breaks:

- the dark defaults apply only when the page or chart declares `color-scheme: dark` (1.x had no dark defaults);
- a `\n` in a pie label, which rendered as a space in 1.x, now breaks the line. This also applies to the 1.x `PieChart` class.

The other additions are new options and a new layer.

## Out of scope

- Dark variants of the series colors (the accessible theme has them; the default palette stays 1.x).
- Other fits than a straight line (polynomial, moving average), and a trend line on polar charts.
- Line breaks in HTML axis labels (they wrap already) and in target line labels.
- Grouped stacks in the `barChart` preset (a preset draws one bar layer); they're a composed chart.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chart-composition`: the `offset` option of `bar()`, the `trendLine()` layer and the `labelAlign` axis option.
- `chart-theming`: label and grid defaults for a dark `color-scheme`, and the trend line styles.
- `chart-rendering`: line breaks in pie labels.

## Impact

- `packages/chartist`: `src/styles/` (dark defaults, trend line classes), `src/layers/bar.ts`, a new `src/layers/trendLine.ts` with its role in `src/scene/roles.ts`, `src/core/types.ts` and `src/layers/axes.ts` / `src/presets/preset.ts` (`labelAlign`), `src/layers/pie.ts`; export lists, type tests, size budgets.
- `apps/docs`: the guides (styling, bar charts, line charts or composed charts, axes and scales, pie and donut), a gallery example for grouped stacks and one for a trend line, with visual baselines.
- `packages/terminal`: nothing to change; it draws `line` nodes and `tspan` lines already. Checked by its tests.
