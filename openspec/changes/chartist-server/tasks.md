# Tasks

## 0. Before starting

- [x] 0.1 Archive the `chart-hydration` change ("asa"), so its specs are synced and this change's deltas apply to them. Verify: `openspec validate chartist-server --strict` passes and `openspec/specs/chart-hydration/spec.md` exists.

## 1. The entry point

- [x] 1.1 Add `src/server/index.ts`, importing only `../index`, and its builds in `tsdown.config.ts` the way `chartist/live` is built: `dist/server.js`, `.cjs`, `.min.js` (importing `./index.min.js`), `.umd.js` (adding to the global `Chartist`), and declarations for both module systems. Add `./server` to the `exports` map. Verify: `pnpm nx build chartist` writes the files, and none of them contains the pipeline (grep for a name only the pipeline uses).
- [x] 1.2 Move `renderToString` and its spec into `src/server/`, and remove it from `chartist`. Re-export `toScene` and `SceneSize` from `chartist/server`. Mark `renderToString` `@experimental`, and update its doc comment and example to import from `chartist/server`, as well as every doc comment in `packages/chartist` and `packages/terminal` that imports it. Verify: `pnpm nx run-many -t typecheck test -p chartist terminal`.
- [x] 1.3 Move `renderForHydration` into `src/server/`, rebuilt on `toScene()` and the public node methods (design), with the presentation-property list shared in `src/server/`. Mark it `@experimental`. Keep `HYDRATION_ATTRIBUTE` and `chartRootSize` in the core for `chart()`. Verify: the moved `renderForHydration` specs, the core's hydration specs and the live adoption specs pass unchanged, apart from their imports.

## 2. applyStyles

- [x] 2.1 Write the CSS reader: rules, selector lists, declarations with `!important`, `@media (prefers-color-scheme)`, `@layer` read in place, other at-rules and nested rules skipped. Verify: unit tests on Chartist's compiled stylesheet (every rule read, no throw) and on edge cases (comments, strings with `;` and `}`, unknown at-rules).
- [x] 2.2 Write selector matching against the scene tree (type, class, `*`, attribute presence, `=` and `~=`, `:not()`, `:is()`, `:where()`, descendant and child combinators; anything else matches nothing) and specificity. Verify: unit tests, including `:not(:where([stroke-width]))` and "A selector it can't match".
- [x] 2.3 Write the cascade and value resolution: `!important`, the node's own `style`, specificity, order across stylesheets; custom properties inherited through the scene, `var()` with fallbacks and cycles, `light-dark()` by `colorScheme`. Verify: unit tests for "Specificity and order", "Your own custom properties" and "Dark color scheme".
- [x] 2.4 Add `applyStyles(scene, css, options)` to `chartist/server`, with its option type, doc comment and example, marked `@experimental`: presentation attributes on SVG elements, `foreignObject` content left as is, the input scene unchanged. Verify: unit tests for "Chartist's stylesheet on a line chart" (no `var(`, no `light-dark(` in the markup), "Markup in a value", and that the input scene is the same object, unchanged.
- [x] 2.5 Check the output with a rasterizer: add `@resvg/resvg-js` as a test-only dev dependency, render a line chart with SVG labels with and without `applyStyles()`, and sample pixel colors of a line, a point, the grid and a label against Chartist's colors. Record in the design which CSS resvg ignores (custom properties, `light-dark()`, `<style>`). Verify: the test passes with `applyStyles()`, and the unstyled markup draws the line in another color.

## 3. Package surface

- [x] 3.1 Update the export recordings (`test/api/exports/`: a `server` list, `renderToString` gone from `chartist`, the `server` experimental names) and add API tests through the published entry: `chartist/server` in ESM, CJS and UMD, `toScene` the same function as in `chartist`, and type tests for `applyStyles`. Verify: `pnpm nx run chartist:test:api --skip-nx-cache` and `test:api:v1`.
- [x] 3.2 Add smoke tests: the UMD page loads `server.umd.js` after `index.umd.js` and renders a string; the browser ESM page imports from `server.min.js`; the CSP test's hydration page gets its markup through `chartist/server`. Verify: `pnpm nx run chartist:test:smoke --skip-nx-cache`.
- [x] 3.3 Measure with `pnpm nx run chartist:test:size` and set the budgets: `dist/index.min.js` and the UMD build lower (below 2.0.0's 27.62 kB), new entries for `dist/server.min.js`, `import { renderToString }` and `import { applyStyles }` from `chartist/server`, and the renderForHydration entry moved. Verify: the size check passes, and the measured sizes are in the commit message.

## 4. Docs and consumers

- [x] 4.1 Change every import of `renderToString` and `renderForHydration` in `apps/docs` (guides, examples, `lib/og-card.ts`, `lib/board-markup.ts`, the landing's Features section) and in the terminal package's docs to `chartist/server`, and add `chartist/server` to the playground's import map and its types. Verify: `pnpm nx run docs:samples`, `pnpm nx run docs:check` (the server-markup check included), and the examples using it run in the playground.
- [x] 4.2 In the server rendering guide, replace the hand-written `<style>` listener with `applyStyles()` and Chartist's stylesheet read from `chartist/styles.css`; say which color scheme it uses, what CSS it leaves out, to pass only your own stylesheets, to use SVG labels for images, and that the server API is experimental (a warning callout, as on the live updates guide). Verify: `pnpm nx run docs:samples`, the page's e2e checks, and screenshots in light and dark mode and at 375 px.
- [x] 4.3 Check that the API reference lists a `chartist/server` page with `applyStyles`, `renderToString`, `renderForHydration` and the re-exported `toScene`, with experimental badges, and that `chartist`'s page no longer lists `renderToString`. Verify: the generated `api.json` and the built reference pages.

## 5. Release notes and gate

- [x] 5.1 Write the move as `feat(chartist)!:` with a `BREAKING CHANGE:` footer naming the new import path, and check with a dry run that the changelog renders it in its breaking section. Note in the change that the release is a manual run with `2.1.0`. Verify: `pnpm nx release --dry-run` with the specifier `2.1.0` shows the breaking section.
  - Release note: run the release workflow manually with the version `2.1.0`. Without it, the conventional commits ask for a major: a dry run without a version resolves `3.0.0`. With `2.1.0`, the dry run's changelog lists the move under "Breaking Changes".
- [ ] 5.2 Run the gate: `pnpm nx format:check --all`, `pnpm nx run-many -t lint typecheck test --skip-nx-cache`, `chartist:test:api` and `:v1`, `chartist:test:smoke`, `chartist:test:size`, `docs:check`, `pnpm nx e2e docs`, and the visual tests. Verify: all of them pass.
