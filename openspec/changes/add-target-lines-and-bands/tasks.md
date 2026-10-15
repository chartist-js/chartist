# Tasks

## 1. Shared path code and roles

- [x] 1.1 Move the projection and interpolation of `layers/line.ts` into an internal helper (`layers/path.ts`) that returns a series' interpolated path, and use it in the line layer. Verify: `pnpm nx test chartist --skip-nx-cache` and `pnpm nx run chartist:test:visual:local` pass unchanged
- [x] 1.2 Add a path reversal for the band's lower edge (reverse the elements, swap cubic control points). Verify: unit tests that a reversed path traces the same points backward for `none()`, `simple()`, `monotoneCubic()`, `cardinal()` and `step()`
- [x] 1.3 Add the `targetLine`, `targetLabel` and `band` roles with their context and attribute types to `scene/roles.ts`, with doc comments per `DOC-COMMENTS.md`. Verify: type tests that `node.role === 'band'` narrows `ctx` to the band context, in the v2 type contract tests

## 2. Layer refinement

- [x] 2.1 Restructure `compose()` in `pipeline/phases.ts`: compose and key all layers first, then one walk that runs the refiners and fires the `compose` events. Verify: a test pinning the event order (layer by layer, children first), and `pnpm nx test chartist --skip-nx-cache` plus `pnpm nx run chartist:test:visual:local` unchanged
- [x] 2.2 Add the optional `refine(node, context)` to `Layer` with a doc comment and an example: called per node with a role from all layers, in list order, with the refining layer's own context; return value merged via the node mapping, no dropping. Skip the refiner calls when no layer has `refine`. Verify: unit tests for each scenario of the "Layer refinement" requirement and the "Listeners see refined nodes" scenario, plus a type test that returning `null` from `refine` is a type error

## 3. `targetLine()` layer

- [ ] 3.1 Add a composition test that a layer's `extent` widens an axis outside its binding and that `series: []` keeps the layer from shaping ranges. Verify: the test passes
- [ ] 3.2 Implement `layers/targetLine.ts`: one-line and `lines` forms, `axis` (default first Y axis, unknown id throws), horizontal and vertical lines, labels as SVG text at the end or start, classes, `extent`, skip values outside the range, `cartesian` only. Verify: unit tests for each scenario of the "Target line layer" requirement, plus giving both `value` and `lines` throws
- [ ] 3.3 Export `targetLine` and its option types from `layers/index.ts` and the root entry. Verify: `test/api/exports/chartist.json` and the type list updated, `pnpm nx run chartist:test:api` passes

## 4. `band()` layer

- [ ] 4.1 Implement `layers/band.ts`: `low`/`high` as numbers or series, `series` groups with per-index min/max, the layer's `series` selection and `extent`, `lineSmooth` and `align`, splitting at holes, `className`, `cartesian` only, and an error without edges. Verify: unit tests for each scenario of the "Band layer" requirement except marking, and that a smooth band's upper edge equals the line layer's path for the same series
- [ ] 4.2 Add `mark: true` to the band: a `refine` that classes points and bars `ct-in-band` or `ct-out-band` from the band's edges at each value index (value dimension for horizontal bars, holes left alone), defined only when `mark` is set. Verify: unit tests for the marking scenarios, with the band listed before and after the marked layer, and for horizontal bars
- [ ] 4.3 Export `band` and its option types. Verify: export and type lists updated, `pnpm nx run chartist:test:api` passes

## 5. Preset `layers` option

- [ ] 5.1 Add `PresetLayers` and the `layers` option to `lineChart`, `barChart` and `pieChart` (and their `*Config` builders), placing `below` after the grid and `above` before the labels. Verify: unit tests for the "Extra layers on presets" scenarios, including a responsive entry that adds a target line, and the existing preset tests and visual tests unchanged

## 6. Styles

- [ ] 6.1 Add the target line, label and band classes and custom properties to `_settings.scss` and `index.scss`, and the three classes to `ct-chart-series-color`. Verify: a test of the compiled CSS for the properties and the series selectors; Playwright screenshots of both layers in light and dark mode, checked by looking, with the defaults tuned there; delete the ad-hoc script afterwards

## 7. Terminal

- [ ] 7.1 Fill the `band` role in `packages/terminal/src/draw.ts` like areas, and check how target lines and labels come out by their elements. Verify: unit tests for the "Target lines and bands" terminal scenarios on plain-text output

## 8. Examples and docs

- [ ] 8.1 Add the gallery examples `composed/target-line` and `composed/band-chart` to `packages/examples` and the manifest. Verify: `pnpm nx run-many -t typecheck -p examples`, and the examples render in the playground
- [ ] 8.2 Write `apps/docs/src/content/docs/target-lines-and-bands.mdx` per `apps/docs/WRITING.md` (preset target line, band chart with hidden edge series, marking values in and out of the band with one CSS rule each, constant bands, several lines, the note for users of the plugin), with its live examples, and add it to the docs navigation. Verify: `pnpm nx run docs:samples`, and screenshots in light, dark and at 375 px without horizontal scroll
- [ ] 8.3 Add the layers to the composed charts page's table, and a sentence with a link about `layers` to the line and bar chart pages. Verify: `pnpm nx run docs:check`
- [ ] 8.4 Rework the terminal plugin guide's example: `targetLine()` from the core for the line, the plugin circles the points above it; update `apps/docs/src/content/packages/terminal/plugins.mdx`'s text and the example's alt label. Verify: the page's live example renders, and `pnpm nx e2e docs` passes for the page

## 9. Remove the target line plugin

- [ ] 9.1 Remove `chartist-plugin-targetline` from `src/data/plugins.ts`, `plugin-files.json`, `facts.json`, the contract case and script map in `e2e/plugin-contract.spec.ts`, `src/examples/plugins/targetline/` (a deletion-only commit), and `apps/docs/package.json` with `pnpm install`. Verify: `grep -rn targetline apps/docs` finds only the redirect and the guide, and the plugins page shows 11 tiles
- [ ] 9.2 Redirect `/plugins/chartist-plugin-targetline/` to `/docs/target-lines-and-bands/`, respecting `base`, out of the sitemap and search. Verify: an e2e test that the old URL lands on the guide, and the built `sitemap` doesn't list it

## 10. Gate and baselines

- [ ] 10.1 Run the gate: `pnpm nx run-many -t lint typecheck test build --skip-nx-cache`, `pnpm nx format:check --all`, `pnpm nx e2e docs`, `pnpm nx run chartist:test:visual:local`. Verify: all pass
- [ ] 10.2 Record the visual baselines of the two new gallery examples on the visual reference platform (the author's WSL host or CI), not in the dev container. Verify: the committed images show both charts as checked in the screenshots of 6.1
