## Why

Chartist renders charts to SVG strings on the server (`toScene()` + `renderToString()`), but the browser can't take that markup over: `chart()` throws it away and draws a new chart. In React, Vue, Angular and Svelte apps, that means one of two things:

- a static chart without Chartist's runtime (live updates, animations, plugins);
- a client-only chart, missing from the server HTML.

Users of these frameworks need server-rendered charts that keep working in the browser, and wrapper authors need a contract they can rely on.

A throw-away proof of concept tested this in Next.js, Nuxt, Angular SSR and SvelteKit, in dev and production builds, with slow devices and networks, over three rounds. It found that taking over the server's elements (hydration) is feasible in all four, and needs no framework-specific code in Chartist. It also showed that it beats drawing a fresh chart over the server markup:

- CSS animations running since page load continue instead of restarting;
- a lazily loaded Chartist leaves no blank frames;
- LCP stays at first paint instead of moving to hydration on phones.

Along the way, it found a serializer bug that corrupts the page around a chart with an empty HTML label, and a cleanup bug that leaves two charts.

## What Changes

- **Hydration markup:** `toScene(config, { width, height, hydrate: true })` marks the scene's root for the browser to take over. In the markup:
  - a `data-ct-hydrate` attribute records what the browser needs to build the same scene again: the layout size, the label mode, whether text was estimated, and whether the root got a scaling `viewBox`;
  - the root gets the size `chart()` gives it (`100%` unless the config sets one) and, for preset configs, the presets' inline size style;
  - unless the config sets a `viewBox`, the root also gets one of the layout size, so the chart scales into its container until the browser lays it out at the real size;
  - labels default to HTML, as `chart()` draws them.
- **Adoption in the live renderer:**
  - `liveDomRenderer()` takes over a marked svg in the chart's container instead of drawing a new one. It binds the scene's nodes to the existing elements and makes them what a fresh render would draw: it sets differing attributes, classes, styles and texts, removes attributes the scene doesn't have, and puts `ct:` attributes in their namespace. Styles go through the CSSOM, so a strict style policy that blocked the markup's `style` attributes doesn't keep them from applying.
  - A structure that doesn't match logs a warning, and the chart draws a new svg in its place.
  - `liveDomRenderer({ adopt: false })` opts out.
- **Hydration in `chart()` and the presets:** with a renderer that adopts, they take a marked svg over automatically; there is no new option on `chart()`.
  - `render` and `mount` run once with the new cause `hydrate`, carrying `hydration: { repaired }`, the number of differences from the server's markup.
  - If the container's real size differs, the chart then lays out again as a `resize`, keeping the elements.
  - The marker and the scaling `viewBox` are removed with that layout.
  - With the default `domRenderer()`, the chart draws a new svg over the server markup, without a warning.
- **A warning when other code replaced the chart's svg:** a framework that writes the server markup into the container again, on every data change, silently breaks live updates. The chart's next render warns and draws a new svg.
- **Fix: closed HTML elements in string output.** `renderToString()` writes empty HTML elements inside a `foreignObject` (an empty label) as `<span …></span>`, not `<span …/>`. The HTML parser ignores `/>` on HTML elements, so the label stayed open and took in the page content after the chart.
- **Fix: replacing server-rendered charts.** The DOM renderer removes a previous Chartist svg that came from parsed HTML too. The HTML parser leaves `xmlns:ct` without its namespace, so such an svg stayed next to the new chart.
- **Docs:**
  - the server rendering guide explains taking a chart over in the browser, with a live example;
  - a new Advanced guide, "Charts in frameworks", gives the rule every framework integration follows, and one recipe each for React, Vue, Angular and Svelte, with their traps;
  - the API reference covers the new option, cause, event field and renderer method.

## Breaking changes vs 1.x

None. 1.x code doesn't render to strings and never meets marked markup. The 1.x classes don't hydrate.

For 2.0 code:

- **`RenderCause` gains `'hydrate'`.** An exhaustive `switch` over it in TypeScript needs a new case.
- **`renderToString()` output changes for empty HTML elements** (`<span …></span>` instead of `<span …/>`), which parses the same in XML and correctly in HTML.
- **A Chartist svg parsed from HTML** in a container is now replaced when a chart draws there, instead of staying next to it.
- **Nothing changes without `hydrate: true` on the server.**

## Out of scope

- **Wrapper packages for frameworks.** The guide gives recipes that community wrappers can follow. A Chartist web component, the standing plan for framework support in `docs/decisions.md`, would build on the same contract and stays a separate decision.
- **Hydration for the 1.x classes,** and for converted 1.x plugins' own elements: `fromLegacyPlugin` plugins get their `draw` events from `mount` as usual, on the adopted elements.
- **Moving the label and root `style` declarations into `styles.css`,** which would make the server markup itself pass a strict style policy without JavaScript. That changes the 1.x markup of every chart and is its own decision. Until then, a chart under a strict policy is correct once hydrated.
- **Replaying a custom server `measureText`** in the browser. The browser replays with the estimate; a different server measurement is repaired or, if it changes the structure, drawn fresh.
- **Guessing the client's width on the server** (client hints, cookies). That's app code.
- **Rendering the scene as framework elements** (a hyperscript adapter). It would lose the live renderer, animations and mount plugins.

## Capabilities

### New Capabilities

- `chart-hydration`:
  - the hydration markup from `toScene()`;
  - adoption by the live renderer;
  - how `chart()` takes server markup over and lays it out at the real size;
  - the fallbacks (no adopting renderer, a structure that doesn't match);
  - the warning when other code replaced the svg.

### Modified Capabilities

- `chart-rendering`:
  - the DOM renderer replaces Chartist svgs parsed from HTML;
  - `renderToString()` closes empty HTML elements;
  - renderers may adopt server markup (`Renderer.adopt`).
- `chart-pipeline`: the `hydrate` cause and the `hydration` field in `render` and `mount`.
- `live-updates`: `liveDomRenderer()` adopts server markup, and its `adopt` option.
- `security`: a hydrated chart applies its styles under a strict style policy; the guarantee for markup without JavaScript is stated.
- `library-distribution`: size budgets for what hydration adds to the core and to `chartist/live`.
- `docs-site`:
  - the server rendering guide covers taking charts over in the browser;
  - the new "Charts in frameworks" guide in the Advanced group;
  - framework recipes may hand server markup to the framework's raw-HTML feature, the one exception to the `innerHTML` rule for guides.

## Impact

- **`packages/chartist` core:**
  - `src/chart/toScene.ts`: the hydrate option and the marker;
  - `src/chart/chart.ts`: taking marked markup over, the `hydrate` render, the correction as `resize`, the warning;
  - `src/render/types.ts`: `Renderer.adopt`, `RenderCause`;
  - `src/pipeline/types.ts`: the `hydration` field;
  - `src/render/dom.ts`: replacing parsed svgs;
  - `src/render/string.ts`: closing HTML elements;
  - `src/presets/`: the inline size style in preset configs' hydration markup.
- **`packages/chartist` live entry** (`src/live/`): adoption, and the `adopt` option.
- **Tests:**
  - unit tests;
  - the API recordings and type tests;
  - the CSP and browser smoke tests, with server markup in the served HTML;
  - the size budgets.
- **`apps/docs`:**
  - the server rendering guide and its new live example;
  - the "Charts in frameworks" guide;
  - the navigation;
  - the API reference.
- **Size:** in the PoC, a `lineChart()` app grew by 0.55 kB gzipped (+3.9 %). The design moves most of that behind the live renderer; the target is at most +0.3 kB for the core imports.
- **No new dependencies.** `packages/terminal` is unaffected.
