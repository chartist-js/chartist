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

There are two server outputs with different jobs, and this change keeps them apart:

- **A self-contained SVG image** (files, PDFs, email, OG images, a static chart in a page) is `toScene()` + `renderToString()`, as today. It carries its inline styles, since there's often no stylesheet where it ends up.
- **Hydration markup** is a page fragment that the browser takes over. The page loads Chartist's stylesheet anyway, and a strict Content Security Policy blocks inline `style` attributes in markup, so the fragment has none.

## What Changes

- **`renderForHydration(config, size)`:** a new function that returns the markup for a chart the browser takes over. In that markup:
  - the root carries a `data-ct-hydrate` attribute with what the browser needs to build the same scene again: the layout size, the label mode, whether text was estimated, and whether the root got a scaling `viewBox`;
  - the root has the size `chart()` gives it (`100%` unless the config sets one) and, unless the config sets a `viewBox`, a `viewBox` of the layout size, so the chart scales into its container until the browser lays it out at the real size;
  - labels default to HTML, as `chart()` draws them;
  - there are no `style` attributes. Declarations SVG can express as presentation attributes are written as those (`overflow="visible"` on label `foreignObject`s, a donut's `stroke-width`). The label spans' size comes from the stylesheet, and the root's size from its `width` and `height`. The markup passes `style-src 'self'` and looks the same as after the takeover.
- **Stylesheet rules for that markup** in `styles.css`. Both are additive: they change nothing for charts drawn by `chart()`, whose inline styles take precedence.
  - a label span fills its `foreignObject`;
  - the default donut width applies only to slices without a `stroke-width` attribute.
- **Adoption in the live renderer:**
  - `liveDomRenderer()` takes over a marked svg in the chart's container instead of drawing a new one. It binds the scene's nodes to the existing elements and makes them what a fresh render would draw: it sets differing attributes, classes and texts, removes attributes the scene doesn't have, puts `ct:` attributes in their namespace, and applies the scene's styles through the CSSOM.
  - A structure that doesn't match logs a warning, and the chart draws a new svg in its place.
  - `liveDomRenderer({ adopt: false })` opts out.
- **Hydration in `chart()` and the presets:** with a renderer that adopts, they take a marked svg over automatically; there is no new option on `chart()`.
  - `render` and `mount` run once with the new cause `hydrate`, carrying `hydration: { repaired }`, the number of differences from the server's markup.
  - If the container's real size differs, the chart then lays out again as a `resize`, keeping the elements.
  - The marker and the scaling `viewBox` are removed with that layout.
  - With the default `domRenderer()`, and for charts that always draw a new svg (the 1.x classes, charts with converted 1.x plugins), the chart draws a new svg over the server markup, without a warning.
- **A warning when other code replaced the chart's svg:** a framework that writes the server markup into the container again, on every data change, silently breaks live updates. The chart's next render warns and draws a new svg.
- **Fix: closed HTML elements in string output.** `renderToString()` writes empty HTML elements inside a `foreignObject` (an empty label) as `<span …></span>`, not `<span …/>`. The HTML parser ignores `/>` on HTML elements, so the label stayed open and took in the page content after the chart.
- **Fix: replacing server-rendered charts.** The DOM renderer removes a previous Chartist svg that came from parsed HTML too. The HTML parser leaves `xmlns:ct` without its namespace, so such an svg stayed next to the new chart.
- **Docs:**
  - the server rendering guide explains the two outputs and taking a chart over in the browser, with a live example;
  - a new Advanced guide, "Charts in frameworks", gives the rule every framework integration follows, and one recipe each for React, Vue, Angular and Svelte, with their traps;
  - the API reference covers the new function, cause, event field and renderer method.

## Breaking changes vs 1.x

None. 1.x code doesn't render to strings and never meets marked markup. The 1.x classes don't hydrate.

For 2.0 code:

- **`RenderCause` gains `'hydrate'`.** An exhaustive `switch` over it in TypeScript needs a new case. That's accepted for a cleaner event model: hydration is its own kind of render, not a `create` with a flag.
- **`renderToString()` output changes for empty HTML elements** (`<span …></span>` instead of `<span …/>`). It parses the same as XML, and correctly as HTML.
- **A Chartist svg parsed from HTML** in a container is now replaced when a chart draws there, instead of staying next to it.
- **The stylesheet rules** don't change how existing charts render.

## Out of scope

- **Wrapper packages for frameworks.** The guide gives recipes that community wrappers can follow. A Chartist web component, the standing plan for framework support in `docs/decisions.md`, would build on the same contract and stays a separate decision.
- **Hydration for the 1.x stack:** the 1.x classes, and charts with converted 1.x plugins (`fromLegacyPlugin`). They draw a new svg on every render, so they draw one over server markup too.
- **Changing what `chart()` or `renderToString()` draw.** Their markup keeps its inline styles, as the 1.x structure and the security spec require.
- **Replaying a custom server `measureText`** in the browser. The browser replays with the estimate; a different server measurement is repaired or, if it changes the structure, drawn fresh.
- **Guessing the client's width on the server** (client hints, cookies). That's app code.
- **Rendering the scene as framework elements** (a hyperscript adapter). It would lose the live renderer, animations and mount plugins.

## Capabilities

### New Capabilities

- `chart-hydration`:
  - the hydration markup from `renderForHydration()`;
  - adoption by the live renderer;
  - how `chart()` takes server markup over and lays it out at the real size;
  - the fallbacks (no adopting renderer, charts that always replace, a structure that doesn't match);
  - the warning when other code replaced the svg.

### Modified Capabilities

- `chart-rendering`:
  - the DOM renderer replaces Chartist svgs parsed from HTML;
  - `renderToString()` closes empty HTML elements;
  - renderers may adopt server markup (`Renderer.adopt`).
- `chart-pipeline`: the `hydrate` cause and the `hydration` field in `render` and `mount`.
- `chart-theming`: the stylesheet rules that lay out hydration markup without inline styles.
- `live-updates`: `liveDomRenderer()` adopts server markup, and its `adopt` option.
- `security`: hydration markup passes a strict style policy, and so does the chart after taking it over.
- `library-distribution`: size budgets for what hydration adds to the core and to `chartist/live`.
- `docs-site`:
  - the server rendering guide covers the two outputs and taking charts over in the browser;
  - the new "Charts in frameworks" guide in the Advanced group;
  - framework recipes may hand server markup to the framework's raw-HTML feature, the one exception to the `innerHTML` rule for guides.

## Impact

- **`packages/chartist` core:**
  - a new `renderForHydration()` next to `toScene()` and `renderToString()`, with the marker and the style-free markup;
  - `src/chart/chart.ts`: taking marked markup over, the `hydrate` render, the correction as `resize`, the warning;
  - `src/render/types.ts`: `Renderer.adopt`, `RenderCause`;
  - `src/pipeline/types.ts`: the `hydration` field;
  - `src/render/dom.ts`: replacing parsed svgs;
  - `src/render/string.ts`: closing HTML elements;
  - `src/styles/index.scss`: the two rules.
- **`packages/chartist` live entry** (`src/live/`): adoption, and the `adopt` option.
- **Tests:**
  - unit tests;
  - the API recordings and type tests;
  - the CSP and browser smoke tests, with server markup in the served HTML;
  - the size budgets;
  - the visual tests, as proof that the stylesheet rules change nothing for existing charts.
- **`apps/docs`:**
  - the server rendering guide and its new live example;
  - the "Charts in frameworks" guide;
  - the navigation;
  - the API reference.
- **Size:** in the PoC, a `lineChart()` app grew by 0.55 kB gzipped (+3.9 %). The design moves most of that behind the live renderer; the target is at most +0.3 kB for the core imports. `renderForHydration()` is only in server bundles, and the stylesheet grows by a few bytes.
- **No new dependencies.** `packages/terminal` is unaffected.
