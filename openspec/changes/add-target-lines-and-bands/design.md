# Design

## Context

- **The layer contract** (`pipeline/types.ts`): a layer has a `type`, its `coordinates`, optional bound `axes` (`{ x, y }` ids, default the first of each), an optional `series` selection, an optional `extent`, and `compose(context)` returning scene nodes. `compose` gets the bound X and Y axes, and every placed axis in `axes.all`.
- **Axis binding** (`scales/cartesian.ts`): a layer's series shape the range of the axes it's bound to. A layer whose selection is empty (`series: []`, the grid and label layers) shapes no range. `extent` widens an axis by id on top of that.
- **The line layer** (`layers/line.ts`) projects values to `pathCoordinates`, runs them through the interpolation (`monotoneCubic()` or `none()`, or a function), splits the path at holes (`splitByCommand('M')`) and closes each segment down to `areaBase` for the area.
- **Presets** (`presets/lineChart.ts`, `barChart.ts`, `pieChart.ts`) build a `ChartConfig` with a fixed `layers` list: `gridLayer`, the series layer wrapped by `seriesGroup`, `labelLayer`. Pie has no grid or labels.
- **Styles** (`styles/index.scss`): `ct-chart-series-color` sets `--ct-color` on `.ct-series-<letter>` and colors the known element classes from it.
- **Terminal** (`packages/terminal/src/draw.ts`) draws by role, and falls back to the element name for unknown roles (`line` and `path` stroked, `text` as a label).
- **The plugin list** (`apps/docs/src/data/plugins.ts`) and its satellites: `plugin-files.json`, `facts.json`, `src/examples/plugins/targetline/`, the contract case in `e2e/plugin-contract.spec.ts`, and the `chartist-plugin-targetline` dependency in `apps/docs/package.json`. `/plugins/chartist-plugin-targetline/` returns 200 on chartist.dev today.

## Goals / Non-Goals

**Goals:**

- Both layers are ordinary layers: nothing a custom layer couldn't do. They tree-shake like the others. The one pipeline change, layer refinement, is part of the public layer contract, not a private path for built-in layers.
- Everything visual is a class and a custom property. No color, width or opacity options.
- The band reuses the line layer's projection, interpolation and hole splitting instead of copying them.

**Non-Goals:**

- A general "annotations" API (arrows, text boxes, points of interest).
- Labels on bands. A band that needs one can sit next to a target line with a label, or get a text node from a `compose` listener.

## Decisions

### `targetLine()` options

```ts
targetLine({ value: 1000, label: 'Target' });
targetLine({
  axis: 'eur',
  lines: [
    { value: 800, label: 'Min' },
    { value: 1000, label: 'Goal', className: 'ct-series-b' }
  ],
  labelPosition: 'start'
});
```

- **One line or `lines`.** `TargetLineOptions` is the shared options (`axis`, `labelPosition`, `classNames`) plus either one line's fields (`value`, `label`, `className`) or `lines: readonly TargetLineSpec[]`. The one-line form covers the common case without an array. A union of both shapes is checked by TypeScript, and giving both throws.
  - _Alternative:_ `values: [800, 1000]` and `labels: [...]` side by side. Rejected: parallel arrays drift apart, and a class per line has no place.
- **`axis` is an id, not `x`/`y`.** A target line sits on one axis, and its dimension follows from that axis: horizontal on a Y axis, vertical on an X axis. Default: the first Y axis. The layer finds the axis in `axes.all` and throws for an unknown id, with the message the binding uses (`unknown axis "<id>" in layer "targetLine"`).
- **`series: []`.** The layer draws no series, so it mustn't shape any axis's range from the data. It reports its values through `extent`, keyed by its axis id (`axes.y` from the extent context when `axis` is left out). Extents are merged by axis id whatever the layer's binding (`layerExtents` in `scales/cartesian.ts`), so an id outside the binding works. An axis's own `low` and `high` still win, so a line outside them is skipped rather than drawn outside the area.
- **Labels are SVG `text`, always.** Like pie labels, they don't take part in the axis label mode. They sit just above a horizontal line (or right of a vertical one), inside the chart area: at the end by default (`text-anchor: end`), or the start. The line's value isn't written as a label automatically. `label` is the text, and a number-formatting function stays in user code.
  - _Alternative:_ follow the chart's `labels` mode (HTML in `foreignObject`). Rejected: a single short label doesn't need wrapping, and SVG text works in server rendering and the terminal without a measure step.
- **Markup:** `g.ct-target-lines` > per line `line.ct-target-line` and `text.ct-target-label`, with the line's `className` on both. Roles `targetLine` and `targetLabel`. Contexts: `{ axis, value, index, label, x1, y1, x2, y2 }` and `{ axis, value, index, text, x, y }`.

### `band()` options

```ts
band({ series: ['a', 'b', 'c'] }); // min to max of a group
band({ low: 'p10', high: 'p90' }); // two series
band({ low: 40, high: 60 }); // constant
band({ low: 0, high: 'forecast', align: 'center', lineSmooth: false });
band({ low: 40, high: 60, mark: true }); // ct-in-band / ct-out-band on points and bars
```

- **Edges as `low`/`high` or a group as `series`.** `low` and `high` each take a number or a series selector (a name or an index). `series` and `low`/`high` are exclusive, and a band without one of them throws. Reusing the layers' `series` option for the group keeps the meaning "these are my series", and the axis binding then counts them towards the range without extra code.
- **The layer's `series` selection:** the group, or the series edges (`[low]`, `[high]` or both). With only constant edges, it's `[]` and the band widens its Y axis through `extent`.
- **Shared path code.** The projection-and-interpolation part of `line.ts` moves into a small internal helper (`layers/path.ts`): it projects a series' values and returns the interpolated path. The line layer and the band both use it. The band builds the upper edge path, then the lower edge path, splits both at holes, and closes each segment that both edges have into one polygon: the upper edge forward, the lower edge backward.
  - **Tracing the lower edge backward** needs a reversed path. `SvgPath` has no `reverse()` today. For straight edges it's reversing the points. For a cubic interpolation, the reversed curve is the same curve with each segment's control points swapped, so the helper reverses the path elements and swaps `x1/y1` with `x2/y2`. If this turns out messier than it sounds, the fallback is to interpolate the reversed coordinates, which gives the same shape for `none()` and `monotoneCubic()`, both of which are direction-independent.
- **Group min/max** is computed per value index over the group's values that aren't holes. At an index where none has a value, both edges get a hole there and the band breaks. For `{ x, y }` values, the X of the first defined value at that index is used. The docs say a group should share its X positions.
- **Defaults follow the line layer:** `lineSmooth: true`, `align: 'start'`. A band under smooth lines then has matching edges.
- **Markup:** `g.ct-band` (with `className` if given) > `path.ct-band-area` per segment. Role `band`, context `{ low, high, series, path }`: `low` and `high` are the given edges (a number or the series index), `series` is the group's indexes, and `path` is a copy as for areas.
- **`mark: true`** defines the band's `refine` (see "Layer refinement"). For each `point` and `bar` node, it reads the value (`ctx.value`, `y` of an `{ x, y }` value, or `x` for horizontal bars, by the band's value dimension), works out the band's edges at `ctx.valueIndex` from the band's own compose context, and adds `ct-in-band` (between the edges, edges included) or `ct-out-band`. A node at an index where the band has a hole, or without a value, is left alone. The edges come from the data, not from the band's drawn path, so it doesn't matter whether the band is listed before or after the layers it marks.
  - **No default styles for the two classes.** What "out of band" should look like (a color, a larger point, a faded bar) is the page's choice. The guide shows one rule for each.
  - **Classes on whole nodes only.** Splitting a line where it crosses an edge is geometry, which `chartist-plugin-threshold` does and which stays out of scope.
- **The band isn't a series group.** It belongs to no single series (a group or constants), so it doesn't get `ct-series` or a series letter by default, and it doesn't count for `ct-chart-*` (`chartType` stays the line default). `className: 'ct-series-c'` gives it a series color.

### Layer refinement

A layer that changes what other layers draw (the band's `mark`) mixes two concerns:

- **Stack order**, which is draw order: the order of `layers`. The user owns it. A band is listed before the lines so it's drawn behind them.
- **Data dependency order:** the band can only mark points once the line layer has drawn them, even though the band is listed first.

**Decision: separate them by step, not by sorting.** Every layer composes independently, from the data and axes in its context, and never sees other layers' nodes. Then the refining layers see the finished nodes of all layers. List order stays the draw order, and a refiner can mark the nodes of layers listed after it.

- _Alternative: layers declare dependencies (`after: ['line']`) and the pipeline sorts them._ Rejected:
  - Compose order doesn't decide draw order (the scene is built from the composed nodes afterwards), so sorting would only change when code runs. That leaks into the order plugins see `compose` events in.
  - It's unclear what to depend on. Layer `type`s are strings, two line layers or a custom point layer don't fit, a missing dependency needs a rule, and cycles need detection and errors.
  - Layers don't depend on each other's data, only on each other's finished nodes, which a later step gives them.
  - If two refiners ever have to build on each other beyond list order, an `after` option can be added then without breaking anything.

**`refine` is a layer method, not a phase.** The phases (`resolve` to `mount`) are the events listeners hook into. `extent()` and `compose()` are layer methods the pipeline calls inside them: `extent()` while the axes are created after `layout`, and `compose()` in the `compose` phase. `refine()` joins them in the `compose` phase. It adds no phase and no event. Plugins already have the `compose` events for single nodes and the `scene` event for the whole tree, and no plugin needs to hook between refinement and the events.

**Signature: one node at a time, like a `compose` listener.**

```ts
refine?(node: SceneNode, context: LayerContext): SceneNode | undefined;
```

- It doesn't get the whole scene. The root `svg` doesn't exist yet (it comes from the `scene` phase), and a whole-tree rewrite would let a layer move, replace or re-key other layers' nodes. Plugins have the `scene` event for whole-tree work.
- A refiner can change a node but not drop it (`null` stays a plugin power), so a layer can't delete another layer's output. It goes through the existing node mapping (`mapNodes`), so keys and structure stay, and unchanged subtrees are reused.
- `context` is the refining layer's own compose context (its data, axes, area, index). It holds no state: layer values are reused across charts and responsive renders, so a refiner works from its arguments only.
- A refiner sees every node of every layer, one call per node, but only the node it's called with. Looking up further nodes during that call (the neighboring point, the line a point belongs to) would need a lookup in the context, such as `findAll` over the composed nodes. It can join the context later, and no layer needs it yet.

**Pipeline: compose all, then one walk.** Today `compose()` (in `pipeline/phases.ts`) composes a layer, keys its nodes and fires their `compose` events before the next layer composes. It becomes:

1. Every layer composes, and its nodes get their keys.
2. One walk over all composed nodes, layer by layer, children before parents. For each node with a role, the refiners run in list order, then the `compose` event fires on the result.

Order matters for the events: they still come layer by layer and children first, the same order as today. The difference is that every layer's `compose()` has run before the first event fires. That's only observable from a custom layer whose `compose()` has side effects that a listener reads, which the layer contract doesn't support.

**Cost.** `refine` is optional. With no refining layer, step 2 is the walk that fires the events today, so nothing is added. With refiners, each node costs a few extra function calls, in a walk that happens anyway. The band defines `refine` only with `mark: true`, so a plain band chart doesn't pay for it.

### Preset `layers: { below, above }`

- Each preset spec builds `[grid, ...below, series, ...above, labels]` (pie: `[...below, pie, ...above]`). `layers` is part of the preset options, so responsive entries merge it like any option, as a whole object.
- **Why two lists, not one:** a band belongs behind the data and a target line in front of it, and a single list would make one of them wrong. Letting the layer declare its own place (a band defaults to below) was considered. Rejected: it hides the order, and a custom layer would need the same concept.
- **Why not a function `(layers) => layers`:** it can do everything, but it also exposes the preset's internal layers (the wrapped series layer, the label layer's options) as a contract. Two lists keep the preset's own layers private.
- The type is shared: `PresetLayers { below?: readonly Layer[]; above?: readonly Layer[] }`, added to the three preset option types. It's not added to the 1.x class options.
- **Series still drawn by the preset:** a preset's series layer draws all series, so `band({ low: 'p10', high: 'p90' })` on `lineChart` also draws `p10` and `p90` as lines. Hide them with the per-series options (`series: { p10: { showLine: false, showPoint: false } }`). The guide shows this. Filtering them out automatically would change what the preset draws based on a layer's options, which is surprising.

### Styles

New Sass settings and classes in `_settings.scss` and `index.scss`, as for areas:

```scss
.ct-target-line {
  stroke: var(--ct-color, var(--ct-target-line-color, currentColor));
  stroke-width: var(--ct-target-line-width, 1px);
  stroke-dasharray: var(--ct-target-line-dasharray, 4px 4px);
}
.ct-target-label {
  fill: var(--ct-color, var(--ct-target-line-color, currentColor));
}
.ct-band-area {
  fill: var(--ct-color, var(--ct-band-color, currentColor));
  fill-opacity: var(--ct-band-opacity, 0.12);
}
```

- `currentColor` follows the chart's text color, so dark mode works where the text color does. `ct-chart-series-color` adds the three classes, so a `ct-series-<letter>` class on the line or band (or a series group around it) colors it. The exact defaults (dash, opacity) are tuned on screenshots in both themes.
- **`--ct-color` leaking in:** a target line inside a series group would pick up that series' color. The layers don't nest into series groups, so this only happens when a user puts one there, and then it's what they asked for.

### Terminal

- `band` is filled with `fillPolygons` and the area dot pattern, below the grid like areas.
- `targetLine` and `targetLabel` need no case: their elements (`line`, `text`) already fall back to a braille line and a label. A case is added only if the default color or the label placement looks wrong in the output.

### Docs

- **The guide** is `apps/docs/src/content/docs/target-lines-and-bands.mdx`, in the docs navigation after "Axes and scales". Its examples:
  1. A bar chart preset with `layers: { above: [targetLine(...)] }`.
  2. A band chart: monthly values, the range of ten made-up years as a band (`series` group), their average, and this year as a highlighted line. The data is synthetic, so no dataset license applies.
  3. A short section on constant bands (a target zone) and several target lines.
- **The gallery** gets `composed/target-line` and `composed/band-chart` (`docs: true`, no classic entry), each with a visual baseline. Baselines are recorded on the visual reference platform (the WSL host or CI), not in the dev container.
- **Composed charts page:** two rows in the layers table, and a pointer to the guide. Line and bar chart pages get one sentence and a link for `layers`.
- **Removing the plugin:** the entry, its example folder, its `plugin-files.json` and `facts.json` entries, its contract case and its docs dependency go. The facts script reads its plugins from `plugin-files.json`, so the next `docs:facts` run drops the entry from `facts.json`. Removing it there by hand gives the same result without a network run.
- **Redirect:** Astro's `redirects` config (`'/plugins/chartist-plugin-targetline/': '/docs/target-lines-and-bands/'`), which writes a static meta-refresh page in `output: 'static'`. It must respect `base` and stay out of the sitemap and search, like the v1 redirects. If Astro's redirect pages don't meet that, a small entry in the existing redirect integration does. The old anchor `/plugins/#targetline` falls back to the overview, as for any unknown anchor.
- **Terminal plugin guide:** `terminal/target-line` becomes a chart with `targetLine(1000)` from the core, and its plugin (in `src/`) circles the points above the target. That's the part of today's example that teaches something about plugins.

## Risks / Trade-offs

- [Reversing cubic paths is subtle] → Unit tests compare the band's edges with the line layer's path for the same series, for `none()`, `simple()`, `monotoneCubic()`, `cardinal()` and `step()`. The fallback (re-interpolating reversed coordinates) is noted above.
- [Composing all layers before the first `compose` event changes when events fire] → The order of the events is unchanged, and a test pins it: layer by layer, children first. Only side effects of a layer's `compose()` could notice the change, and the contract doesn't support those.
- [Refiners as a new extension point invite misuse] → A refiner can't drop nodes or change the structure, and gets no shared state. Anything beyond classes and attributes on single nodes stays plugin work.
- [Experimental API naming] → `targetLine` and `band` are marked `@experimental` like the other layers, so names can change before 2.0.
- [Removing a listed plugin breaks someone's bookmark] → The redirect covers the page URL. The plugin itself stays on npm and keeps working with `fromLegacyPlugin`.
- [Preset `layers` and responsive merging] → Overrides merge shallowly, so a responsive entry replaces the whole `layers` object. That matches how other object options merge, and the docs say so.

## Migration Plan

Nothing to migrate: additive API and docs. Users of `chartist-plugin-targetline` can switch to `targetLine()` and get labels and server rendering. The guide has a short "Coming from the plugin" note: `{ value }` maps to `targetLine({ value })` in `layers.above`, and the line keeps the class `ct-target-line`, so the plugin's CSS keeps applying.

When the change is archived, record in `docs/decisions.md`: reference lines and bands are core layers; layers that change other layers' nodes do it through the optional `refine` method, after all layers composed, instead of a dependency order; the presets take extra layers through `layers: { below, above }`, and plugins the core replaces leave the list with a redirect.
