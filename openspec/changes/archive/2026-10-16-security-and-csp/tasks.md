# Tasks

## 1. Styles through the CSSOM in `chartist`

- [x] 1.1 Add a unit test helper that spies on `Element.prototype.setAttribute` (and `setAttributeNS`) in jsdom and records `style` calls, and a first test that fails today: a line chart with HTML labels, a donut with `donutWidth` and an updated chart set no `style` attribute. Verify: the test runs and fails on the current code
- [x] 1.2 In `render/dom.ts`, apply the `style` attribute in `build()` with `element.style.cssText`, falling back to `setAttribute` for elements without `style`; set the probe's styles in `probe()` the same way. Verify: the test from 1.1 passes for the DOM renderer, and a test that the rendered `svg`, label `foreignObject`, label `span` and donut slice still carry their declarations in `getAttribute('style')`
- [x] 1.3 In `chart/chart.ts`, set the size probe's width and height in `measureSvg()` through `style`. Verify: the size measurement tests still pass, and the spy sees no `style` call while a chart without fixed size measures its container
- [x] 1.4 In `svg/Svg.ts`, route a `style` key in `attr()` through `style.cssText` (getter unchanged); this covers `createSvg()` and `createLabel()` in `core/creation.ts`. Verify: a 1.x `LineChart` with a draw listener calling `element.attr({ style: 'opacity: 0.5' })` sets no `style` attribute through the spy and ends with `opacity: 0.5` in the element's style
- [x] 1.5 Run the parity and markup suites and the visual tests. Verify: `pnpm nx test chartist --skip-nx-cache`, `pnpm nx run chartist:test:api --skip-nx-cache` and `pnpm nx run chartist:test:visual:local` pass with no snapshot changes

## 2. Checked names in `renderToString()`

- [x] 2.1 Add the XML name check to `render/string.ts` for element and attribute names, throwing `Chartist: "<name>" is not a valid element name` (or attribute name). Verify: unit tests for the "Checked names in string output" scenarios, plus that `ct:value`, `ct:meta`, `xmlns:ct`, `foreignObject` with HTML label children and every preset's output still serialize unchanged (existing string tests pass)

## 3. Payload tests

- [x] 3.1 Add a shared payload list and a test in `packages/chartist` that puts each payload into labels, series names, `className`, series and value meta, `labelInterpolationFnc` output, target line labels and pie labels, renders with `chart()` in jsdom and with `renderToString()` (parsed back with jsdom), and asserts that no element or attribute comes from a payload and the payload text is present. Verify: the test passes (it documents today's escaping; it fails if a value is written unescaped)

## 4. Terminal element output

- [x] 4.1 Add the `dom` lib to `packages/terminal/tsconfig.json`. Verify: `pnpm nx typecheck terminal` passes
- [x] 4.2 Split `html.ts` into a step that turns drawn cells into rows of runs and a string writer, with no change to `renderToHtml()` output. Verify: the existing HTML tests pass unchanged
- [x] 4.3 Add the element writer and `renderToElement(scene, { document })`, building `pre`, `span`, `i` and text nodes with DOM methods and throwing `Chartist terminal: format 'element' needs a document` without one. Verify: tests (jsdom) that for a line, a stacked bar and a donut chart `renderToElement(scene).outerHTML` equals `renderToHtml(scene)`, that a `<b>` label is text, and that a call without a document in Node.js throws
- [x] 4.4 Add `format: 'element'` and `document` to the chart functions and `legend()`, with overloads returning `HTMLPreElement` for `element` and `string` otherwise, and doc comments with an example per `DOC-COMMENTS.md`. Verify: type tests for the overloads, and unit tests for the "Element format" and "Legend as an element" scenarios
- [x] 4.5 Export `renderToElement` and its option type from `src/index.ts` and update the recorded API surface. Verify: `pnpm nx test terminal --skip-nx-cache` passes, including the entry and API tests
- [x] 4.6 Add the terminal payloads test: the shared payload list through HTML, element and legend output (labels, series names, pie labels). Verify: the test passes

## 5. Browser CSP tests

- [x] 5.1 Add `packages/chartist/test/smoke/csp.test.mjs`, reusing the smoke test's origin routing: a page with `default-src 'self'; style-src 'self'` that draws the cases of the "No violations" scenario and records `securitypolicyviolation` events, a label box and donut stroke width compared with the same page without the policy, and a page with `require-trusted-types-for 'script'` drawing an HTML-label chart and a 1.x chart. Add it to the `test:smoke` inputs if needed. Verify: `pnpm nx run chartist:test:smoke --skip-nx-cache` passes, and fails when 1.2 is reverted
- [x] 5.2 Add `playwright` (the version `packages/chartist` pins) as a dev dependency of `packages/terminal` and `packages/terminal/test/smoke/csp.test.mjs`: HTML and element output under `default-src 'self'; style-src 'self'; font-src data:` with no violations and the cell font loaded, and element output under Trusted Types. Wire it into the terminal's `test:smoke` target and its inputs. Verify: `pnpm nx run terminal:test:smoke --skip-nx-cache` passes

## 6. Docs

- [x] 6.1 Switch the terminal examples (`text-art`, `donut`, `target-line`, `stepped-line`) to `format: 'element'` and `replaceChildren()`. Verify: the example pages and their playground runs show the same text art (screenshots light, dark and at 390 px), and `pnpm nx run docs:samples` passes
- [x] 6.2 Change the server rendering guide's browser example (`examples/server-rendering/to-string` and its text in `server-rendering.mdx`) so the browser draws with `chart()` or `domRenderer()` instead of `renderToString()` with `innerHTML`, keeping the Node.js part with `renderToString()`. Verify: the page's live example runs, and `grep -rn innerHTML apps/docs/src/examples apps/docs/src/content` finds no chart output inserted that way
- [x] 6.3 Write the "Security and CSP" guide (`apps/docs/src/content/docs/security-and-csp.mdx`, after "Server rendering") per `apps/docs/WRITING.md`: the policy, escaping, `Svg#foreignObject()` strings, plugins as page code, rendering without `innerHTML`, Trusted Types, the terminal font, with a live example that shows a payload label as text. Verify: the page builds, appears in the sidebar and search, its example runs, and `pnpm nx e2e docs` passes
- [x] 6.4 Mention `font-src data:` in the terminal guide next to the stylesheet, and document `format: 'element'` and `renderToElement()` in the terminal README and guide (browser snippets marked so the README test type-checks them without running them in Node.js). Verify: `pnpm nx test terminal --skip-nx-cache` (README test) and `pnpm nx run docs:samples` pass
- [x] 6.5 Look at the changed pages. Verify: Playwright screenshots of the new guide, the server rendering guide and one terminal example in light and dark mode and at 390 px, with no horizontal scroll

## 7. Gate

- [x] 7.1 Run the full gate. Verify: `pnpm nx run-many -t lint,typecheck,test,build --skip-nx-cache`, `pnpm nx run-many -t test:smoke --skip-nx-cache`, `pnpm nx run chartist:test:api --skip-nx-cache`, `pnpm nx format:check --all` and `pnpm nx e2e docs` pass
