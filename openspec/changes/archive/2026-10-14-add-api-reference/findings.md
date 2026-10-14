# Findings

Library behavior noticed while writing the doc comments (the comments describe the current behavior). For `fix-library-findings`.

## From chart(), layers and scales

1. **`bar({ stackBars: true })` in `chart()` clips stacks.** The value axis is scaled to the single values, not the stacked sums: only the `barChart` preset uses `getSerialSums` (`presets/barChart.ts`). The `stackBars` comment advises setting `high`. _Issue #1483._
2. **`cartesianAxes({ x, y })` defaults differ from the list form.** Offsets default to 0, and a Y axis without `position: 'start'` sits on the right (`scales/axis.ts`, `definitionsOf`, `axisArea`); the list form defaults to 30/40 px. Documented on `cartesianAxes` and `AxesConfig`; the examples use the list form. _Issue #1484._
3. **`fixedScaleAxis` with `divisor` puts no tick at `high`** (`scales/factories.ts`). Same as 1.x and documented, so maybe not a bug. _Issue #1022._
4. **Pie labels:** with `donut: true`, `labelPosition` is ignored and labels sit on the ring (`layers/pie.ts`, `labelRadius`). `preventOverlappingLabelOffset` measures `String(labels[index]).length`, which is `"undefined".length` without labels. _Issues #478 (reopened) and #1485._
5. **`ChartHandle.off(name)` without a listener also removes plugins' listeners** for that event (`pipeline/emitter.ts`). Documented. _Issue #1486._
6. **`axisLabels({ align })` applies to every axis of the layer**, so X and Y can't be aligned separately. Documented. _Issue #1487._

## From the scene, events, rendering and responsive options

7. **`domRenderer().measureText` uses the global `document`**, not the container's `ownerDocument` (`render/dom.ts`), so charts in another document (an iframe) measure text in the wrong one. `render()` uses `container.ownerDocument`. _Issue #1424._
8. **`ResponsiveSet.watch` returns `ResponsiveWatcher`, which isn't exported** (`responsive/responsive.ts`): the reference shows a type it can't link. _Issue #1488._
9. **A `'*'` listener sees `null` for a dropped `compose` node** (`pipeline/emitter.ts`, `transform`). Harmless (typed `unknown`), but surprising. _No issue: harmless._
10. **With `compat`, `chart()` only gets the `data` events:** `draw` and `created` are emitted only for preset charts (`emitDrawEvents` needs `state.preset`). Described in the `compat` comment; the migration guide already says compat covers line, bar and pie charts. _No issue: by design._
11. **`animationBegin` and `animationEnd`** are emitted by `svg/animation.ts` only when `animate()` gets an event emitter; there's no v2 way to pass the chart's. Check whether compat should wire it or the events should be documented as 1.x-only. _Issue #1489._

## From the data, SVG and 1.x exports

12. **`Svg.remove()` returns `null`:** it returns `this.parent()` after removing the node (`svg/Svg.ts`). The comment says so. _Issue #1490._
13. **`SvgPath`:** `splitByCommand()` creates `new SvgPath()`, so the pieces lose `close` and `accuracy`; `SvgPath.join()` shares command objects with the source paths instead of copying; `stringify()` treats `accuracy: 0` as "don't round" rather than "round to integers"; `parse()` handles M/L/C/A only and throws on H/V/Q/S/T (`svg/SvgPath.ts`). _Issue #1491._
14. **Holes differ between interpolations:** `simple` and `step` test `value !== undefined`, while `none`, `cardinal` and `monotoneCubic` use `getMultiValue()`, so `{ x, y: undefined }` is a hole for some and not others. Low confidence it matters. _Issue #633 (reopened)._
15. **`AnchorPosition`** in `charts/PieChart/PieChart.types.ts` is unused, and declared again in `layers/pie.ts`. _No issue: a cleanup._
16. **`{@link}` doesn't resolve across entry points:** a comment in `chartist` can't link to `chartist/compat`'s exports (TypeDoc), so `Plugin` names `fromLegacyPlugin()` in backticks. _No issue: a TypeDoc limitation._

## Found in the issue tracker (2026-10-14)

Open bug reports that are still in the v2 code, labeled `v2`:

17. **#1469:** with `accumulate-relative`, `Number(valueY) >= 0 || Number(valueX) >= 0` (`layers/bar.ts`) puts negative values into the positive stack. Fix with #1473.
18. **#1471:** an axis label's space is computed only if `projectedValues[index + 1]` is truthy (`axes/Axis.ts`), so a next tick at 0 is skipped.
19. **#1470:** `roundWithPrecision(value, 0)` rounds with the global precision, since `digits || globalPrecision` ignores 0 (`core/math.ts`).
20. **#876:** `instanceof Array` (`utils/extend.ts`) fails for arrays from another frame.

The `v2` label also marks 35 open issues v2 likely fixes already (composed charts, several axes, server rendering, SVG export, `viewBox`, dark mode, container sizing, ES modules, series class names, event docs). Check and close them at the release.
