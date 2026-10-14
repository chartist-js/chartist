# Library findings from writing the docs

The writers checked every claim against the source and tests, and rendered charts where reading the code wasn't enough. These are the gaps and bugs they found. The docs describe today's behavior and work around them; none is fixed in this change.

## Bugs

1. **Preset data updates are lost on a breakpoint change.** After `lineChart(...).update({ data })`, crossing a responsive breakpoint redraws with the original data: `createPreset`'s `onResponsiveChange` rebuilds from the preset's stored data, which `handle.update` never touches (`src/presets/preset.ts`). Plugins reading `config.preset` (compat) see stale data too. Found by two writers independently.
2. **`stackMode: 'accumulate-relative'` cuts off negative stacks.** The value axis is fitted to each stack's net sum (`presets/barChart.ts` `valueAxis` → `getSerialSums`), so stacks below zero are clamped. `[[5, 5], [-3, 2]]` gives an axis of 0..7 and a zero-height −3 bar. Same in 1.x. The bar page tells readers to set `low`.
3. **`--ct-donut-width` has no effect on `pieChart` donuts.** The pie layer writes `style="stroke-width: Npx"` on every donut slice (`layers/pie.ts`), which beats the stylesheet's custom property. Either stop writing it when `donutWidth` isn't set, or drop the property from the stylesheet. The styling page now points to `donutWidth`.
4. **`stepAxis()` in `chart()` ignores `data.labels`.** Without `ticks` it gets `ticks: []`, so the step spans the whole axis. Only the presets pass the labels. A default from the labels would be friendlier.
5. **In `barChart`, `axisY.low` is overridden by the preset's `referenceValue: 0`** (`getHighLow` applies the reference value after the axis low). Only the top-level `low`/`high` win. Same in 1.x.

## Types and doc comments

6. **The presets' `plugins` type** (`core/types.ts`, inherited from 1.x) accepts plain functions, which throw at runtime, and rejects `[plugin, options]` pairs, which work at runtime. _Resolved by `refine-typings`._
7. **The line chart's `series` option type** allows every `LineChartOptions` key, but only `lineSmooth`, `showLine`, `showPoint`, `showArea` and `areaBase` are read (`LineSeriesOptions`). Narrow it. _Resolved by `refine-typings`._
8. **`stackMode` doc comment** in `layers/bar.ts` says "`overlap` / `false`": `false` stacks like `accumulate`, only `true` overlaps, and `'overlap'` isn't in the preset's type. _Resolved by `refine-typings`._
9. **`lineSmooth` default** is documented as cardinal (`LineChart.types.ts`, `interpolation/cardinal.ts`); the code uses `monotoneCubic()`. _Resolved by `add-api-reference`._
10. **Interpolation doc comments** still use `new LineChart`, `Chartist.Line` and `Chartist.Smoothing.*`. _Resolved by `add-api-reference`._

## Gaps

11. **No options update on preset handles.** `update()` takes a partial `chart()` config; options like `showArea` or `stackBars` are baked into the layers, so changing them means destroy and recreate.
12. **A listener added with `handle.on()` misses the first render**, which is synchronous. With compat, the workaround is `fromLegacyPlugin(chart => chart.on('draw', …))`.
13. **`toScene()` doesn't take presets.** There's no preset-to-config function, so server rendering needs the `chart()` building blocks.
14. **`domRenderer` and `estimateText` aren't exported**, so a custom renderer can't wrap the DOM renderer and server code can't reuse the text estimate.
15. **`chart()` without `className` gives the SVG no `ct-chart-*` class**, so chart-type CSS (label alignment, for one) doesn't apply. Examples set it by hand.
16. **No tests cover the bar stack modes.**

## Minor

17. `fixedScaleAxis` with `divisor` never puts a tick at `high` (same as 1.x).
18. `simple()` and `step()` interpolations test holes with `value !== undefined`, `none()` with `getMultiValue`; same result today, inconsistent.
19. The size probe's style is `width: 300;` for numeric sizes (invalid CSS; the attribute saves it).
20. The functional API is still tagged `@experimental` in `src/index.ts`; the docs don't say so. Decide before the release.

## Not reproduced

- **`aspect-ratio` boxes growing with the measuring probe.** The plugin demo on the landing page showed it, but a plain page (block, flex, grid, resize) didn't reproduce it. The likely trigger is redrawing into a box that still holds the previous SVG. The sizing page says such a box "can grow" and recommends `min-height: 0`; pin down the trigger before documenting it more strongly.
