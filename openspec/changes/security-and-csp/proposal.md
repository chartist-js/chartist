## Why

Pages with a strict Content Security Policy (`style-src` without `'unsafe-inline'`) block every `style` attribute a script sets, and Chartist sets them for the chart's size, its HTML labels, donut widths and its measuring probes. Under such a policy a v2 line chart logs 23 violations, its axis labels lose their size (the Y labels sit half a step low and the top one is cut off), and `donutWidth` is ignored. Strict policies are common in banking, government and enterprise apps, and #1430 reported the 1.x half of this. Tracked in #1516.

The same review checked Chartist against XSS and Trusted Types. Data is escaped in every string output, but `renderToString()` writes element and attribute names unchecked, and the docs and the terminal package only offer `innerHTML` to put a string chart into a page.

## What Changes

- **Styles through the CSSOM:** the DOM renderer applies a scene node's `style` attribute with `element.style.cssText`, which a CSP allows, instead of `setAttribute('style', …)`. The same goes for the measuring probes (text, style and size measurement), the 1.x helpers `createSvg()` and `createLabel()`, and the 1.x `Svg#attr()` when it sets `style`. The scene and the rendered markup keep their `style` attributes, as in 1.x.
- **Checked names in string output:** `renderToString()` throws on an element or attribute name that isn't a valid XML name, as the DOM renderer's `createElementNS` and `setAttribute` already do. Values and text stay escaped as today.
- **Terminal element output:** `@chartist-js/terminal` gets `renderToElement(scene)`, and the chart functions and `legend()` take `format: 'element'`. Both return a `pre` element built with DOM methods, the same markup as `format: 'html'`, so a page needs no `innerHTML` and no Trusted Types policy for text art.
- **Tests:**
  - the DOM renderer sets no `style` attribute with `setAttribute`;
  - a browser test draws every chart type, SVG labels, layers, responsive options, updates and the 1.x classes under `style-src 'self'` and expects no violations, for both packages;
  - XSS payloads in every data field (labels, series names, class names, meta, label functions, target labels, pie labels, legends) come out as text in `renderToString()`, the terminal's HTML and element output, and the DOM renderer.
- **Docs:**
  - a new guide, "Security and CSP": the policy Chartist needs (none beyond `'self'` for the library; `font-src data:` for the terminal stylesheet), that data is escaped, that `Svg#foreignObject()` strings are raw HTML, that plugins run as the page's own code, and how to render without `innerHTML`;
  - the server rendering guide shows `chart()` for the browser instead of `renderToString()` with `innerHTML`;
  - the terminal examples use `format: 'element'` instead of `innerHTML`, and the terminal guide mentions `font-src data:`.

## Breaking changes vs 1.x

None. Charts render the same markup: the browser serializes styles set through the CSSOM back into the `style` attribute. A `style` value the browser's CSS parser rejects (an invalid declaration) is now dropped from the attribute instead of kept as text; it had no effect before either. `renderToString()` is new in v2, and the names it now rejects produced broken markup.

## Out of scope

- A named Trusted Types policy (`chartist`) that would let the string outputs return `TrustedHTML`. The element outputs cover the browser; a policy can come later if someone needs strings under Trusted Types.
- Filtering event handler attributes (`onclick`) or `javascript:` URLs that plugins set. Plugins are the page's own code; the guide says so.
- Changing 1.x `Svg#foreignObject()`, which takes a string as HTML by design. The guide says to pass a DOM node instead under Trusted Types.
- The docs site's own CSP headers, and the inline `style` attributes in the examples' `index.html` files (page markup, not library output).
- Plugins outside this repository.

## Capabilities

### New Capabilities

- `security`: what Chartist guarantees under a Content Security Policy and Trusted Types (styles only through the CSSOM, no `eval`, no injected style sheets, no `innerHTML` in the DOM renderer), escaping of data in every output, and checked names in string output.

### Modified Capabilities

- `terminal-rendering`: element output (`renderToElement()`, `format: 'element'`) next to the HTML string.
- `docs-site`: the "Security and CSP" guide joins the guides; the server rendering guide renders in the browser without `innerHTML`.

## Impact

- `packages/chartist`:
  - `src/render/dom.ts` (style attribute, probes), `src/chart/chart.ts` (size probe);
  - `src/render/string.ts` (name check);
  - `src/core/creation.ts` and `src/svg/Svg.ts` (1.x helpers);
  - unit tests next to them, a payload test across the outputs, and a CSP browser test in `test/smoke/`.
- `packages/terminal`: `src/html.ts` (element output sharing the HTML runs), `src/charts.ts` and `src/legend.ts` (`format: 'element'`), `src/index.ts`, the recorded API surface, tests, a CSP smoke test, and the README.
- `apps/docs`: the new guide, the server rendering guide, the terminal guide and the four terminal examples.
- No new runtime dependencies. `packages/terminal` gets `playwright` as a dev dependency, the version `packages/chartist` pins, for its browser test.
