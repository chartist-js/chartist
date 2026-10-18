# Design

## Context

- **The entry points today:** `chartist`, `chartist/compat` and `chartist/live`. The two subpaths import only the package root (`../index`); tsdown keeps that import external and points it at the matching core build per format (`tsdown.config.ts`), so no subpath build bundles a second copy of the core. Each ships ESM, CJS, browser ESM (`*.min.js`) and UMD (adding to the global `Chartist`).
- **The server functions live in the core:** `toScene()` (`src/chart/toScene.ts`, built on internal pipeline functions: `runPipeline`, `installPlugins`, `eventMethods`, `withChartTypeClass`), `renderToString()` (`src/render/string.ts`) and, from the unarchived `chart-hydration` change, `renderForHydration()` (`src/chart/renderForHydration.ts`, using `buildScene()` from `toScene.ts` and the internal `withFields()`).
- **What they cost the full builds** (esbuild, minified, gzipped, `export *` of the source):
  - everything today: 29.53 kB;
  - without `renderToString` and `renderForHydration`: 28.38 kB (−1.14 kB);
  - also without `toScene`: 28.23 kB (−0.16 kB more);
  - also without the preset config builders: 28.10 kB (−0.13 kB more).

  Tree-shaken imports (`lineChart` and the others) don't contain them either way.

- **Who imports what:**
  - `@chartist-js/terminal` imports `toScene` only; it uses `renderToString` in no code, only in doc comments.
  - The docs import `renderToString` in the server rendering, SSR with hydration, security, frameworks, pie and donut, custom layers and coming-from-1.x pages, in two examples, in `lib/og-card.ts`, `lib/board-markup.ts` and the landing's Features section.
- **Chartist's stylesheet** (`dist/index.css`) has 105 `var()` uses. Series colors are a chain: `.ct-series-a { --ct-color: var(--ct-series-a, #d70206) }` on the series group, and `.ct-line { stroke: var(--ct-color) }` on its children. Grid and label colors use `light-dark()`. The donut width rule uses `:not(:where([stroke-width]))`.
- **The decision this breaks:** `docs/decisions.md` ("Road to 2.0 final", 2026-10-16) says 2.x minors are additive, and that the core's API is stable with only `container()` and `chartist/live` experimental.
- **Releases:** the release script takes, in order, a manual run's version, the prerelease id, then the conventional commits (`.github/scripts/release.mjs`). A `!` or `BREAKING CHANGE:` commit makes the commits ask for a major.

## Goals / Non-Goals

**Goals:**

- The full browser builds lose the server code: `dist/index.min.js` ends below 2.0.0's 27.62 kB.
- One import path for server code: `chartist/server`.
- Styling for images and PDFs in one call, with Chartist's own stylesheet working out of the box in tools without CSS support.
- The breaking import is visible: the changelog's breaking section, the release notes, the docs.

**Non-Goals:**

- A CSS engine. `applyStyles()` covers what chart stylesheets use (below).
- Moving `toScene()` or the preset config builders.
- Rasterizing.

## Decisions

### `chartist/server` imports the core, like the other subpaths

Its sources live in `src/server/` and import only `../index`. Its builds follow `chartist/live`: ESM, CJS, browser ESM importing `./index.min.js`, and UMD adding its exports to the global `Chartist`.

- **The UMD and browser builds** let a page export a chart as an image, with `applyStyles()` and `renderToString()` in the browser.
- _Alternative, a Node-only build:_ smaller to maintain, but the "download as PNG" case runs in the browser, and the other entries ship every format.

### `toScene()` stays in the core, and `chartist/server` re-exports it

`toScene()` is built on pipeline internals that the root doesn't export. Moving it would mean either exporting those internals or bundling a second pipeline into `chartist/server`, which a page using both entries would load twice. For 0.16 kB, neither is worth it. And `toScene()` isn't only server code: `diffScenes()` examples, the terminal package and `domRenderer().render(scene)` use it in the browser.

Server code gets `toScene` and `SceneSize` from `chartist/server` too, as the same function, so a server module needs one import.

- _Alternative, everything server-related moves (the first idea):_ −1.30 kB instead of −1.14 kB, but with a duplicated pipeline or exported internals, and a broken import for the terminal package and browser users of `toScene()`.

### `renderForHydration()` is rebuilt on the public API

It moves to `src/server/` and uses `toScene()` instead of `buildScene()`:

- `toScene(config, { ...size, labels: size.labels ?? 'html' })`;
- then the root gets `chart()`'s size attributes (`config.width ?? '100%'`, `config.height ?? '100%'`), the scaling `viewBox` and the marker with `node.attr()`;
- the style conversion rebuilds nodes with the public node methods (`attr`, `empty`, `append`, `text`) instead of `withFields()`.

The difference is that `scene` listeners now see the root with the layout size before it's set to `100%`, where they saw `100%` before. No listener in the repository reads the root size, and the chart in the browser replays with its own root size anyway. The marker's attribute name and `chartRootSize()` stay in the core for `chart()`. The server's marker writer and the live renderer's reader stay covered by the existing end-to-end hydration tests, which fail if they drift apart.

### `renderToString()` moves, without a deprecated re-export

A re-export from `chartist` would keep the serializer in the core until 3.0, which is what this change avoids. 2.0.0 is a day old, so few projects import it yet, and the fix is one import path.

- **The commit** is `feat(chartist)!:` with a `BREAKING CHANGE:` footer, so the changelog lists it in its breaking section.
- **The release** is a manual run with the version `2.1.0`, so the version stays a minor, as the author decided. The workflow doesn't bump the major on its own: a manual run's version wins over the commits.
- **`docs/decisions.md`** records the exception and its reason under "Road to 2.0 final": a one-time exception, the day after 2.0.0, for a size win in every full build; additive minors stay the rule.

### The server API is experimental

`renderToString`, `renderForHydration` and `applyStyles` are marked `@experimental` in `chartist/server`. `toScene` stays stable: it's the core's function, re-exported. The experimental list (`test/api/exports/experimental.json`) gets a `server` entry, and the public-api spec's rule names it.

### `applyStyles()` writes resolved presentation attributes, not a `<style>` element

`applyStyles(scene, css, { colorScheme })` returns a new scene. Every SVG element gets, as attributes, the CSS properties SVG has presentation attributes for, with the values the given CSS computes for it.

- _Alternative, a `<style>` element with the rules whose classes appear in the scene (the first idea):_ the selection is simple, but in Chartist's stylesheet the values aren't. `stroke: var(--ct-color)` takes its color from whichever series group the line is in, so one rule has a different value per element, and a rule can't be rewritten into one static value. Tools without custom property support then draw every line black. Resolving per element and writing attributes is what every SVG tool reads; even ones that ignore `<style>` read presentation attributes.
- _Alternative, `style` attributes per element:_ the same resolution, but some tools read only attributes, and a strict style policy blocks them where the markup lands in a page.

How it works:

- **Parsing:** a small tokenizer for comments, strings, rules and at-rules.
  - `@media` is evaluated for `prefers-color-scheme` only, and other conditions skip their rules.
  - `@layer` blocks are read in place, ignoring layer order; the docs say so.
  - Other at-rules (`@keyframes`, `@supports`, `@container`, `@font-face`, `@import`) are skipped.
  - Nested rules aren't supported, and are skipped.
- **Matching** runs against the scene tree:
  - type, class, `*` and attribute selectors (presence, `=`, `~=`);
  - `:not()`, `:is()` and `:where()` with those, with their specificity rules;
  - descendant and child combinators.

  Any other pseudo-class or pseudo-element makes that selector match nothing.

- **Cascade** per element and property:
  - `!important` first, then the node's own `style` attribute, then specificity, then order (stylesheets in the order given);
  - properties the node's `style` sets aren't written as attributes, since that style already wins wherever the markup goes.
- **Values:**
  - custom properties are computed per element: declared on it, or inherited from its parent;
  - `var()` resolves recursively, with its fallback, and gives up on cycles and missing values, leaving the declaration out;
  - `light-dark(a, b)` picks by `colorScheme`;
  - px lengths stay as they are, since presentation attributes accept CSS lengths in SVG 2 and in the rasterizers checked (a task).
- **Scope:** elements inside a `foreignObject` are skipped. The docs recommend SVG labels for images, since rasterizers don't draw HTML.
- **The property list** is the one `renderForHydration()` uses, moved to `src/server/` and shared.

Size: the parser, matcher and resolver are a few hundred lines; the budget is measured and set in the size task. They load only with `chartist/server`.

### Values are written as escaped attributes

The serializer already escapes attribute values and checks names. `applyStyles()` writes only property names from its fixed list, so CSS can't add an attribute name, and every value goes through the serializer's escaping. The docs still treat CSS as code: pass only stylesheets your application controls, since values such as `url()` reach the markup.

## Risks / Trade-offs

- **[Projects that import `renderToString` from `chartist`]** break at build time, with a clear "no exported member" error. → The changelog's breaking section, the release notes and the server rendering guide say so. The exception is recorded in the decisions.
- **[Semantic versioning purists]** will call a breaking minor wrong. → It's a deliberate, documented one-time exception, the day after the major; the alternative is a second major within days.
- **[CSS `applyStyles()` doesn't support]** (nesting, `:has()`, layer order) gives a different result than a browser. → The docs list what's supported. A rule it can't read is skipped, not misapplied.
- **[Rasterizer support differs]** → A task checks the output with one real rasterizer (resvg, through `@resvg/resvg-js` as a test-only dependency), sampling pixel colors of a line, a point, the grid and a label.
- **[Font metrics]** are a server question either way: `applyStyles()` sets the font family the CSS says, and the rasterizer needs that font.

## Migration Plan

1. Archive the `chart-hydration` change first, so this change's deltas apply to its synced specs.
2. Build `chartist/server`, move the functions, update the consumers and the docs, in commits that keep the build green.
3. Release with a manual run at `2.1.0`. The changelog has the breaking section.

Rollback: re-export `renderToString` from `chartist` again in a patch; nothing else depends on the removal.

## Open Questions

- The name `applyStyles` versus `inlineStyles` or `bakeStyles`. `applyStyles` says what it does to the scene without promising `style` attributes.
- Whether `applyStyles` should also take the label mode into account, for example warn when the scene has HTML labels. The proposal only documents it.
