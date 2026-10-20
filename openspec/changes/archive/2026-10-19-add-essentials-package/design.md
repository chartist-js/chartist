# Design

## Context

- **Layout today** (`src/pipeline/phases.ts`, `layout()`): with axes, `config.axes.area(width, height, padding)` (`axisArea()` in `src/scales/axis.ts`) sums the axis `offset`s per side and places the area inside `padding + offsets`; without axes, the area is the padding's inside, at least 1 px. The `layout` listeners can return a changed `Layout` (`width`, `height`, `padding`, `area`). Axes are created after `layout`, for the final area (`config.axes.create`). Layer binding (`config.axes.bind`) runs after `layout` too, but needs only the layers and the prepared data.
- **Where labels go:** the v2 axis layers (`axisLabels()`, `placeOnSide()` in `src/layers/axes.ts`) place labels relative to the area and each axis's `inset` (the summed offsets of the axes before it on its side). The presets' shared layers (`src/scales/grid.ts`, `axisNodes()` without a placer) keep the 1.x formulas: labels of a start axis (X on top, Y on the left) sit at `padding.top` / `padding.left`, labels of an end axis at `area.y1` / `area.x2`. The 1.x classes and compat (`src/compat/index.ts`) read `layout.padding` as `chartRect.padding`.
- **Nothing in the layer API sees the chart's size or reserves room.** `LayerContext` has the area and the padding; `Layer.extent()` reports value ranges before the axes exist. A legend or an axis title can only draw inside the area or ask the user to raise `chartPadding`, which `chartist-plugin-axistitle` did.
- **`chartist-plugin-axistitle` 0.0.7** (the 1.x plugin, checked from its npm tarball): options per axis `axisTitle` (text or function), `axisClass` (`ct-axis-title`), `offset: { x, y }` (a nudge), `textAnchor` (`middle`), `flipTitle` (Y titles rotate 90°, or −90° flipped). It appends SVG `text` in `created`, reserves nothing, and knows one X and one Y axis.
- **The template package** is `packages/terminal`: `tsdown` (ESM, CJS, declarations in separate passes, `chartist` external), `sideEffects: ["*.css"]`, Nx targets in `package.json` (`build` depending on `^build`, `test` on `build`, `test:smoke` packing the tarball), tests from the build (`test/entry.spec.ts` checks the built entries import only `chartist`, `test/readme.spec.ts`), `nx.json` release group `projects: ["chartist", "terminal"]`, docs in `apps/docs/src/content/packages/terminal/`, registered in `src/data/packages.ts`, with a preview in `src/lib/package-previews.ts`, served to the playground by `integrations/playground-lib.mjs` and mapped in `src/scripts/playground-env.ts`.
- **CDN check (2026-10-19):** `https://cdn.jsdelivr.net/npm/@chartist-js/terminal@2.1.0/+esm` rewrites the package's `import … from 'chartist'` to `/npm/chartist@2.1.0/+esm`, an exact version, bundled from `dist/index.js`. `chartist@2/+esm` answers 200 without a redirect, so a page that imports `chartist@2/+esm` or `dist/index.min.js` gets a second, different module URL and a second copy of the core. The docs already teach an import map for `chartist` (getting started, writing plugins).
- **Size today:** `import { chart }` 5.9 kB, `lineChart` 14.6 kB budgets (gzip, `packages/chartist/.size-limit.json`).

## Goals / Non-Goals

**Goals:**

- One general hook that legends, axis titles and custom layers use to get room, with the same result in every renderer and no change for charts that don't use it.
- A package skeleton that the other essentials changes (value labels, log axis, legend, time axis) only add files to: their source, specs, README sections, guides, examples, export list entries and budget entries.
- Axis titles that never overlap labels, without asking the user for padding.

**Non-Goals:**

- Room that depends on the created axes (ticks, label widths): the hook runs before the axes exist.
- Moving or reordering what the axes reserve: the axis bands stay where they are, the room goes outside them.

## Decisions

### `inset()` adds to the padding, before the axes

The pipeline calls every layer's `inset(context)` at the start of `layout()`, sums the room per side, and lays out with `padding + room` as the padding: `axisArea()` and the no-axes branch stay as they are and get the larger padding. So the room sits between the chart's padding and the axis bands, the area shrinks, and every label formula, the presets' 1.x ones included, follows: a top X axis's labels at `padding.top` sit right below the reserved room, as they would with a larger `chartPadding`.

- `Layout.padding` is that larger padding, and `Layout.inset` (new, optional) the room per side, present only when some layer reserved room. Charts without it get exactly today's payload, so 1.x plugins reading `chartRect.padding` and every scene stay the same.
- _Alternative, shrink the area but keep `padding`:_ cleaner numbers in `Layout.padding`, but the presets' start-side labels are placed from `padding.top` and `padding.left`, so they'd sit on top of the reserved room. Changing those formulas would change 1.x output.
- _Alternative, a `layout` listener in a plugin (what 1.x plugins did):_ no help for layers, which have no listeners, and ordering between several plugins would be up to registration order.

### The hook's signature

```ts
interface InsetContext {
  readonly width: number; // the chart's layout size, px
  readonly height: number;
  readonly padding: ChartPadding; // the padding option, without any room
  readonly data: PreparedData; // the layer's series, as compose gets them
  readonly axes: readonly AxisDefinition[]; // ids, sides, offsets; [] without axes
  readonly coordinates: Coordinates;
  readonly layerIndex: number;
  readonly labels: LabelMode;
  readonly measureText: MeasureText;
  readonly measureStyle?: MeasureStyle;
}

interface Layer {
  // …
  inset?(context: InsetContext): Partial<ChartPadding> | undefined;
}
```

- It returns `Partial<ChartPadding>`, the type the padding already has, so `{ bottom: 20 }` reads like `chartPadding`. Missing sides are 0; negative, `NaN` or infinite values throw `Chartist: layer "<type>" reserved invalid room …`, like the existing layout validation.
- **Binding moves before `layout`** so `data` is the layer's own series (a legend for some series lists those). Binding needs only the layers and the prepared data, so the order of results doesn't change.
- The measuring functions get the chart's root class, as in `compose`, so CSS for a chart type applies to measured text.
- It runs on every layout, so the room can depend on the size (a legend that wraps at narrow widths) and on responsive layers.
- _Alternative, a static `inset: { bottom: 20 }` field:_ simpler, but an axis title's room depends on its measured font, and a legend's on the chart's width.

### Each layer gets its boxes as `insetArea`

`LayerContext.insetArea?: Partial<Record<AxisSide, Area>>`, one `Area` per side the layer reserved room on. Across the side, layers stack outward in the order of `layers`: on the left, the first reserving layer's box ends at the outer edge of the axis bands (`area.x1 − sum of left offsets`), the next one is left of it. Along the side, a box spans the area (`x1..x2` for top and bottom, `y2..y1` for left and right), because titles and legends align with the plot; a layer that wants the full width has `context.area` and the padding to compute it.

- The boxes are computed from the layout before the `layout` listeners run: a listener that moves the area doesn't move them. That keeps them deterministic and keeps listeners from having to know about them.
- The order mirrors axes, which "stack outward in list order" already.
- `refine` and `keyframes` get the same context, so they see `insetArea` too.
- _Alternative, a separate phase or a `room` event:_ more API, and the boxes are a by-product of the layout the pipeline already computes.

### Names: `inset()`, `InsetContext`, `Layout.inset`, `LayerContext.insetArea`

The author chose `insetArea` for the boxes on 2026-10-19, over the draft's `reserved` and over `room`: it pairs with the `inset()` method that asks for the room and with `Layout.inset` that reports it, and says that it's an area, like `context.area`. The method, the context type and the layout field keep their names.

### Stable from 2.2.0

The package's exports are stable from its first release (decided by the author on 2026-10-19): none is marked `@experimental`, and the recorded export list has no experimental entries. They build on the stable layer contract, and `inset()` is core API with the same 2.x guarantees as the rest of `Layer`. A later change may still mark one of its own exports experimental, as `add-time-axis` does for `timeAxis()`, and records that in the list.

### `axisTitle()` is one title per layer

`axisTitle({ axis, text, align?, flip?, gap?, className?, classNames? })`, like `targetLine()` (one line per layer, decided 2026-10-16): plain options, and several titles are several layers. `axis` is required: presets name their axes `x` and `y`, composed charts use their own ids.

- **Room:** `measureText(text, { classes })` gives the line's height (the stylesheet's font size in the browser, the 12 px estimate in `toScene()`, one cell in the terminal); the room is `height + gap` on the axis's side, found by id in `context.axes`. `gap` defaults to 4 px, the inset `targetLine()` uses for its label. Empty text reserves nothing and draws nothing.
- **Drawing:** SVG `text`, in every label mode. A rotated `foreignObject` doesn't size or rotate reliably across browsers and rasterizers, and the 1.x plugin drew SVG text too. The baseline is placed with `textAscent` (exported by `chartist`), as `targetLine()` places its label: the line box starts `gap` px outside the axis band. Left and right titles get `transform="rotate(-90 x y)"` (bottom to top, the common reading direction), or `rotate(90 …)` with `flip`. `text-anchor` follows `align` (`start`, `middle`, `end`), and `align` also moves the anchor to the area's start, middle or end. Geometry is attributes, looks are CSS.
- **Classes and role:** `ct-axis-title` with the axis labels' direction and side classes (`ct-horizontal`/`ct-vertical`, `ct-start`/`ct-end`), so CSS can target one side; role `axisTitle`, context `{ axis, side, text, x, y }`.
- **Errors:** the layer declares `coordinates: ['cartesian']` and `series: []`, so a pie throws the coordinate error and the title doesn't shape any axis range. An unknown id throws `Chartist: unknown axis "<id>" in layer "axisTitle"`, as the other layers word it.
- **1.x parity:** text, class, anchor and flip carry over (`axisTitle` → `text`, `axisClass` → `classNames.title`, `textAnchor` → `align`, `flipTitle` → `flip`). The `offset` nudge doesn't: the room is reserved, so there's nothing to nudge. Function titles don't either: `update()` and responsive options change the text.
- _Alternative, one layer for all axes (`axisTitles({ x: '…', y: '…' })`, the plugin's shape):_ one object per chart, but it needs keys per axis id, and the one-thing-per-layer decision made the target line simpler.

### Two Y axes on one side

With two left axes, both titles sit outside both axes' bands, stacked in layer order. The guide shows listing them in the order of the axes, so the inner axis has the inner title. Placing each title right next to its own axis would need room between axis bands, which changes how axes stack; nobody asked for it, and raising the outer axis's `offset` is a workaround.

### Styles: two properties, falling back to the labels'

`src/styles.css` (copied to `dist/styles.css`):

```css
.ct-axis-title {
  fill: var(--ct-axis-title-color, var(--ct-label-color, rgba(0, 0, 0, 0.4)));
  font-size: var(--ct-axis-title-size, var(--ct-label-size, 0.75rem));
}
@supports (color: light-dark(#000, #fff)) {
  .ct-axis-title {
    fill: var(
      --ct-axis-title-color,
      var(
        --ct-label-color,
        light-dark(rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.6))
      )
    );
  }
}
```

The values are the core's label defaults (`$ct-text-color`, `$ct-text-size`, `$ct-text-color-dark`; read them from `packages/chartist/src/styles/_settings.scss` when implementing), and a test compares them with `chartist/styles.css`, as `seriesColors` is kept equal to the Sass list. Plain CSS, no Sass: the package has one small rule per layer, and the core's mixins aren't part of its published API. Weight and font are left to plain CSS, so the property list stays short.

### The package skeleton

`packages/essentials`, copied from `packages/terminal` without its CLI, font and Playwright parts:

- `package.json`: `@chartist-js/essentials`, `version` equal to `chartist`'s (lockstep), `license: "MIT OR WTFPL"`, `type: module`, `sideEffects: ["*.css"]`, `exports` for `.` (import/require with types), `./styles.css` and `./package.json`, `dependencies: { chartist: "workspace:^" }`, `publishConfig.access: public`, `homepage` `https://chartist.dev/packages/essentials/`, Nx targets `build`, `typecheck`, `test`, `test:smoke`, `test:size` with the terminal's inputs and `dependsOn`.
- `tsdown.config.ts`: `src/index.ts`, ESM and CJS, declarations in separate passes, `platform: 'neutral'`; the build copies `src/styles.css`.
- `src/index.ts` re-exports one module per layer or axis type (`axisTitle.ts` now); other changes add theirs.
- Tests: `src/*.spec.ts` (unit, with `toScene()` from `chartist`), `test/entry.spec.ts` (only `chartist`, no Node.js globals), `test/readme.spec.ts`, `test/stylesheet.spec.ts` (defaults equal to the core's), `test/exports.spec.ts` against `test/exports.json`, `test/smoke/pack.test.mjs` (pack both packages, install into an empty folder, `import` and `require`, render with `toScene()`), `test/smoke/browser.test.mjs` (Playwright, a static page with the import map over the two `dist` folders; it records requests to check the core loads once).
- `.size-limit.json` with `ignore: ["chartist"]` and one entry per export (`import { axisTitle }`), budgets set from the measured size plus a small margin.

### No bundler: an import map to `dist/index.js`

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/chartist@2/dist/index.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@chartist-js/essentials@2/dist/styles.css"
/>
<script type="importmap">
  {
    "imports": {
      "chartist": "https://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.js",
      "@chartist-js/essentials": "https://cdn.jsdelivr.net/npm/@chartist-js/essentials@2/dist/index.js"
    }
  }
</script>
```

The package's ESM build imports the bare `chartist`, which the map resolves to the same URL the page uses, so there's one core. This is the import map the getting started guide and the plugin guide already show. The site's prerelease rule pins both URLs to the exact version while the version is a prerelease.

- _Alternative, jsDelivr `/+esm`:_ works without a map, but rewrites `chartist` to `/npm/chartist@<exact>/+esm`, a second copy next to any other import of Chartist (checked above), and charts built from two copies mix nodes from both. The docs don't show it.
- _Alternative, a self-contained browser build bundling Chartist:_ the same double-core problem, by design.
- _Alternative, a minified `dist/index.min.js`:_ the package is a few hundred bytes per layer; minifying saves little and adds an entry. It can come later without breaking anything.

### An "Essentials" section in the gallery

Every example that uses `@chartist-js/essentials` lives in `packages/examples/essentials/<id>` and shows in its own gallery section, "Essentials", after "Live data" (decided by the author on 2026-10-19). This change creates the section; the value labels, log axis, legend and time axis changes add their examples to it. A reader browsing the gallery sees at a glance which charts need the package, and the line, bar and composed sections keep showing what the core draws alone.

- **Where sections come from today:** the manifest's `ChartType` union in `packages/examples/index.ts` (the type is the id's first segment), the folder list and id pattern in `packages/examples/scripts/check.ts`, and `TYPES` in `apps/docs/src/lib/gallery.ts` (headings and order). The gallery page's filter chips, the example pages' Open Graph eyebrow (`src/lib/og.ts`) and the examples part of `llms-full.txt` (`src/lib/markdown.ts`) all read `TYPES`; the gallery's file glob (`packages/examples/*/*/`) and the visual tests' screenshot folder (`example.type`) already take any type. The playground runs examples by their files and needs nothing per type. The `live` section was added the same way.
- **The change:** `essentials` joins `ChartType`, the check's pattern and folder list, and `TYPES` (`{ type: 'essentials', title: 'Essentials' }`, last). The check also fails for an example outside `essentials/` that imports `@chartist-js/essentials`, so later changes can't put one in the line or bar section by accident.
- **Ids** name the feature first: `essentials/axis-titles` (a `lineChart` with X and Y titles through `layers.above`) and `essentials/axis-titles-composed` (EUR and USD on left and right, months at the bottom, the USD title flipped, the month title aligned to the end). Both import `@chartist-js/essentials/styles.css` and are `v2: true`.
- **Tooltips don't follow this convention:** their examples show only on interaction, so they have no screenshots and stay in `apps/docs/src/examples/tooltips/`, as `add-tooltips-package` designs them.
- _Alternative, the examples in the line and composed sections (the draft):_ fewer sections, but readers couldn't tell which examples need a second package, and the sections would mix in more of them with every essentials change.

### Examples and visual tests use the package as a normal dependency

Issue #1525 moves the visual regression tests out of `packages/chartist` into their own package, which depends on `chartist` and `@chartist/examples`; it has landed. So the package reaches the examples and the visual tests as a normal workspace dependency, without a cycle:

- `packages/examples` depends on `@chartist-js/essentials` (`workspace:*`) for type checking and for resolving the examples' imports.
- The visual tests' package depends on `@chartist-js/essentials` (`workspace:*`) too, as later official packages whose examples it renders (such as `@chartist-js/tooltips`) would. Nx builds it before the visual run through the usual `^build`, and Vite resolves it and its stylesheet through the package's `exports`. No alias into `packages/essentials/dist` and no hand-written task dependency.
- Nothing `essentials` depends on depends on the visual tests or the examples, so pnpm sees no cycle.
- #1525 landed as `packages/visual` (`@chartist/visual`, Nx project `visual`, targets `visual:test:visual`, `visual:test:visual:v1` and `visual:test:visual:local`); this change adds `@chartist-js/essentials` to its `devDependencies`.
- The baselines come from the local build (the examples have no 1.x code) and are recorded on the reference platform, under `essentials/`.

### Docs

- `apps/docs/src/content/packages/essentials/`: `index.mdx` (what the package is, install, the import map, the stylesheet, a quick start with `axisTitle()`, and a list of what it holds that the other changes extend) and `axis-titles.mdx` (presets, composed charts with several axes, sides and alignment, flip, gap, styling with the properties and plain CSS, the markup and role, server and terminal, coming from `chartist-plugin-axistitle` with an option table).
- The registry entry in `src/data/packages.ts`, a TypeDoc options file, and a preview in `src/lib/package-previews.ts`: a small line chart with both titles, built with `toScene()` and `renderToString()` at build time with SVG labels.
- A news entry for the package.
- The playground: `integrations/playground-lib.mjs` serves `essentials/index.js`, `essentials/styles.css` and `essentials/index.d.ts`; `playground-env.ts` maps `@chartist-js/essentials` and `@chartist-js/essentials/styles.css` and adds the types under `packages`.
- The "Custom layers" guide gets a section on `inset()` and `insetArea`, with a live example of a small source-note layer at the bottom, and the `Layer.inset` doc comment links it.
- The axis title plugin leaves the site without a redirect: the author decided on 2026-10-19 that a plugin an official package replaces leaves the plugins page together with its page and live example, and that links to its page point to the package's guide instead. That differs from `chartist-plugin-targetline`, which the core replaced and whose page redirects to the core's guide; that redirect stays.
  - Removed: its entry in `src/data/plugins.ts`, its files in `plugin-files.json`, its pinned dev dependency in `apps/docs/package.json`, and its live example `src/examples/plugins/axistitle`. No `MOVED_PAGES` entry; the built site has no `/plugins/chartist-plugin-axistitle/` any more, and the sitemap and search follow on their own.
  - Repointed, so nothing links to the removed page: the 0.x redirect table (`src/lib/v0-redirects.ts`, the anchors `axis-title-plugin` and `example-plugin-axistitle`) to `packages/essentials/axis-titles/`; `docs:v0-redirects` checks every target against the build and writes the pages, and the old site's `gh-pages` branch gets them in a push at release time, with the author's go. Until that push, the old site's axis title anchors lead to the removed page.
  - Tests that use the plugin: `e2e/plugins.spec.ts` (the tile test and the plugin page test) take another listed plugin; `e2e/plugin-contract.spec.ts` drops the plugin's case, and its "Coming from 1.x" recipe test loads `chartist-plugin-threshold` instead.
  - "Coming from 1.x" uses `chartist-plugin-threshold` (which stays listed) for its compat example and points axis title users to `axisTitle()`. The plugins page's description and lead stop naming axis titles.

## Risks / Trade-offs

- **[Layout listeners that rebuild `Layout` by hand]** drop `inset` and keep the larger padding. → `inset` is optional and informational; the boxes don't depend on it.
- **[Server estimate vs browser font]** The server reserves room for a 12 px line (the text estimate), the browser for the stylesheet's size. → As with axis labels: hydration replays the server's estimate, and the following `resize` relayout uses real metrics. A page that sets a different title size sees one relayout, which isn't animated.
- **[Long titles]** overflow the area's extent; they're not wrapped or shortened. → Documented; `align` and responsive layers cover most cases.
- **[A title for an axis that's hidden]** (`showLabel: false`) still sits outside the axis band, which may be empty. → That's the axis offset's job: set `offset: 0` on the axis.
- **[Size of the core]** `inset` adds a few dozen lines to the shared layout. → Measured in the size task; the budgets of `chart`, the presets and the full builds are raised by the measured amount, with the numbers in the commit.
- **[The new package isn't on npm until 2.2.0]** StackBlitz can't install it before then, and a release without the trusted publisher fails at publish. → The docs deploy already waits for the version on npm; the trusted publisher is a release precondition the author sets up, listed in the tasks.

## Migration Plan

1. Core first (`inset`, `insetArea`, `Layout.inset`), in its own commit with tests, budgets and the API recordings, so the other essentials changes can build on it.
2. The package skeleton with `axisTitle()`, then the terminal's vertical text, then the "Essentials" gallery section with the examples and visual baselines, then docs and the plugin removal, in separate commits (file deletions apart from edits).
3. Before the 2.2.0 release: the author adds the trusted publisher for `@chartist-js/essentials` on npmjs.com. At the release, with the author's go: the regenerated 0.x redirect pages are pushed to the old site's `gh-pages` branch.
4. At archive: `docs/decisions.md` records the inset hook (room added to the padding outside the axis bands, list order, computed before listeners, the names with `insetArea`), the import map as the package's no-bundler path, the package's exports stable from 2.2.0, the "Essentials" gallery section, and that a plugin an official package replaces leaves the plugins page with its page and no redirect (next to the existing entry for plugins the core covers).

Rollback: the package can be dropped from the release group before 2.2.0; `inset` is additive and unused by core layers.

## Open Questions

Assumptions made without the author; none changes the approach.

- **Rotation default** (accepted as the default; the author didn't object on 2026-10-19): left and right titles read bottom to top (−90°), the convention in most charting tools; the 1.x plugin rotated +90° unless `flipTitle`. `flip: true` gives +90° on both sides, rather than making the right side read top to bottom by default.
- **Gap default:** 4 px, like `targetLine()`'s label inset; tuned during the visual review if titles look cramped.
