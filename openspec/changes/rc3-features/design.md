## Context

- Label and grid colors come from `$ct-text-color` (`rgba(0, 0, 0, 0.4)`) and `$ct-grid-color` (`rgba(0, 0, 0, 0.2)`) as fallbacks of `--ct-label-color` and `--ct-grid-color` (`styles/index.scss`, `ct-chart-label`, `ct-chart-grid`). The accessible theme already uses `light-dark()` for its series colors (`styles/themes/accessible.scss`).
- `bar()` places each bar at the label's position plus `biPol * seriesBarDistance`, or the period middle for distributed and stacked bars (`layers/bar.ts`).
- SVG axis labels are laid out by `svgLabels(measureText, kind, align)`; `axisLabels()` passes its `align` for all its axes, the presets none (`layers/axes.ts`, `presets/preset.ts`).
- Pie labels are one SVG `text` with `dx`/`dy` at the anchor (`layers/pie.ts`). SVG axis labels already wrap into `tspan`s, and the terminal draws `tspan` lines (`packages/terminal/src/draw.ts`).

## Goals / Non-Goals

**Goals:** five small additions in the style of the target line and band work: classes and custom properties for looks, no change for existing output.

**Non-Goals:** see the proposal's out of scope.

## Decisions

### Dark defaults (#1463)

```scss
.ct-label {
  fill: var(--ct-label-color, rgba(0, 0, 0, 0.4));
}
@supports (color: light-dark(#000, #fff)) {
  .ct-label {
    fill: var(
      --ct-label-color,
      light-dark(rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.6))
    );
  }
}
```

- **`light-dark()` keyed on `color-scheme`, not `prefers-color-scheme`.** The media query follows the OS, so a light page viewed with a dark OS setting would get white labels on white. `color-scheme` is what a page declares about itself; `light-dark()` follows it, and so does the accessible theme.
- **Inside `@supports`.** A `var()` with an unsupported fallback isn't dropped at parse time: it computes to `unset` and the labels turn black. The first declaration stays for browsers without `light-dark()`.
- **Sass:** `$ct-text-color-dark: rgba(255, 255, 255, 0.6)` and `$ct-grid-color-dark: rgba(255, 255, 255, 0.2)`; `false` leaves out the `@supports` block. Values tuned on screenshots of a dark page.
- The visual baselines are light, so they don't change; a new test renders a chart under `color-scheme: dark` and checks the computed label color.

### `offset` on `bar()` (#262)

- Added to the bar's position along the label axis after the existing placement, for every mode (grouped, stacked, distributed). Positive moves right (vertical bars) or down (horizontal bars, as screen coordinates grow downward). It's px, like `seriesBarDistance`.
- _Alternative:_ a group option that lays several stacks out automatically. Rejected: two layers with offsets is the composed-chart way and needs no new concept.

### `trendLine()` (#1209)

```ts
trendLine({ series: ['sales'], x: 'month', y: 'eur', align: 'center' });
```

- **Fit:** ordinary least squares over the series' non-hole values, X as the value index on a step axis, else `value.x`. Slope `Σ(x - x̄)(y - ȳ) / Σ(x - x̄)²`; a series whose X values are all equal (or with fewer than two values) gets no line.
- **Drawing:** one `line` from the smallest to the largest X, projected like the line layer (`centerShift` for `align: 'center'`), inside `g.ct-series ct-series-<letter>` (the series' own `className` replaces the letter, as in the line layer), so `--ct-color` reaches it.
- **Extent:** the fitted values at both ends, on the layer's Y axis, since they can lie outside the values (`[0, 0, 10]` fits to `-1.67` at the start).
- **Role and context:** `trendLine` with `{ seriesIndex, slope, intercept, x1, y1, x2, y2 }`, declared in `NodeRoles`.
- **Styles:** `.ct-trend-line { fill: none; stroke: var(--ct-color); stroke-width: var(--ct-trend-line-width, 2px); stroke-dasharray: var(--ct-trend-line-dasharray, 6px 4px); }`, and the class joins `ct-chart-series-color`.
- Name `trendLine` next to `targetLine`; both are reference lines over the data.

### `labelAlign` per axis (#1487)

- **On the axis, not a map on the layer.** The issue suggests `axisLabels({ align: { x, y } })`, but a chart can have several axes per direction, and a map by direction can't tell them apart. `labelAlign` on `AxisOptions` reaches every axis by itself: the presets' `axisX`/`axisY` and `cartesianAxes()` axes. `axisLabels()` keeps `align` as the default for its axes.
- The axis layer passes `{ ...layerAlign, ...axis.labelAlign }` to `svgLabels` per axis; the presets' label layer does the same with no layer default.

### Line breaks in pie labels (#546)

- The label's text is split at `\n`. One line: unchanged `text`. Several: `text` holds one `tspan` per line with `x` at the anchor and `dy` of one line height (`1.2em`), the first `tspan` moved up by half the block (`dy: -(n - 1) * 0.6em`), so the block stays centered as the one-line label is.
- Applies to presets, `pie()` and the 1.x `PieChart` class alike, so the 1.x output changes only for labels with `\n`, which rendered as a space before.

## Risks / Trade-offs

- [`light-dark()` support] → Baseline since 2024; older browsers keep the 1.x colors through the declaration outside `@supports`.
- [Size] → A new layer and the CSS block; the budgets are raised on purpose if needed, with the reason in the commit.

## Migration Plan

Nothing to migrate. At archive time, record in `docs/decisions.md`: dark defaults follow `color-scheme`; trend lines are a core layer.
