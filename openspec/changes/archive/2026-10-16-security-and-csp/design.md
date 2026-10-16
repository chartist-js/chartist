# Design

## Context

- **The DOM renderer** (`packages/chartist/src/render/dom.ts`) builds every element anew on each render (`build()`), writing each scene attribute with `setAttribute` (`setAttributeNS` for prefixed names). Updates rebuild; there is no patch path. Its `probe()` (text and style measurement) creates a hidden `svg` with `setAttribute('style', 'position: absolute; visibility: hidden; …')`.
- **Inline styles in the scene** come from the 1.x structure (scene-graph spec, "1.x-equivalent output structure"): the chart `svg`'s size (`presets/preset.ts`), each HTML label's `foreignObject` (`overflow: visible`) and `span` (its size in px, `scales/grid.ts`), and a donut slice's `stroke-width` with `donutWidth` (`layers/pie.ts`).
- **The size probe** in `chart/chart.ts` (`measureSvg()`) sets its width and height with `setAttribute('style', …)`. The responsive probe (`responsive/responsive.ts`) already uses `style.cssText`.
- **1.x helpers:** `createSvg()` and `createLabel()` (`core/creation.ts`) set `style` through `Svg#attr()`, which calls `setAttribute`. `createLabel()` already sizes its `span` through `content.style`. 1.x draw listeners and plugins call `Svg#attr()` too.
- **String output** (`render/string.ts`) escapes values and text with `escapingMap` but writes `current.name` and attribute names as they are.
- **Terminal HTML** (`packages/terminal/src/html.ts`) turns the drawn cells into lines of runs (cells with the same classes), each a `span` with classes or bare text, every character of a label wrapped in `<i>`. `legend.ts` builds its own markup. `charts.ts` picks text or HTML by `format`. The package's `tsconfig.json` has `lib: ["es2023"]`, no DOM.
- **CSP behavior** checked in Chromium: `setAttribute('style', …)` and `style="…"` in parsed markup are blocked under `style-src 'self'` (`style-src-attr`); `element.style.cssText = …` applies with no violation. Trusted Types block assigning a string to `innerHTML`, not `createElement` or `createTextNode`.

## Goals / Non-Goals

**Goals:**

- One place per renderer decides how a style is applied, so new layers can keep putting `style` in the scene and stay CSP-safe.
- The rendered DOM stays what 1.x and the parity suites expect.
- The terminal's element output is the HTML output built another way, not a second renderer that can drift.

**Non-Goals:**

- Removing `style` from the scene (moving label sizes and donut widths to classes or custom properties). That changes the 1.x markup that plugins and the parity suites read.
- Nonce support (`style-src 'nonce-…'`). Chartist adds no style elements, so there is nothing to put a nonce on.

## Decisions

### Styles through `style.cssText`

`build()` applies the `style` attribute with `element.style.cssText = value` and every other attribute as today. `probe()` and `measureSvg()` set their styles the same way, and `Svg#attr()` routes a `style` key through `this._node.style.cssText` (reading `attr('style')` stays `getAttribute`).

- _Why `cssText`:_ one assignment for a whole declaration list, so the scene's string goes in unchanged, and the browser reflects it into the `style` attribute, which keeps `getAttribute('style')`, `outerHTML` and the parity snapshots working.
- _Alternative, setting each property (`style.setProperty`):_ means parsing the declaration string ourselves. No gain over `cssText`.
- _Alternative, classes and custom properties instead of inline styles:_ the cleaner end state, but it changes the 1.x markup (see Non-Goals).
- Elements without a `style` property (none in practice; every `Element` in an HTML or SVG namespace has one) fall back to `setAttribute`, so foreign documents don't throw.

### Name check in `renderToString()`

Element and attribute names must match the XML `Name` production, approximated with a Unicode regex: a letter, `_` or `:` first, then letters, digits, `.`, `-`, `_`, `:` and the combining ranges. A mismatch throws `Chartist: "<name>" is not a valid element name` (or attribute name), in the style of the other `Chartist:` errors. The check runs per node while serializing, so it costs one regex test per name.

- _Why throw instead of skip:_ the DOM renderer throws for the same input, so both renderers agree, and a broken plugin shows up in development instead of silently losing nodes.
- _Why not escape names:_ there is no escaped form of a name; any name with markup characters is invalid.

### Terminal element output from the same runs

`html.ts` splits into a shared step that turns cells into rows of runs (`{ classes, text, label }`) and two writers: the existing string writer, and an element writer that creates the `pre`, `span` and `i` elements and text nodes with `document.createElement` and `createTextNode`, with `\n` text nodes between rows. A test renders a few charts both ways and compares `element.outerHTML` with the string, so the two can't drift.

- `renderToElement(scene, options?: { document?: Document })` is the scene-level function, like `renderToHtml(scene)`.
- The chart functions and `legend()` take `format: 'element'` and an optional `document`. Overloads type the result: `string` for `text` and `html`, `HTMLPreElement` for `element`.
- Without a given document they use `globalThis.document`, and throw `Chartist terminal: format 'element' needs a document` where there is none (Node.js). Text and HTML output still read no globals.
- The package's `tsconfig.json` gains the `dom` lib for the types. The published declarations already reference DOM types through `chartist`'s, so consumers see no new requirement.
- _Alternative, parsing the HTML string with `DOMParser`:_ parsing a string is what Trusted Types restrict (`DOMParser.parseFromString` needs `TrustedHTML` too), so it doesn't solve the problem.

### Tests

- **Unit, `chartist`:** in jsdom, a spy on `Element.prototype.setAttribute` sees no `style` calls while line, bar, pie and donut charts render and update, while the probes measure, and while a 1.x chart with a draw listener calls `attr({ style })`. The rendered `style` attributes still hold the scene's declarations.
- **Unit, names:** invalid element and attribute names throw; `ct:value`, `xmlns:ct`, `foreignObject` and HTML label names pass.
- **Unit, payloads:** one shared list of payloads (`"><img src=x onerror=…>`, `</text><script>…`, `' onload='…`, `&lt;` lookalikes) goes into every data field (labels, series names, `className`, series and value meta, `labelInterpolationFnc` output, target line labels, pie labels, legend names). Each output is parsed (jsdom for the DOM and the strings) and must contain no element or attribute the payload created, and the payload's text must appear as text. In `packages/chartist` for the DOM and `renderToString()`; in `packages/terminal` for HTML, element and legend output.
- **Browser, CSP:** `packages/chartist/test/smoke/csp.test.mjs` uses the smoke test's routing (pages served from a fake origin, the library from `dist/`) and serves pages with a `Content-Security-Policy` header. A module script draws the cases of the "No violations" scenario and records `securitypolicyviolation` events. The test expects none, checks a label's box against a run without the policy, and checks the donut's stroke width. A second page requires Trusted Types and draws an HTML-label chart and a 1.x chart. `packages/terminal/test/smoke/csp.test.mjs` does the same for HTML and element output under `style-src 'self'; font-src data:`, and element output under Trusted Types.
- The build check for `eval`, `new Function` and string timers stays a manual review: a regex over minified bundles would be noisy, and the CSP smoke test catches the effect.

### Docs

- **New guide** `apps/docs/src/content/docs/security-and-csp.mdx`, ordered after "Server rendering". It covers the policy (none beyond `'self'` for the library; `font-src data:` for the terminal stylesheet), what is escaped, `Svg#foreignObject()` strings as raw HTML, plugins as page code, rendering without `innerHTML` (`chart()`, the DOM renderer, the terminal's `format: 'element'`), and Trusted Types. Its live example is a chart with a label payload that shows as text.
- **Server rendering guide:** its browser example switches from `renderToString()` + `innerHTML` to `chart()` (or `domRenderer()` with `toScene()` where the guide's point is the scene).
- **Terminal:** the four examples (`text-art`, `donut`, `target-line`, `stepped-line`) use `format: 'element'` and `replaceChildren()`. The terminal guide and README mention `font-src data:` next to the stylesheet, and the README documents `format: 'element'` and `renderToElement()`.

## Risks / Trade-offs

- [Browsers normalize `cssText`] → A declaration the CSS parser rejects disappears from the attribute, and spacing can differ (`width:100%` becomes `width: 100%;`). The scene's styles are already in normalized form; the parity and markup tests show any difference, and a unitless size (`width: 300`) had no effect before either. Called out in the proposal's breaking changes.
- [jsdom's CSSOM is incomplete] → jsdom drops some properties it doesn't know. The unit tests check the declarations Chartist sets (`width`, `height`, `overflow`, `stroke-width`, `position`, `visibility`), and the browser smoke test covers real behavior.
- [A third-party 1.x plugin calls `setAttribute('style', …)` on a raw node] → Still blocked; the guide says plugins run as page code and must follow the page's policy.
- [The terminal font needs `font-src data:`] → Documented. Shipping the font as a separate file stays an option if a user can't allow `data:`.
- [Overloads on the chart functions] → `format` given as a variable of type `'text' | 'html' | 'element'` resolves to the union return type; documented in the doc comment.

## Migration Plan

Nothing for users: charts render the same markup, and the new output format and function are additions. The terminal package's README and the guide describe `format: 'element'`. Rollback is reverting the commits.
