# Proposal

## Why

The site has one docs page, Getting started. v2 brings a new functional API, composed charts, custom properties, container queries and server rendering, and 1.x users need a way over. The plan lists the guides, the migration guide and the container queries page as the next website change.

The author asked to take inspiration from the 0.x guides (`tmp/chartist-v0/site/data/pages/getting-started.yml`). They worked because they followed one path from first chart to advanced use, explained _why_ (separation of concerns: style in CSS, not options), spoke directly to the reader with some personality ("Responsive sugar topping", "Fixed stuff can be sweet too!", "The force is strong in you young padawan!"), and let readers play with live examples. The 1.x Docusaurus docs kept the text but lost the voice and the flow.

## What Changes

Docs pages in `apps/docs/src/content/docs/`, all on the functional API, each with at least one live example:

**Start here**

- _Getting started_ (exists; gets links into the new pages).
- _Why Chartist?_: what it's made for and what it leaves to the platform (the 0.x/1.x "What is it made for?", rewritten for v2): SVG and CSS, no theme engine, small, extensible.
- _Coming from 1.x_: the migration guide. What keeps working unchanged (the classes, `chartist/styles.css`, the look), what's new, how to move to the functions step by step, the events (`compat` for 1.x events, `fromLegacyPlugin` for 1.x plugins), UMD for classic `<script>` tags as backwards compatibility only, and what was removed.

**Chart types**

- _Line charts_: lines, areas, points, smoothing (interpolation), gaps, scatter.
- _Bar charts_: grouped, stacked, horizontal, distributed series.
- _Pie and donut charts_: pies, donuts, gauges, labels.
- _Composed charts_: `chart()` with axes and layers, bars and lines on two axes.

**Guides** (the 0.x path: configure, size, style, respond, go further)

- _Data and options_: data shapes (one- and two-dimensional values, series objects and names), defaults, options per series (the line chart's `series` option).
- _Sizing charts_: the `ct-*` ratio classes, fixed sizes, CSS `aspect-ratio` (and why it needs `min-height: 0`), several charts on one page.
- _Styling with CSS_: the classes per chart type, the `--ct-*` custom properties (page, container or one chart), `--ct-color` per series, the accessible theme and dark mode, Sass.
- _Responsive sugar topping_: responsive overrides by media query, and container queries with `container()`, marked experimental and polyfill-only, with the setup.
- _Axes and scales_: step and auto-scale axes, fixed ticks, XY plots.
- _Animations_: CSS first (draw-in, reveal on scroll with timelines), SMIL where CSS can't, reduced motion.
- _Events and plugins_: the pipeline phases, `compose`, decorating and replacing elements, writing and sharing a plugin.
- _Server rendering_: `toScene()`, `renderToString()`, SVG vs HTML labels.
- _Updating charts_: `update()`, `detach()`, `destroy()`.

**Quality bars**

- A short writing guide, `apps/docs/WRITING.md`: the voice taken from 0.x, page shape, how live examples and code blocks are used, words to avoid.
- Every code sample runs against the current build: TypeScript blocks are type-checked against `chartist`'s types, and live examples render without errors in e2e.

The pages are written in parallel by subagents after a reference page (`Styling with CSS`) sets the voice and shape, the same way the Tailwind migration ran.

## Capabilities

### Modified Capabilities

- `docs-site`: new requirements for the guide and chart type pages, the migration guide, experimental features, and checked code samples.

## Impact

- `apps/docs`: about 15 new MDX pages; sidebar groups stay (`Start here`, `Chart types`, `Guides`); a sample checker (Nx target or e2e) for TypeScript code blocks; `WRITING.md`.
- No library changes. If writing finds a library gap or bug, it's reported, not fixed here.
- The examples gallery and the API reference stay in their own changes (`add-docs-examples`, `add-api-reference`); pages link to them once they exist.
