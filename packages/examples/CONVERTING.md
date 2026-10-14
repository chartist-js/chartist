# Converting an example to the functional API

Every example from 1.x gets two entries: `src/main.ts` with the functional API (what the docs show), and `src/main.classic.ts` with the original 1.x code. Both must draw **the same pixels**: the visual tests screenshot both against one baseline image, recorded from Chartist 1.5.0 with the classic code. A conversion that passes proves that `lineChart()` draws what `new LineChart()` drew.

References: `line/simple` (a plain conversion) and `line/modify-drawing` (1.x `draw` events become a v2 plugin).

## Steps, per example

1. Copy the 1.x code: `cp <folder>/src/main.ts <folder>/src/main.classic.ts`. Never edit the classic file afterwards (comments included); it's the 1.x original.
2. Rewrite `<folder>/src/main.ts` with the functional API (below). Keep the data, options, comments that explain the chart, and the formatting style.
3. In `index.ts`, set `classic: true` on the entry, and add a `description`: one sentence for the gallery card and the example's page, saying what the chart shows (not "This example shows…"). Keep `compat` as it is: it describes the classic entry.
4. Check (from the repository root):
   - `pnpm nx run-many -t check typecheck -p examples`
   - `pnpm nx run chartist:test:visual:local -- -g "<id>"`: both entries against the baseline. If your machine's font rendering differs from the reference platform (the committed baseline then fails even for untouched examples), record a local baseline from 1.5.0 first: `pnpm nx run chartist:test:visual:local-baseline`. Never update the committed `__screenshots__`.
5. One commit per type of chart is fine; the copy and the rewrite go in the same commit. `main.ts` keeps its path, so its history continues, and git detects `main.classic.ts` as a copy (`git log --follow -C`).

## API mapping

| 1.x                                                          | v2                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `new LineChart(target, data, options, responsiveOptions)`    | `lineChart(target, data, options, responsiveOptions)`                                                                                                                                                                                                                                                                                |
| `new BarChart(…)`, `new PieChart(…)`                         | `barChart(…)`, `pieChart(…)`                                                                                                                                                                                                                                                                                                         |
| `axisX: { type: AutoScaleAxis }` (a class)                   | `axisX: { type: autoScaleAxis() }` (a factory call); likewise `fixedScaleAxis()`, `stepAxis()`. Options that were on the axis object (`ticks`, `divisor`, `low`, `high`, `onlyInteger`) stay where they were                                                                                                                         |
| `Interpolation.step(…)` and friends                          | unchanged: `import { Interpolation } from 'chartist'`                                                                                                                                                                                                                                                                                |
| `ResponsiveOptions<…>` type                                  | the preset's options type, or leave the array untyped                                                                                                                                                                                                                                                                                |
| `chart.update(data)` after a timer                           | `handle.update({ data })` on the returned handle; `handle.update({})` to just redraw                                                                                                                                                                                                                                                 |
| `chart.on('created', …)`                                     | `chart.on('mount', …)` in a plugin, or on the handle (but a listener added on the handle after the call misses the first render; use a plugin)                                                                                                                                                                                       |
| `chart.on('draw', data => …)` changing an element            | a plugin with `chart.on('compose', node => …)`: return a node to replace it, `null` to drop it, `undefined` to keep it. Nodes have `role` (`point`, `line`, `area`, `bar`, `slice`, `label`, `grid`, …), `attrs`, and `ctx` (`x`, `y`, `value`, `valueIndex`, `seriesIndex`, …). Build new nodes with `node(name, attrs, className)` |
| `chart.on('draw', data => data.element.animate({…}))` (SMIL) | a plugin with `chart.on('mount', ({ scene, elementOf }) => …)`: find nodes with `findAll(scene, { role: 'bar' })`, then `new Svg(elementOf(node)).animate({…})` with the same animation definitions. See `apps/docs/src/examples/animations/smil/`                                                                                   |
| `getMultiValue`, `noop`                                      | still exported; keep using them                                                                                                                                                                                                                                                                                                      |
| `plugins: [compat]`                                          | gone in `main.ts`: the functional entry uses v2 plugins only                                                                                                                                                                                                                                                                         |

Find the v2 details in the library source (`packages/chartist/src`: `presets/`, `layers/`, `scene/`, `chart/`) and in the docs pages (`apps/docs/src/content/docs/events-and-plugins.mdx`, `animations.mdx`, `axes-and-scales.mdx`). The source is the truth.

## Style in CSS, not in JavaScript

1.x examples often set styles from a `draw` event (`stroke-width`, `style="fill-opacity: …"`), because 1.x had no custom properties. The functional entry teaches v2: when JavaScript only styles an element, use the custom properties (`--ct-bar-width`, `--ct-color`, …) or a class and a rule in `src/style.css` instead. Keep JavaScript for what CSS can't do: replacing or adding elements, SMIL. Examples: `bar/stacked` (bar width) and `line/modify-drawing` (the triangle's color).

## When the pixels differ

1. First suspect the conversion: an option in the wrong place, a different default, a node replaced at a different position, an animation keyed differently, attributes in a different order that change rendering.
2. If the difference comes from a deliberate v2 behavior (documented in the plan or a spec), and only then, set `ownBaseline: '<why>'` on the entry, record the functional entry's image from the local build (`<name>--v2--<viewport>.png` next to the shared one), and list it in your report.
3. If it comes from a library bug or gap, don't patch the library and don't work around it in a way a user wouldn't write: leave that example unconverted (no classic file), and report it. Library fixes are their own work, tracked as GitHub issues labeled `v2`.
