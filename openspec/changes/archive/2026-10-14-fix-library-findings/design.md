# Design

## Context

- Issues and findings: `openspec/changes/archive/2026-10-14-add-docs-content/findings.md`, `…-add-api-reference/findings.md` (with issue numbers), GitHub label `v2`.
- The visual tests compare every example's functional and classic entries with one baseline recorded from 1.5.0 (`packages/chartist/test/visual`); `ownBaseline` in the examples manifest gives an example a baseline of its own. In this container the committed baseline differs by font rendering, so `test:visual:local` (a local 1.5.0 baseline) is the check here.
- Preset handles are plain `ChartHandle`s from `createPreset` (`presets/preset.ts`), which keeps a `PresetController` with `setData`, `setOptions` and `render` internally. `ChartHandle.update()` takes a partial `chart()` config.
- The emitter (`pipeline/emitter.ts`) has one listener list per event; plugins, config `on` listeners and handle listeners share it.

## Decisions

### D1: 1.x-shared fixes change both APIs, with reviewed baselines

The fixes of #1476, #1022 and #1470 live in shared code, so the 1.x classes change with the functions. Examples whose screenshots change because of a fix get an `ownBaseline` (the reason names the issue), recorded from the local build and reviewed image by image in its own commit; every other example keeps proving parity with 1.5.0. "Coming from 1.x" lists each change under "What changed".

### D2: Preset handles change options with `setOptions`

`lineChart`, `barChart` and `pieChart` return a `PresetHandle<TOptions>`: a `ChartHandle` plus `setOptions(options, override?)`. It extends the current options (with `override`, the defaults, as 1.x `update(data, options, true)`), rebuilds the layers and redraws; responsive options still apply on top. `update({ data })` on a preset handle updates the preset's data as well (#1472), so responsive redraws and compat see it. Alternatives: an `options` key on `update()` (mixes two config shapes in one call), or 1.x's positional `update(data, options, override)` (conflicts with the v2 handle's `update(config)`).

### D3: An `on` option for the presets

The presets' options accept `on`, the same phase listener map as `chart()`'s config, registered before the first render (#1478). The 1.x classes don't get it (they render later anyway).

### D4: `off(name)` removes only your listeners

The emitter records who added a listener: plugins (through `install`), or you (config `on`, handle `on`). `off(name)` without a listener removes yours; with a listener, that one, whoever added it. Plugins remove their own with the listener reference.

### D5: Defaults that would be breaking later

- `cartesianAxes({ x, y })` uses the list form's defaults: X offset 30, Y offset 40, Y on the left unless `position: 'end'` (#1484). Only tests use the object form today.
- `stepAxis()` without `ticks` uses `data.labels` (#1475).
- `chart()` without `className` gets `ct-chart-bar` if any layer is a bar layer, else `ct-chart-pie` (or `ct-chart-donut`) for pie layers, else `ct-chart-line`; a given `className` replaces it, as today (#1481). Bar first, because its label alignment is what composed charts with bars need.

### D6: Stacks fit their axis

- Layers may report the value extent they need per axis (a new optional `Layer` member, `extent(context)`, returning `{ [axisId]: { low, high } }`); axes merge it with the data's range. The bar layer reports its stacked sums with `stackBars` (#1483), and the `barChart` preset uses the same path instead of its own `getSerialSums` axis.
- `accumulate-relative` sums positives and negatives apart: the extent spans the lowest negative and the highest positive stack (#1473), and a value goes into the negative stack when its value along the value axis is negative (#1469, `layers/bar.ts`).
- Tests cover every stack mode (`accumulate`, `accumulate-relative`, `overlap`, `true`), horizontal and vertical.

### D7: CSS decides the donut width

The pie layer writes `stroke-width` only when `donutWidth` is given (#1474); the default stylesheet's `--ct-donut-width` default matches 1.x's 60 px, so default donuts look the same (checked by the visual tests).

### D8: Animation events with compat

In 1.x these fired only if you passed the chart's emitter to `animate()`, which users couldn't reach. With compat, the `element` of a `draw` event (and its descendants) animates with the chart's emitter by default, so `data.element.animate(…)` emits `animationBegin` and `animationEnd` on the chart (#1489).

### D9: The smaller fixes

- #1476: `getHighLow` applies the reference value only where the axis has no explicit `low`/`high`.
- #1022: `fixedScaleAxis` with `divisor` makes `divisor + 1` ticks, `high` included.
- #1470: `roundWithPrecision(value, 0)` rounds to integers (`digits ?? globalPrecision`).
- #1482: numeric sizes get `px` in the probe's style.
- #1480, #1488: export `domRenderer`, `estimateText`, `ResponsiveWatcher`; the export lists are updated.
- #1490: `Svg#remove()` returns the parent it had.
- #1424: `measureText` uses the container's `ownerDocument`.
- #1485, #478: donut labels honor `labelPosition`; the overlap offset measures the labels' drawn text.

### D10: Work split

After this design is approved, three agents in parallel worktrees, by area (no shared files):

1. Stacking and axes: D5 (axes, ticks), D6, #1476, #1022, #1470.
2. Presets, handles and events: D2, D3, D4, D5 (class), D8.
3. Pie, SVG, rendering and exports: D7, #1485, #478, #1490, #1424, #1482, #1480, #1488, the two breakpoint screenshots.

I integrate, record the own baselines in one reviewed commit, update the docs, and run the full gate.

## Risks / Trade-offs

- **1.x parity:** some 1.x charts draw differently. Accepted for a major version; listed in the migration guide, and the own baselines keep each change visible.
- **New API surface** (`setOptions`, `on` in preset options, `Layer.extent`): part of the experimental v2 API, with type tests.
- **`off(name)` change:** anyone relying on removing plugin listeners loses that; it wasn't documented and broke plugins.

## Open Questions

- None blocking.
