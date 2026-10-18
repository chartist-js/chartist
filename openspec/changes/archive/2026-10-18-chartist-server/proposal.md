## Why

Rendering a chart to markup is a server task, but its functions live in the core: every page that loads the full browser build (`dist/index.min.js`, the UMD build, a CDN link) pays for the SVG serializer and the hydration markup, about 1.1 kB gzipped, without ever calling them. With 2.0.0 out for a day, moving them to their own entry point now costs almost nobody anything, and later costs everyone who adopts them.

The same entry is the place for what server users ask for next: styling a chart that ends up in a PDF or an image. Today they write a `scene` listener that appends a `<style>` element by hand (the server rendering guide shows how). That's easy to get wrong with Chartist's own stylesheet, which colors series through custom properties (`var(--ct-color)`, set on each series group) and `light-dark()`, which many SVG rasterizers and PDF tools don't support.

## What Changes

- **A new entry point, `chartist/server`**, in every format the other entries ship (ESM, CJS, browser ESM, UMD adding to the global `Chartist`), importing the core instead of bundling it. It holds:
  - `renderToString(scene)`, moved from `chartist`;
  - `renderForHydration(config, size)`, moved from `chartist` before its first release;
  - `applyStyles(scene, css, options)`, new: it matches CSS (Chartist's stylesheet, a theme, your own) against the scene and writes the resolved values as SVG presentation attributes onto the elements, with custom properties and `light-dark()` resolved for a color scheme, so the markup draws the same in tools that read SVG on its own.
- **BREAKING (2.x minor): `renderToString` is no longer exported from `chartist`.** Import it from `chartist/server`. The changelog says so in its own section. This breaks the "additive 2.x minors" decision once, on purpose: 2.0.0 is a day old, the fix is one import path, and the full browser build gets about 1.1 kB smaller for good.
- **`toScene()` stays in `chartist`.** It shares the pipeline with `chart()`, so moving it would save 0.16 kB, and it's used in the browser too: `diffScenes()`, the terminal package, drawing a scene with `domRenderer()`. `chartist/server` re-exports it, so server code imports from one place.
- **The server API is experimental:** `renderToString`, `renderForHydration` and `applyStyles` are marked `@experimental` in `chartist/server` and recorded as such. `toScene` stays stable in `chartist`.
- **Docs:** the server rendering and SSR with hydration guides, the security guide, the frameworks recipes, the examples, the landing page and the share cards import from `chartist/server`. The server rendering guide's "Where the markup goes" section shows `applyStyles()` instead of the hand-written `<style>` listener. The playground resolves `chartist/server`.
- **`@chartist-js/terminal`** needs no code change: it uses `toScene()` only. Its docs and doc comments that show `renderToString()` move to the new path.

## Breaking changes vs 1.x

None: 1.x had no string rendering. For 2.0 code, `import { renderToString } from 'chartist'` breaks and becomes `import { renderToString } from 'chartist/server'`. `renderForHydration` was never released from `chartist`.

## Out of scope

- Moving `toScene()` or the preset config builders (`lineChartConfig()` and friends, 0.13 kB): they serve browser code too.
- Full CSS: `applyStyles()` handles the selectors and values chart styles use (see the design); nesting, `:has()`, `@container`, animations and HTML label layout aren't resolved.
- Rasterizing: turning SVG into PNG or PDF stays with the tool of your choice.
- A deprecation period with re-exports from `chartist`: it would keep the bytes in the core until 3.0, which is what this change avoids.

## Capabilities

### New Capabilities

- `server-rendering`: the `chartist/server` entry point, its exports, and `applyStyles()`: which rules match, how values are resolved, the color scheme, what it leaves out.

### Modified Capabilities

- `chart-rendering`: SVG string rendering comes from `chartist/server`.
- `chart-hydration`: `renderForHydration()` comes from `chartist/server`.
- `library-distribution`: the `./server` export, its builds in every format without a copy of the core, and size budgets for it and for the smaller core.
- `public-api`: the export lists and the experimental list record `chartist/server`; `chartist` loses `renderToString`.
- `docs-site`: the guides show `chartist/server` imports and `applyStyles()`.

## Impact

- `packages/chartist`: `src/server/` (entry, `renderToString` and `renderForHydration` moved from `src/render/string.ts` and `src/chart/`, `applyStyles`), `src/index.ts`, `tsdown.config.ts`, `package.json` `exports`, `.size-limit.json`, the API recordings and tests, the smoke tests (a server entry in every format), the doc comments that import `renderToString`.
- `packages/terminal`: doc comments and docs only.
- `apps/docs`: guides, examples, `lib/og-card.ts`, `lib/board-markup.ts`, the landing's Features section, the playground's import map, the API reference's entry list.
- Depends on the `chart-hydration` change, which is archived first.
- `docs/decisions.md`: the exception to additive 2.x minors, with its reason, and `chartist/server` under Distribution.
- No new dependencies.
