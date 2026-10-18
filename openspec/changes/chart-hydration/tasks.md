# Tasks

## 1. Fixes that stand on their own

- [x] 1.1 In `render/string.ts`, write HTML elements inside a `foreignObject` with an end tag, also when they're empty; SVG elements without content stay self-closing. Verify:
  - unit tests for the "An empty label in an HTML page" scenario (markup in a page before a paragraph, parsed with `innerHTML`: the paragraph stays outside the chart) and "XML stays the same" (`DOMParser` as XML gives the same elements as before);
  - the existing `string.spec.ts` and `toScene.spec.ts` tests pass.

  Commit as a `fix:`.

- [x] 1.2 In `render/dom.ts`, let the DOM renderer's cleanup also find Chartist svgs whose `xmlns:ct` is a plain attribute. Verify: a unit test for "Replacing server-rendered markup" (markup parsed with `innerHTML`, then `lineChart()`: one svg). Commit as a `fix:`.

## 2. Hydration markup

- [x] 2.1 Add the two rules to `src/styles/index.scss`:
  - `foreignObject > .ct-label` fills its `foreignObject` (`width: 100%; height: 100%`);
  - the default donut width only for slices `:not([stroke-width])`.

  Verify:
  - a browser test page in the smoke suite with an unstyled label span and slices with and without `stroke-width`, in Chromium, Firefox and WebKit, for "Label box from the foreignObject" and "Donut width from the attribute";
  - the visual tests show no change ("Charts look the same"): the local baseline, and the committed images for examples without 1.x code.

- [x] 2.2 Add `renderForHydration(config, size)` next to `toScene()`, with a doc comment and an example (what the marker records, the root, the scaling `viewBox`, HTML labels by default, no inline styles, that `liveDomRenderer()` takes it over, and when to use `renderToString()` instead). It:
  - lays out as `toScene()` does, with `chart()`'s root size and HTML labels by default;
  - adds the scaling `viewBox` unless the config sets one;
  - writes the marker as JSON with `v: 1`, width, height, labels, text and scale;
  - turns styles into presentation attributes where SVG has them and drops the others;
  - serializes with `renderToString()`'s serializer.

  Verify:
  - unit tests for "Marked root", "The config sets a viewBox", "No style attributes" (line chart, preset config, donut with `donutWidth`) and "The self-contained image is unchanged";
  - the recorded export list in `test/api/` updated.

## 3. Taking markup over in `chart()`

- [x] 3.1 Add `adopt?(scene, svg)` to `Renderer`, returning the output with `repaired`, or nothing; add `'hydrate'` to `RenderCause` and `hydration?: { repaired }` to the `render` and `mount` payloads. Update the doc comments of `Renderer`, `RenderCause` and the payloads. Verify:
  - `pnpm nx typecheck chartist`;
  - type tests in `test/api/` for a renderer with and without `adopt` and a `mount` listener reading `hydration`.
- [x] 3.2 In `chart/chart.ts`, before the first render, look for a direct child svg with `data-ct-hydrate`. With a marker of version 1, a renderer with `adopt`, and a chart that doesn't always draw a new svg:
  - replay the scene with the chart's emitter (the config without responsive overrides, the marker's size and labels, `chart()`'s root size, the scaling `viewBox` when recorded, the text estimate);
  - adopt it;
  - emit `render` and `mount` with the cause `hydrate`, `add` changes for every node and `hydration`.

  An unknown or unreadable marker, a renderer without `adopt` or a declined adoption fall through to the normal first render. A marker it can't read warns. Verify: unit tests with a stub renderer that adopts, for:
  - "Taking server markup over";
  - "A custom renderer without adopt";
  - "A renderer that declines";
  - an unknown marker version;
  - "A converted 1.x plugin", and a 1.x `LineChart` on hydration markup (one new svg, cause `create`).

- [x] 3.3 After adoption, render at the real size with the cause `resize` through the normal path:
  - when the renderer returns `patched` with no changes, keep the new state and output without running cleanups or emitting `render` and `mount`;
  - remove the scaling `viewBox` and the marker with this step.

  Verify: unit tests with a stub patching renderer for one `mount` at equal size, `hydrate` then `resize` at another size, the `viewBox` still present during the `hydrate` mount ("Geometry during the hydrate mount"), and a responsive override applied ("Responsive overrides").

- [x] 3.4 At the start of every render, check whether the previous output's svg is still in the container; if not, warn (what happened, and that a framework should render the server markup into the container once) and render. Verify: a unit test for "A framework writes the markup again" with the DOM renderer and with a stub renderer.

## 4. Adoption in the live renderer

- [x] 4.1 Write the adoption walk in `src/live/`, importing only from `../index`:
  - structure check (names, namespaces, child element counts; text and comments ignored);
  - attribute repair by namespace and local name, moving plain `ct:` attributes into their namespace;
  - removal of attributes the scene lacks, except `class`, `xmlns*` and the marker;
  - every scene style applied with `applyAttribute`;
  - classes and texts;
  - the `repaired` count without styles and without removed presentation attributes whose property is in the element's scene style;
  - a warning naming the first difference when the structure doesn't match.

  Verify: unit tests in jsdom on markup parsed with `innerHTML` for "Attributes from the HTML parser", "An extra attribute", "Styles applied at the takeover", "The same data", "Other values, same structure" and "A point more".

- [x] 4.2 Give `liveDomRenderer()` the `adopt` method and the `adopt` option (default `true`), with doc comments. Verify:
  - unit tests for "Adopting by default", "Opting out" and "The default renderer";
  - "Same elements", "Equal size", "Equal to a fresh chart" (markup compared with a fresh chart's, apart from namespace declarations) and "Updates after taking over" end to end with `lineChart()`, `barChart()` and `pieChart()`;
  - "A tooltip plugin" for mount plugins.
- [x] 4.3 Add the new exports and option to the API recordings and type tests. Verify: `pnpm nx run chartist:test:api --skip-nx-cache` passes with the updated recordings.

## 5. Size

- [ ] 5.1 Measure with `pnpm nx run chartist:test:size`. If the `lineChart` import grew by more than 0.3 kB gzipped over 14.28 kB, move the marker lookup and parsing behind the renderer, as in the design's alternative, and measure again. Then set the budgets a little above the measured sizes, and add an entry for `renderForHydration` (tree-shaken), and for the CSS growth. Verify:
  - the size check passes;
  - the `lineChart` bundle contains none of the adoption code (grep for a name only the walk uses);
  - the measured sizes are in the commit message.

## 6. Browser tests

- [ ] 6.1 Add cases to `test/smoke/csp.test.mjs` whose served HTML contains hydration markup: a line chart with HTML labels taken over with `liveDomRenderer()` at the server's size, and a donut with `donutWidth: 20`, under the `strict` and `trustedTypes` policies. Verify:
  - no violation at all, before and after the takeover ("No violations");
  - label boxes equal to the no-policy run, and the slices' stroke width 20 px, without JavaScript and after the takeover ("Labels and donut width under the policy");
  - `hydration.repaired` 0 ("The same data").
- [ ] 6.2 Add a hydration case to `test/smoke/browser.test.mjs`: served HTML with hydration markup whose `.ct-line` has a 2 s CSS animation from page load, taken over after 500 ms. Verify:
  - the svg and points are the same objects;
  - the animation's `startTime` is unchanged and it isn't restarted ("A load animation");
  - with a dynamic `import()` of the build, no animation frame without the chart ("Lazy Chartist");
  - in a 343 px container with an `aspect-ratio`, the no-JS layout fits without horizontal scroll ("Visible without JavaScript").

  Run `pnpm nx run chartist:test:smoke --skip-nx-cache`.

## 7. Docs

- [ ] 7.1 Add the example `server-rendering/hydrate`: its `index.html` holds the server markup between marker comments, and `main.ts` takes it over with `lineChart()` and `liveDomRenderer()` and updates it with a button. Add a script that writes the markup from `renderForHydration()` of the example's config, and a check in the docs `check` target that fails when the HTML differs from the current build's markup. Verify:
  - the check passes after running the script, and fails after changing the config without running it ("A stale example");
  - the example runs in the playground and keeps the server's svg.
- [ ] 7.2 Rework `server-rendering.mdx`:
  - the two outputs: the self-contained SVG image (`toScene()` + `renderToString()`, inline styles) and the hydration markup (`renderForHydration()`, no inline styles, needs Chartist's stylesheet, passes a strict style policy);
  - say the same in the security and CSP guide.

  Then write its "Taking charts over in the browser" section, with the live example:
  - `renderForHydration()`;
  - `liveDomRenderer()` against the default renderer;
  - the `hydrate` cause and `hydration.repaired`, with a logging snippet;
  - the scaling `viewBox`, and the container's height or `aspect-ratio` plus `svg { display: block }`;
  - the replaced-markup warning;
  - the text estimate;
  - styles from `scene` listeners appearing at the takeover, and classes for what should show before it.

  Verify:
  - `pnpm nx run docs:samples` passes;
  - the page's e2e and axe checks pass (`pnpm nx e2e docs`);
  - screenshots in light and dark mode and at 375 px show no horizontal scroll.

- [ ] 7.3 Write `frameworks.mdx` ("Charts in frameworks", Advanced, after server rendering):
  - the rule;
  - the four recipes from the design, each with its framework's trap (React's `__html` and Strict Mode, Vue's `v-html` string, Angular's sanitizer, `[innerHTML]` and `ngSkipHydration`, Svelte's `{@html}` with the comment about `''`);
  - what wrappers pass to `update()` and what they don't (`plugins`, `on`, `renderer`);
  - a live example of the framework-free lifecycle (create, update through the handle, destroy).

  Fences: `tsx`, `vue`, `svelte`, and `ts nocheck` for Angular. Add the page to the navigation. Verify:
  - the built navigation lists it in Advanced after server rendering;
  - `pnpm nx run docs:samples` and `pnpm nx e2e docs` pass;
  - screenshots in light and dark mode and at 375 px.

- [ ] 7.4 Check that the API reference shows `renderForHydration`, `Renderer.adopt`, the `hydrate` cause, the `hydration` field and the `adopt` option, with their doc comments following `packages/chartist/DOC-COMMENTS.md`. Verify: the generated `api.json` has them, and the reference pages render them.

## 8. Gate

- [ ] 8.1 Run the gate on the branch. Verify:
  - `pnpm nx format:check --all`;
  - `pnpm nx run-many -t lint typecheck test --skip-nx-cache`;
  - `pnpm nx run chartist:test:api --skip-nx-cache` and `pnpm nx run chartist:test:api:v1 --skip-nx-cache`;
  - `pnpm nx run chartist:test:smoke --skip-nx-cache`;
  - `pnpm nx run chartist:test:size`;
  - `pnpm nx run docs:check`;
  - `pnpm nx e2e docs`;
  - the local visual tests, since charts drawn by `chart()` don't change (`pnpm nx run chartist:test:visual:local`).

  All of them pass.
