## Why

Point labels are the fourth most installed 1.x plugin: `chartist-plugin-pointlabels` (about 11k downloads a month) and `chartist-plugin-barlabels` write each value next to its point or bar. Both are 1.x `draw` listeners, so on v2 they need `chartist/compat`, run only in the browser, can't label stacked segments sensibly, and hide a value of 0 (pointlabels reads `value.y || value.x`). Discussion #1401 asks for labels on stacked bars with text of its own. Issue #1531 plans the v2 successor in `@chartist-js/essentials` for 2.2.0.

## What Changes

- **`valueLabels(options)`**, a new layer in `@chartist-js/essentials`, writes a label per value at the points and bars the other layers drew:
  - points: above (default), below, left, right or centered on the point;
  - bars, vertical and horizontal: past the bar's end (default), inside its end, centered, or inside its base; a stacked segment is centered by default;
  - text the way `@chartist-js/tooltips` does it: `numberFormat` (`Intl.NumberFormat` options, with a `locale`, since labels also render on servers) for the default text, and `format(item)` with the same item fields as the tooltips' (`role`, `seriesIndex`, `valueIndex`, `value`, `meta`, `series`, `seriesName`, `label`, `context` typed by the role); `undefined` keeps the default text, `null` or `''` draw no label, and `\n` starts a new line;
  - `offset` in px, a `series` selection, `roles` (`point`, `bar`), `classNames`;
  - labels that don't fit are handled (`overflow: 'fit'`, the default): an inside label longer than its bar moves past the bar's end, or is left out in a stacked segment; a label that would leave the chart area and its padding moves inward, a bar's end label inside the bar's end;
  - SVG `text` by default, so it renders on the server, in images and in the terminal; HTML in a `foreignObject` with `labels: 'html'`;
  - looks from the essentials stylesheet: `.ct-value-label`, `.ct-value-label-inside`, and `--ct-value-label-color`, `--ct-value-label-inside-color`, `--ct-value-label-size`.
- **Core: annotating layers.** A new optional layer method, `annotate(drawn, context)`, in `chartist`: it runs once the other layers' nodes are refined and through the `compose` events, gets those finished nodes, and returns nodes of its own, drawn at the layer's place in the list. Value labels need it because a layer can't otherwise see where another layer drew a bar (stacking, `seriesBarDistance`, `offset`, clipping), and `refine` can't add nodes. Additive; charts without such a layer render as before.
- **Core: two fields on the bar context.** `BarContext` gets `horizontal` and `stacked`, so a layer or plugin knows a bar's direction and whether it's a stacked segment without reading it from the geometry. Additive; the output doesn't change.
- **Examples, visual tests and docs:** three examples in the gallery's "Essentials" section (bar labels, stacked segments with meta text as in #1401, line labels with a unit), visual baselines for them, a "Value labels" guide in the essentials package docs, and the generated API page.
- **The two 1.x plugins leave the plugins page** with their pages and live examples, without a redirect, as the author decided on 2026-10-19 for every plugin an official package replaces. Links to their pages (the 0.x site's point label anchors, the docs e2e tests) point to the value labels guide or another listed plugin instead.

## Capabilities

### New Capabilities

- `value-labels`: the `valueLabels()` layer: what it labels, positions, offsets, formatting, empty values, fitting and the chart's edges, label modes, classes and custom properties, live updates, server and terminal rendering, its examples, and the 1.x plugins leaving the plugins page.

### Modified Capabilities

- `chart-composition`: an added requirement for annotating layers (`annotate`).
- `scene-graph`: an added requirement for the bar context's `horizontal` and `stacked` fields.

## Impact

- **Depends on `add-essentials-package`**, designed in parallel: the `@chartist-js/essentials` package (scaffold, build, stylesheet, docs section, test setup) and the gallery's "Essentials" section with the `essentials` example type in `packages/examples/essentials/`. This change adds one layer to it and is applied after it.
- `packages/chartist`: `src/pipeline/types.ts` and `src/pipeline/phases.ts` (`annotate`), `src/layers/bar.ts` and `src/scene/roles.ts` (`horizontal`, `stacked`), unit tests, the recorded API (`test/api/`), the "Custom layers" guide's section on reading other layers' nodes. Size: a few dozen bytes in the core, within the budget.
- `packages/essentials`: `src/valueLabels.ts`, its spec, the `valueLabel` role declared with module augmentation, styles, README example, export list.
- `packages/examples`: three examples in `essentials/` (`value-labels-bars`, `value-labels-stacked`, `value-labels-line`) and their manifest entries; visual baselines recorded on the reference platform by the visual tests (their own package since #1525).
- `apps/docs`: the guide, the API page; the two plugins out of `src/data/plugins.ts`, `plugin-files.json`, `package.json` and `src/examples/plugins/` (`pointlabels`, `barlabels`); no `MOVED_PAGES` entry. Links repointed: `src/lib/v0-redirects.ts` (the point label anchors), `e2e/plugins.spec.ts` (the tile preview and the playground link tests use point labels), `e2e/release.spec.ts` (reads the point labels page for the pinned plugin version), `e2e/plugin-contract.spec.ts` (both plugins' cases).
- The old 0.x site: the regenerated redirect pages for the point label anchors, pushed to its `gh-pages` branch at release time with the author's go.
- Coordination: the parallel `add-bar-ranges` change also adds a field to `BarContext` (`range`) and edits `bar.ts`; whichever lands second rebases. Value labels on a range bar label its high end like any bar. The parallel `add-legend-layer` change leaves an automatic marker per series open for want of a core hook; `annotate` would be that hook.
- No new runtime dependencies. `@chartist-js/terminal` becomes a dev dependency of the essentials tests, if the essentials change doesn't add it already.

## Breaking changes vs 1.x

None. The 1.x plugins keep working through `chartist/compat`; `valueLabels()` is new and functional-API only. Its default output differs from the plugins' on purpose (a label for 0, `ct-value-label` instead of `ct-label`, distances measured from the text's edge), and the guide shows how to move from the plugins' options.

## Out of scope

- Pie and donut slices: the pie layer has its own labels, and `labelTransform` can show the value there.
- Stack totals (one label per stack with its sum), and labels on areas, bands, target or trend lines.
- Avoiding collisions between labels (dropping or nudging overlapping labels), beyond fitting each label to its bar and to the chart's edge.
- Leader lines, rotated labels, and rich text in a label.
- A 1.x class plugin: the 1.x classes keep using the 1.x plugins through compat.
