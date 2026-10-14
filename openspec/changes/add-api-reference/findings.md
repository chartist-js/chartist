# Findings

Library behavior noticed while writing the doc comments (the comments describe the current behavior). For `fix-library-findings`.

## From chart(), layers and scales

1. **`bar({ stackBars: true })` in `chart()` clips stacks.** The value axis is scaled to the single values, not the stacked sums: only the `barChart` preset uses `getSerialSums` (`presets/barChart.ts`). The `stackBars` comment advises setting `high`.
2. **`cartesianAxes({ x, y })` defaults differ from the list form.** Offsets default to 0, and a Y axis without `position: 'start'` sits on the right (`scales/axis.ts`, `definitionsOf`, `axisArea`); the list form defaults to 30/40 px. Documented on `cartesianAxes` and `AxesConfig`; the examples use the list form.
3. **`fixedScaleAxis` with `divisor` puts no tick at `high`** (`scales/factories.ts`). Same as 1.x and documented, so maybe not a bug.
4. **Pie labels:** with `donut: true`, `labelPosition` is ignored and labels sit on the ring (`layers/pie.ts`, `labelRadius`). `preventOverlappingLabelOffset` measures `String(labels[index]).length`, which is `"undefined".length` without labels.
5. **`ChartHandle.off(name)` without a listener also removes plugins' listeners** for that event (`pipeline/emitter.ts`). Documented.
6. **`axisLabels({ align })` applies to every axis of the layer**, so X and Y can't be aligned separately. Documented.

## From the scene, events, rendering and responsive options

7. **`domRenderer().measureText` uses the global `document`**, not the container's `ownerDocument` (`render/dom.ts`), so charts in another document (an iframe) measure text in the wrong one. `render()` uses `container.ownerDocument`.
8. **`ResponsiveSet.watch` returns `ResponsiveWatcher`, which isn't exported** (`responsive/responsive.ts`): the reference shows a type it can't link.
9. **A `'*'` listener sees `null` for a dropped `compose` node** (`pipeline/emitter.ts`, `transform`). Harmless (typed `unknown`), but surprising.
10. **With `compat`, `chart()` only gets the `data` events:** `draw` and `created` are emitted only for preset charts (`emitDrawEvents` needs `state.preset`). Described in the `compat` comment; the migration guide already says compat covers line, bar and pie charts.
11. **`animationBegin` and `animationEnd`** are emitted by `svg/animation.ts` only when `animate()` gets an event emitter; there's no v2 way to pass the chart's. Check whether compat should wire it or the events should be documented as 1.x-only.
