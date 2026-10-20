# Design

## Context

- **The compose phase** (`packages/chartist/src/pipeline/phases.ts`, `compose()`): every layer's `compose` runs first, its top-level nodes are keyed (`assignKeys`, `layer/series/value`), then each node with a role passes through the refining layers (`refine`, in list order) and the `compose` listeners, layer by layer, children before parents. The result is concatenated in list order, and `drawn[layerIndex]` keeps each layer's nodes and context for keyframes.
- **`refine` can't add nodes.** It returns a changed node; the pipeline keeps the node's key and children whatever it returns ("Layer refinement" in `openspec/specs/chart-composition/spec.md`). The band's `mark` is built on it.
- **What the nodes know:**
  - `point`: `x`, `y`, `value` (`{ x, y }` or a hole), `meta`, `seriesIndex`, `valueIndex`, `series`. Points exist only with `showPoint`; the `line` node's `ctx.path.pathElements` hold every value's position and data (`value`, `valueIndex`, `meta`) either way.
  - `bar`: `x1`, `y1` (base), `x2`, `y2` (value end), clipped to the area, `value`, `meta`, indexes. A stacked segment starts where the previous one ends. Nothing says whether the bar is horizontal or stacked; with a zero-length bar, the geometry can't tell either.
  - The series group (`role: 'series'`) has the classes `ct-series` and `ct-series-{letter}` or the series' `className`.
- **Labels in the core:** axis labels are HTML (`foreignObject` + `span`, sized in px) or SVG `text` (`svgLabels`), following `context.labels` (chart option, else the renderer's). `targetLine()` always draws SVG `text`, measured with `context.measureText` and placed with `textAscent`. `node()`, `findAll()`, `mapNodes()` and `textAscent` are public; `withFields()` isn't.
- **The 1.x plugins:**
  - `chartist-plugin-pointlabels` 0.0.6: `labelClass: 'ct-label'`, `labelOffset: { x: 0, y: -10 }`, `textAnchor: 'middle'`, `align` (`left`, `center`, `right` for bars), `labelInterpolationFnc`. Text at the point (or the bar's base y). Value: `value.y || value.x`, so 0 falls through.
  - `chartist-plugin-barlabels` 0.0.5: `labelClass`, `labelInterpolationFnc`, `labelOffset` per direction (`{ x: 0, y: -2 }` vertical, `{ x: 2, y: 4 }` horizontal), `textAnchor`, `showZeroLabels: false`, `startAtBase`, `includeIndexClass`, `thresholdPercentage: 30` with `ct-label-below`/`ct-label-above` classes and an inset position for long bars, `labelPositionFnc`.
- **The terminal** draws `text` elements without a built-in role as labels (`packages/terminal/src/draw.ts`), and renders scenes with `labels: 'svg'`.
- **The live renderer** identifies a node with a numeric `ctx.seriesIndex` by the layer (the first part of its key), series index, value key and role (`packages/chartist/src/live/diff.ts`).
- **Dependency:** `add-essentials-package` creates `packages/essentials` (build, stylesheet, docs section, tests) and the gallery's "Essentials" section, whose examples live in `packages/examples/essentials/<id>`; see the proposal.

## Goals / Non-Goals

**Goals:**

- One layer for what both plugins did, with defaults that look right on simple, horizontal and stacked bars and on lines without options.
- Positions that come from the finished bars and points, so every bar option (stacking, `seriesBarDistance`, `offset`, `distributeSeries`, clipping) and every plugin that moves nodes is followed for free.
- A minimal, general core addition that third-party layers can use too.

**Non-Goals:**

- A label collision solver.
- Porting the plugins' option names one to one (`labelOffset`, `textAnchor`, `thresholdPercentage`): v2 positions are named, and CSS does the rest.

## Decisions

### An annotating layer, not a layer that recomputes the geometry

The layer needs every bar's final geometry. Options:

- **Recompute in `compose`** from the data and axes: it would duplicate `bar()`'s stacking and offsets, need the bar layer's options (it can't see them), and break when a plugin moves a bar.
- **`refine`**: sees finished nodes, but can't add any. Collecting nodes in a closure and drawing them later would rely on call order and keep state between runs.
- **A `compose` listener (a plugin):** sees finished nodes and can append to series groups, but then labels are inside each series' group, so a later series draws over earlier series' labels, and a plugin isn't a layer: it can't go in `layers.above`, which `docs/decisions.md` names for value labels.
- **`annotate(drawn, context)`, chosen.** A second, optional compose step: the pipeline runs the layers without `annotate` as today (compose, keys, refine, listeners), then calls each annotating layer with those finished top-level nodes, keys, refines and emits its nodes, and assembles the result in list order. It's additive (charts without it run the current code path), it fits the existing contract (it gets the same `LayerContext` as `compose`), and it's general: a legend that reads series nodes or a custom "last value" marker can use it.

Details:

- **Annotating layers don't see each other.** No ordering between them to define, and no cycles. The alternative, "sees every node listed before it", makes the result depend on list order in a way the draw order already uses.
- **Nodes after listeners.** A dropped or restyled bar is what the user sees, so its label follows. The cost: `compose` events of an annotating layer's nodes come after all other events, not in list order. Listeners don't depend on that order today (they're per node), and the spec only promises the draw order.
- **Its own `compose` still runs** (it's required on `Layer`); value labels return `[]` there. Making `compose` optional was rejected: every consumer of `Layer` would have to handle a missing `compose`.
- **`drawn` keeps its layer index entry**, so `keyframes` of annotating layers work like others'.
- **The name:** `annotate`, because the layer adds to what others drew. `decorate` and `overlay` read as styling; `afterCompose` names the time, not the purpose.

### `horizontal` and `stacked` on the bar context

The layer could guess: `x1 === x2` means vertical, a base off the zero line means stacked. Both fail for zero-length bars and for the first segment of a stack, which starts at zero. Two fields set by `bar()` are exact, cost a few bytes, and help plugins (threshold coloring, tooltips) too. `stacked` is true for `accumulate` and `accumulate-relative`, false for `overlap`, whose bars all start at zero and read like unstacked ones.

### Positions: two options with named values

`pointPosition` (`above`, `below`, `left`, `right`, `center`) and `barPosition` (`end`, `inside-end`, `center`, `inside-base`), each a plain string union.

- _Alternative, one `position` covering both:_ `'end'` would need a meaning for points and `'above'` for horizontal bars, and a composed bar-and-line chart couldn't set both. A union of a string and a per-role object was rejected for the reason `docs/decisions.md` gives for `targetLine` (TypeScript then reports errors on the wrong member).
- Bar positions follow the bar's direction (base to value), so negative and horizontal bars need no extra values.
- **Defaults:** points `above`; bars `end`; stacked segments `center`, because an `end` label overlaps the next segment. An explicit `barPosition` applies to stacked segments too.
- **`offset`** is the gap between the anchor and the label's nearest edge, not a baseline shift as in the plugins, so it means the same for every position and font size. Defaults: 8 px from a point's center (clears the 10 px default point), 4 px from a bar's end (as `targetLine`'s inset).

### Geometry

Text is measured with `context.measureText(text, { classes })`: width, and the font size for the height. The baseline is placed with `textAscent` (the text's top is `ascent × fontSize` above the baseline), as `targetLine()` does. A label's box is computed first (anchor, width, height), then fitted, then written as `x`, `y`, `text-anchor` (`text`) or `x`, `y`, `width`, `height` (`foreignObject`).

### Fitting with `overflow: 'fit'`

- **Inside a bar:** the label's extent along the bar (height for vertical bars, width for horizontal) must not exceed the bar's length (minus the offset at `inside-end` and `inside-base`). Otherwise an unstacked bar's label goes to `end`, and a stacked segment's is left out: past a segment's end is the next segment, so there's no good place.
- **At the edge:** the bounds are the chart area grown by the chart's padding, which `LayerContext` has and which always lies inside the SVG. Without an axis on a side, that edge is the SVG's edge; with one, a label may reach into the axis's offset by at most the padding. A bar's `end` label that crosses the bounds along the bar goes `inside-end` (shifting it inward would put it on the bar anyway, so it takes the inside color); everything else shifts inward by the least amount.
- _Alternative, reserve room with the essentials change's `inset` hook:_ it would shrink every chart with labels by a label's height, even when nothing reaches the edge. Users who want room raise the axis's `high` or the padding; the guide says so.
- `overflow: 'show'` turns all of this off, for users who place labels with CSS transforms or want the plugin's behavior.

### SVG text by default, regardless of the chart's `labels`

The issue asks for SVG text so labels render on servers and export to images; `targetLine()` already ignores the chart's mode for the same reason. `labels: 'html'` on the layer gives a `foreignObject` with a `span` for pages that want CSS boxes (background, padding, rounded corners). The chart's `labels` option isn't followed, because `chart()` defaults it to HTML in the browser and the default would then differ between browser and server.

### Classes and custom properties

- The series class comes from the source node's series group (its classes other than the group class `ct-series`), so custom `className`s work and `--ct-color` is set on the label itself by the core's `.ct-series-x` rules.
- `--ct-value-label-color` defaults to the axis label color (`var(--ct-label-color, …)`, with the `light-dark()` fallback the core uses), not the series color: bars and labels in the same color read poorly on light series colors. One line of CSS opts into series colors.
- `--ct-value-label-inside-color` defaults to white, for labels on the bar's fill.
- `--ct-value-label-size` defaults to `var(--ct-label-size, …)`.
- In the essentials stylesheet, built as the essentials change sets up, with an SCSS partial and `$ct-value-label-*` variables only if the package's stylesheet convention has them.

### Nodes and identity

- **Role `valueLabel`**, declared in the essentials package with `declare module 'chartist' { interface NodeRoles { … } }`, as the core's `NodeRoles` docs describe.
- **The context** copies `seriesIndex`, `valueIndex`, `value`, `meta` and `series` from the source node, so `assignKeys` keys it `labelsLayer/series/value` and the live renderer identifies it by the value key with no change to the live code. Two source layers labeling the same series and value (rare) are told apart by the live renderer's repeat counting.
- **Line values without points** come from the `line` node's path elements; a series with points uses the points only.

### Terminal and server

Nothing to change in either: SVG `text` without a built-in role is drawn as a label by the terminal, and `renderToString()`/`applyStyles()` handle `text`. Tests in the essentials package prove it: one with `@chartist-js/terminal` (a dev dependency), one with `chartist/server`.

### Option shape

```ts
export interface ValueLabelsOptions<
  R extends 'point' | 'bar' = 'point' | 'bar'
> {
  readonly roles?: readonly R[];
  readonly series?: readonly (number | string)[];
  readonly pointPosition?: 'above' | 'below' | 'left' | 'right' | 'center';
  readonly barPosition?: 'end' | 'inside-end' | 'center' | 'inside-base';
  readonly offset?: number;
  readonly format?: (
    item: ValueLabelItem<R>
  ) => string | number | null | undefined;
  readonly numberFormat?: Intl.NumberFormatOptions;
  readonly locale?: string | readonly string[];
  readonly overflow?: 'fit' | 'show';
  readonly labels?: LabelMode;
  readonly classNames?: {
    readonly group?: string;
    readonly label?: string;
    readonly inside?: string;
  };
}
```

`ValueLabelItem<R>` has the fields of the tooltips' `TooltipItem`, under the same names: `role`, `seriesIndex`, `valueIndex`, `value`, `meta`, `series`, `seriesName`, `label`, and `context` typed by the role (a union over `R`, so checking `item.role` narrows it); it has no `element`, since a label is part of the scene, not the page. An unknown `pointPosition`, `barPosition`, `overflow` or a non-finite `offset` throws when the layer is created, naming the layer.

### Text like the tooltips'

The author decided on 2026-10-20 that value labels format their text the way `@chartist-js/tooltips` does, so a `format` written for one mostly works for the other:

- **`format(item)`** gets one item with the tooltip item's fields and names, and `undefined` keeps the default text (the tooltips' semantics; the first draft drew no label for it). `null` and `''` draw none.
- **`numberFormat`** takes `Intl.NumberFormat` options for the default text. Unlike tooltips, labels render on servers too, so there's a **`locale`** option; without it the runtime's locale applies, and the guide says to set it for server rendering.
- **`\n`** starts a new line, as in the tooltips' text: stacked `tspan`s in SVG mode, a line break in HTML mode. Fitting measures the widest line and the lines' height.
- **No `render`** (the author, 2026-10-20). The tooltips' `render` fills a DOM element; the scene equivalent, a callback that returns nodes in place of the placed label, was proposed and left out. CSS, `format` and the `compose` listeners cover the looks.
- **The item type isn't shared:** tooltips and essentials don't depend on each other, so the shape matches by convention and both packages document it. A base type in the core can follow if a third package needs it.

## Risks / Trade-offs

- [The annotate step changes the order of `compose` events for annotating layers' nodes] → Only charts with an annotating layer are affected, all of them new; the doc comment and the custom layers guide say the events come last.
- [Labels overlap on dense charts] → `format` returning `null` for some values, the `series` and `roles` options, and the out-of-scope note; collision handling can come later as an option without changing defaults.
- [White inside labels on light series colors (yellow `ct-series-c`)] → One custom property per series fixes it; the guide shows it. The accessible theme can set a darker inside color.
- [Estimated text metrics on the server differ from the browser's] → The same as for every SVG label; the fitting decisions near a threshold can differ. Server users who care pass their own `measureText`.
- [A third-party plugin listed on the plugins page (`chartist-plugin-barlabels`) leaves the page] → Its use case is covered by a maintained package; the author decided on 2026-10-19 that plugins an official package replaces leave the plugins page, without a redirect. It keeps working through compat, and the guide's migration section names it.
- [The old 0.x site keeps sending its point label anchors to the removed plugin page until its redirect pages are pushed again] → The push to its `gh-pages` branch is part of the release, with the author's go.

## Migration Plan

Additive: core first (`annotate`, bar context fields) in one commit, then the essentials layer, examples, docs. Rollback is reverting the commits; nothing persists. The 1.x plugins keep working through compat.

- **Examples** go in the gallery's "Essentials" section: `essentials/value-labels-bars`, `essentials/value-labels-stacked` and `essentials/value-labels-line`, `v2: true`.
- **The plugins page:** both plugins leave it with their pages and live examples, without a redirect (decided by the author on 2026-10-19). Every link to their pages is repointed: the 0.x redirect table's anchors `point-label-plugin` and `example-plugin-pointlabel` to `packages/essentials/value-labels/` (checked against the build by `docs:v0-redirects`; the old site gets the pages in a push at release time with the author's go), and the docs e2e tests that use the point labels page (`plugins.spec.ts`: tile preview, playground link; `release.spec.ts`: the pinned plugin version) to another listed plugin. `chartist-plugin-barlabels` had no 0.x anchor and no link in the site besides its tile.

## Open Questions

- **Option names:** `pointPosition`/`barPosition` versus the issue's `position: 'end'`. The issue text was a sketch; the author may prefer one `position` with a per-role default. Changing it later is a rename before release.
- **The core method's name:** `annotate`. Alternatives in the decision above.
- **Following the chart's `labels: 'html'`:** decided not to (SVG by default). If the author wants HTML pages to get HTML value labels, the layer would read `context.labels` instead.
- **Stack totals:** left out. A `totals: true` option drawing the sum at each stack's end is the natural next step, asked for in several 1.x issues; it fits the same layer later.
- **Inside color:** white by default, or the chart background (`--ct-grid-background-fill`)? White assumes the default solid bar strokes.
