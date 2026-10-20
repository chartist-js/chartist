# Tasks

## 0. Before starting

- [x] 0.1 Check that `add-essentials-package` is applied (the `packages/essentials` project builds and tests, has a stylesheet and a docs section, and the gallery has its "Essentials" section with the `essentials` example type). Verify: `pnpm nx run-many -t build test -p essentials` passes.

## 1. Core: annotating layers and the bar context

- [x] 1.1 Add the optional `annotate(drawn, context)` method to `Layer` in `packages/chartist/src/pipeline/types.ts`, with a doc comment and example per `packages/chartist/DOC-COMMENTS.md`: when it runs, what it gets, that its nodes are keyed, refined and emitted, that annotating layers don't see each other, and that their `compose` events come last. Verify: `pnpm nx typecheck chartist`.
- [x] 1.2 Implement it in `compose()` in `src/pipeline/phases.ts`: run non-annotating layers as today, then each annotating layer on their finished top-level nodes, and assemble the result and `drawn` in list order; charts without an annotating layer take the current path. Verify: unit tests in `src/pipeline/` for each scenario of "Annotating layers" (the chart-composition delta), including that a chart without one has an identical scene.
- [x] 1.3 Add `horizontal` and `stacked` to `BarContext` (`src/scene/roles.ts`, doc comments) and set them in `src/layers/bar.ts`. Verify: `bar.spec.ts` cases for vertical, horizontal, `accumulate`, `accumulate-relative` and `overlap`, and the existing bar visual and parity tests unchanged.
- [x] 1.4 Update the recorded public API (`test/api/`: type tests for `annotate` and the new context fields) and the size budgets if needed. Verify: `pnpm nx run chartist:test:api --skip-nx-cache` and `pnpm nx run chartist:test:size`.
- [x] 1.5 Add a section on `annotate` to the "Custom layers" guide in `apps/docs`, with a short example that labels another layer's bars, next to the `refine` section. Verify: `pnpm nx run docs:samples`.

## 2. The value labels layer

- [x] 2.1 Add `packages/essentials/src/valueLabels.ts`: the options and context types, validation at creation, the `valueLabel` role declared with module augmentation, and the layer (`series: []`, `coordinates: ['cartesian']`, `compose` returning `[]`, `annotate` collecting `point` and `bar` nodes, and line path elements for series without points). Export it and its types from the package entry. Verify: `pnpm nx typecheck essentials`, and unit tests for "The value labels layer" and "What the layer labels".
- [x] 2.2 Implement text and `format` as the tooltips do (value along the value axis through `Intl.NumberFormat` with `locale` and `numberFormat`, 0 labeled, holes skipped, `format(item)` with the tooltip item's fields and `context` typed by role, `undefined` keeping the default text, `null`/`''` skipped, `\n` as stacked `tspan`s). Verify: unit tests for each scenario of "Label text and format", including the meta case from Discussion #1401.
- [x] 2.3 Implement point and bar positions with measured text and `textAscent`, the default offsets and the stacked default. Verify: unit tests of the scene with fixed metrics for every position on vertical, horizontal, negative and stacked bars and on points.
- [x] 2.4 Implement `overflow: 'fit'` (inside labels that don't fit, the chart area grown by the padding as bounds, `end` turning `inside-end`) and `overflow: 'show'`. Verify: unit tests for each scenario of "Labels that don't fit".
- [x] 2.5 Implement the HTML mode (`foreignObject` sized to the measured text, `span` with the classes) and the classes (series class from the series group, `inside`, `classNames`). Verify: unit tests for "Label modes" and "Value label classes and styles", and the `valueLabel` nodes' context and keys.
- [x] 2.6 Add the styles to the essentials stylesheet: `.ct-value-label` (fill and color from `--ct-value-label-color`, following a dark color scheme like the core's labels; font size from `--ct-value-label-size`) and `.ct-value-label-inside`. Verify: the package's style build, and a test that the compiled CSS has the three custom properties.
- [x] 2.7 Test live updates with `liveDomRenderer()`: a changed value keeps its label element with new text and position; `key: 'label'` keeps the labels of labels that stay. Verify: a test in the essentials package against the built `chartist/live`.
- [x] 2.8 Test the server and the terminal: `renderToString(toScene(...))` has the labels; `applyStyles()` with the essentials CSS gives them `fill` and `font-size`; `@chartist-js/terminal` (dev dependency) writes the values next to the bars. Verify: those tests pass from the package's build.
- [x] 2.9 Add a `valueLabels()` example to the package README and the export list, as the essentials change set up for its other exports. Verify: the package's README and export tests.

## 3. Examples and visual tests

- [x] 3.1 Add three examples in `packages/examples/essentials/`, with manifest entries (`v2: true`): `value-labels-bars` (bar labels on a simple and a negative bar chart); `value-labels-stacked` (a stacked horizontal bar chart with meta text, as in Discussion #1401); `value-labels-line` (a line chart with a unit and `--ct-value-label-color: var(--ct-color)`). Verify: `pnpm nx check examples` and `pnpm nx typecheck examples`, and the built gallery lists them in the "Essentials" section.
- [x] 3.2 Check the examples in the container with the visual tests' local target (their own package since #1525), then record their baselines on the reference platform (the author's WSL host or CI). Verify: screenshots in light and dark mode and at 375 px show readable labels, none clipped; the baselines are committed from the reference platform.

## 4. Docs

- [x] 4.1 Write the "Value labels" guide in the essentials docs (voice per `apps/docs/WRITING.md`): the three examples live, positions, `format` with meta, fitting and how to make room (axis `high`, padding), styling with the custom properties, HTML labels, server and terminal, and moving from `chartist-plugin-pointlabels` and `-barlabels` (option by option). Verify: `pnpm nx run docs:samples`, `pnpm nx e2e docs`, screenshots in light and dark mode and at 375 px without horizontal scroll.
- [x] 4.2 Check that the essentials API page lists `valueLabels`, `ValueLabelsOptions` and `ValueLabelItem`, and the core API page `annotate` and the bar context fields. Verify: the generated API data and the built pages.
- [x] 4.3 Remove `chartist-plugin-pointlabels` and `chartist-plugin-barlabels` from the site, without a redirect: their entries in `apps/docs/src/data/plugins.ts`, their files in `plugin-files.json`, the docs app's dev dependencies and `src/examples/plugins/pointlabels` and `barlabels`; no `MOVED_PAGES` entry. Repoint every link to their pages: the 0.x redirect table's anchors `point-label-plugin` and `example-plugin-pointlabel` (`src/lib/v0-redirects.ts`) to `packages/essentials/value-labels/`; `e2e/plugins.spec.ts` (the tile preview test and the playground link test) and `e2e/release.spec.ts` (the pinned version on a plugin page) to another listed plugin; `e2e/plugin-contract.spec.ts` without their cases. Drop labels from the plugins page's description and lead if an earlier change hasn't. Keep the deletions in their own commit. Verify: `pnpm nx run docs:check`, `pnpm nx run docs:v0-redirects`, `pnpm nx e2e docs`, no `dist/plugins/chartist-plugin-pointlabels/` or `-barlabels/`, and `grep -rE 'plugins/chartist-plugin-(pointlabels|barlabels)' apps/docs/src apps/docs/e2e apps/docs/dist` finds nothing.
- [x] 4.4 Note for the author, at the release: the regenerated 0.x redirect pages (task 4.3) go to the old site's `gh-pages` branch in a push that needs the author's go. Verify: the author has the note; nothing is pushed without their go.

## 5. Specs, decisions and gate

- [x] 5.1 Record in `docs/decisions.md` under "Layers": annotating layers (why not `refine` or recomputing), and value labels' SVG default and fitting rules. Verify: the entry names its reasons.
- [x] 5.2 Run the gate: `pnpm nx format:check --all`, `pnpm nx run-many -t lint typecheck test --skip-nx-cache`, `chartist:test:api`, `chartist:test:size`, `docs:check`, `pnpm nx e2e docs`, and the visual tests. Verify: all pass.
