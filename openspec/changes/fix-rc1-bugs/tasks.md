# Tasks

## 1. Issues on GitHub (each step with the author's go)

- [x] 1.1 Show the author the three new issue drafts in `issues.md`, and open them as he approves. Record their numbers in `issues.md`. Verify: `gh issue view <n>` shows each, posted under his account, with no AI traces
- [ ] 1.2 With his go, close #903, #1075 and #1424 as duplicates with the comments in `issues.md`. Verify: each is closed as a duplicate, linked to its issue

## 2. Pie and donut

- [ ] 2.1 `extend` replaces a non-object target with `{}` before merging an object, and uses `Array.isArray` (#842, #903, #876). The pie default `chartPadding` becomes an object of 5s. Verify: a new `extend.spec.ts` (object over number, number over object, an array from `vm`, no prototype pollution); API tests for an object padding on a pie (class and function) and a responsive object padding over a number, v2-only where 1.5.0 throws
- [ ] 2.2 Draw a full-circle slice as two half-circle arcs (#1302). Update the ported `PieChart.spec.ts` assertions and the single-value parity fixtures, with the reason in the parity spec's exceptions. Verify: `pie.spec.ts` checks the ring's centre within 0.01 px at start angles 34, 120 and 150; `pnpm nx run chartist:test --skip-nx-cache`
- [ ] 2.3 Add `measureStyle` to renderers, implement it in `domRenderer` with the text probe, pass it through `chart()` and the pipeline, and lay out donuts for the measured width unless `donutWidth` is set (#1493). Update the `donutWidth` doc comment, "Pie and donut charts" and "Styling with CSS" (server rendering needs `donutWidth`). Verify: `pie.spec.ts` with a stub returning `20px`, `chart.spec.ts` for the pass-through and the jsdom fallback, and a Playwright check of a donut with `--ct-donut-width: 20px` touching the edge
- [ ] 2.4 Series names a to z with cycling colours and the fallback to the repeated series' property, in the Sass loop and the compiled CSS (#1456). Raise the CSS budget to 1.8 kB. Update "Styling with CSS" (property names, cycling, the Sass list lengths). Verify: a CSS test that `dist/index.css` has `.ct-series-p` to `.ct-series-z` with the fallbacks, a Sass compile with 3 names and 2 colours, a Playwright check of a 16-slice donut following `--ct-series-a`, `pnpm nx run chartist:test:size`

## 3. Lines and axes

- [x] 3.1 Monotone cubic interpolation breaks only where x repeats or changes direction (#1038, #1075); update its doc comment. Verify: interpolation spec cases for descending x (one connected path, same curve as the sorted data) and a zigzag (breaks), plus an API test with `reverseData` on an auto X axis
- [x] 3.2 `step()` and `simple()` test holes with `getMultiValue` (#1040). Verify: both interpolation specs with `{ x, y: null }` holes give gaps and no `NaN`, on an auto scale X axis too
- [x] 3.3 Run the empty-range repair again after chart-level `low`/`high`, in `barChart` and compat; harden `rho`/`gcd` against non-finite input (#1057). Verify: the issue's options render with both APIs; math spec cases for `rho(NaN)` and `gcd` with non-finite input
- [x] 3.4 Test the next tick by index in `Axis.ts` and `grid.ts` (#1471). Verify: grid and Axis spec cases with `ticks: [0, 10, 20, 30]` over data from 10 to 30 give the label "0" its step's width
- [x] 3.5 Apply a line chart's top-level `referenceValue` to its default Y axis, with `axisY.referenceValue` winning (the new issue). Verify: `lineChart.spec.ts` and an API test (v2-only; 1.5.0 ignores it)

## 4. Lifecycle and environment

- [x] 4.1 Use the container's document and window: `Svg` node checks, responsive media queries, the `ResizeObserver`s, the 1.x classes' resize listener, `createLabel` (#1492). Verify: a Node-environment API test with JSDOM and no globals (`new Svg`, `lineChart` with compat emitting `draw`, `new LineChart` rendering and detaching), and a browser check of media queries in an iframe
- [x] 4.2 Make `detach()` during the first render stick in `chart()`, the presets and `PresetChart` (#929). Verify: `chart.spec.ts` (a detaching `mount` listener leaves no observer and ignores font events), a preset or compat spec (a converted plugin detaching in `created` doesn't throw), and an API test for the class (no render after window and container resize), branched for the v1 target
- [x] 4.3 Schedule the 1.x classes' first render after the target check (the new issue). Verify: in `test/api/charts.api.ts`, running the timers after the missing-target throw throws nothing on the local target
- [x] 4.4 Give the SVG a `viewBox` of its layout size from `beforeprint` to `afterprint`, unless the config sets one; remove the listeners on detach (#118). Verify: `chart.spec.ts` dispatching the events (set, removed, left alone, detached), and a Playwright check that the SVG has the `viewBox` while `page.pdf()` prints. One manual print preview in Chrome, Firefox and Safari is listed for the author

## 5. SVG

- [x] 5.1 Fix `SvgPath`: rounding with `accuracy: 0` and `false`, `splitByCommand`, `join`, `parse` (tokenizer, H/V/Q/S/T), arc `scale`/`translate` (#1491). Update the ported spec that relied on `accuracy: 0` not rounding. Verify: `SvgPath.spec.ts` cases for each, and the line and area paths of the examples unchanged (`pnpm nx run chartist:test:visual:local` shows no new diffs)
- [x] 5.2 Stop setting `xmlns` on HTML label spans in `grid.ts` and `Svg.foreignObject`; the DOM parity comparison ignores `xmlns` attributes (#1217). Update `dom.spec.ts`. Verify: a test that a DOM-rendered chart serialized with `XMLSerializer` parses as SVG, for the class and the function

## 6. Docs and records

- [ ] 6.1 Fix the three docs statements (the new docs issue): "Coming from 1.x" and the class doc comment on resizing, the axes guide on `low`/`high`, the server rendering guide on `labels`. Verify: `pnpm nx run docs:samples`; the pages read correctly
- [ ] 6.2 Add the corrections to "Coming from 1.x" (the list of 1.x behaviors v2 corrects), and to `docs/decisions.md` where a decision changed (the CSS budget). Verify: the list matches the `v1-compatibility` requirement; docs e2e passes

## 7. Integration

- [ ] 7.1 Run the full gate: `pnpm nx run-many -t lint check test build --skip-nx-cache`, `pnpm nx format:check --all`, `chartist:test:api:v1`, the docs and playground e2e suites, and the visual local check. Verify: all pass, with only the two known `line/timeseries` diffs in the visual check
- [ ] 7.2 Reproduce each issue's original report against a packed tarball of the branch, as in the triage. Verify: each reproduction from the triage notes now gives the corrected result

## Workflow follow-up

- Commits reference the issues they fix ("Fixes #842"), so they close when the pull request is merged; the duplicates are already closed in 1.2.
- After "asa": push the branch and open a pull request in the author's voice; release as 2.0.0-rc.2 together with the 1.x deprecations, after the merge.
