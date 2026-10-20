## Why

Axis titles are the second most installed kind of Chartist plugin, after tooltips (#27, open since 2014). `chartist-plugin-axistitle` draws them in the 1.x `created` event, so it needs `chartist/compat`, never draws on a server, and makes you guess a `chartPadding` big enough for the title. The author decided on 2026-10-19 that the additions people ask for most go to a new official package, `@chartist-js/essentials`, so the core stays small, and that layers needing room outside the drawing area get it through the public layer API, not through anything internal (#1528, #1529).

This change lays that foundation for 2.2.0: the core's hook for reserving room, the package with its build, tests, styles, docs and release, and its first layer, `axisTitle()`. The other essentials (value labels and the log axis in 2.2.0, the legend and the time axis in 2.3.0) are their own changes and build on this one.

## What Changes

- **Core: `Layer.inset()`,** a new optional layer method. A layer returns the room it needs outside the drawing area, in px per side (`top`, `right`, `bottom`, `left`). The `layout` phase adds the room to the chart's padding before the axes take their offsets, so the area shrinks and the axes and their labels move in with it. Each layer gets the room it reserved as boxes in its compose context (`insetArea`), placed just outside the axes; layers that reserve room on the same side stack outward in list order. It works in `chart()` and the presets' `layers: { below, above }`, with responsive options, `toScene()`, hydration and the terminal renderer. Layers, and so `inset()`, are a functional-API feature: they aren't offered, typed or documented for the 1.x classes. Charts without such a layer, every chart drawn by the 1.x classes included, lay out and render exactly as before.
  - New exported type `InsetContext`; new optional fields `Layout.inset` and `LayerContext.insetArea`.
  - The `layout` listeners see the padding with the room included, as if the chart's padding had been set larger.
- **New package `@chartist-js/essentials`** in `packages/essentials`, built and released like `@chartist-js/terminal`: ESM and CommonJS builds with declarations, `chartist` as its only dependency, a stylesheet (`@chartist-js/essentials/styles.css`) whose looks come from `--ct-*` custom properties, tree-shakeable exports, unit tests from its build, a README test, pack and browser smoke tests, recorded exports and a size budget. Its exports are stable from its first release: none is marked `@experimental`. Released in lockstep with `chartist` from 2.2.0; the author sets up its trusted publisher on npmjs.com before that release.
- **The no-bundler path** is an import map that maps `chartist` to `dist/index.min.js` and `@chartist-js/essentials` to the package's `dist/index.js` on jsDelivr, so both share one copy of Chartist. jsDelivr's `/+esm` rewrites the package's `chartist` import to a URL of its own (`/npm/chartist@2.1.0/+esm` for the terminal package today), which loads a second copy next to the page's; the docs don't show it.
- **First layer: `axisTitle()`,** the v2 successor of `chartist-plugin-axistitle`: one title per layer for the axis with the given id, on any side, with multiple axes, on the presets and in composed charts. It reserves its own room with `inset()`, draws a `text.ct-axis-title` (rotated on the left and right), is placed along the axis with `align`, and is styled with `--ct-axis-title-color` and `--ct-axis-title-size`. It renders on the server, hydrates, and shows in the terminal.
- **`@chartist-js/terminal`** draws text rotated by a quarter turn vertically, one character per row, so vertical titles read in the terminal too.
- **Docs:** a package subsite `/packages/essentials/` (overview with install, the import map and a quick start; an "Axis titles" guide; the API page), a card with a preview in the packages showcase, a news entry on the landing page, a section on `inset()` in the custom layers guide, the playground's import map and types, and a new "Essentials" section in the examples gallery: every essentials example lives in `packages/examples/essentials/<id>` and shows there, starting with this change's two axis title examples and their visual baselines.
- **The axis title plugin leaves the plugins page** with its page and live example, without a redirect: a plugin that an official package replaces leaves the site, unlike `chartist-plugin-targetline`, whose page redirects to the core's guide. Every link to `/plugins/chartist-plugin-axistitle/` (the 0.x redirect table, the e2e tests) points to the axis titles guide instead. The "Coming from 1.x" guide shows a plugin that stays listed for its compat example.

## Breaking changes vs 1.x

None. `inset()` is optional and new; a chart without a layer that reserves room produces the same layout, the same `layout` payload and the same scene, so 1.x code and 1.x plugins see no difference. `chartist-plugin-axistitle` keeps working through `chartist/compat`.

## Out of scope

- The other essentials layers and axes (value labels, log axis, legend, time axis) and `@chartist-js/tooltips`: their own changes.
- Room that depends on the axes' ticks (for example axes sized to their labels, #304): `inset()` runs before the axes are created.
- Wrapping or shortening long titles, titles with several lines, HTML titles in a `foreignObject`, and a chart title or caption layer.
- A Sass build of the package's stylesheet, a UMD build, and a minified browser build of the package.
- Hosting and licensing of paid packages: `essentials` is free (`MIT OR WTFPL`).

## Capabilities

### New Capabilities

- `essentials-package`: the `@chartist-js/essentials` package: exports and builds, tree shaking, server rendering, its stylesheet, the no-bundler import map, tests, size budget, recorded exports, release with a trusted publisher, its docs subsite and showcase entry, and the plugins it replaces leaving the plugins page without a redirect.
- `axis-titles`: the `axisTitle()` layer: options, the room it reserves, placement and rotation per side, several axes and titles, presets, classes, roles and custom properties, server, hydration and terminal output, examples.

### Modified Capabilities

- `chart-composition`: a new requirement, added without changing the existing ones: layers reserve room outside the drawing area with `inset()`.
- `terminal-rendering`: a new requirement: text rotated by a quarter turn is drawn vertically.
- `chart-examples`: a new requirement: an `essentials` type for the examples that use `@chartist-js/essentials`, in their own folder.
- `docs-site`: a new requirement: an "Essentials" section in the examples gallery.

## Impact

- `packages/chartist`: `src/pipeline/types.ts` (`Layer.inset`, `InsetContext`, `Layout.inset`, `LayerContext.insetArea`), `src/pipeline/phases.ts` (layout with insets, the `insetArea` boxes in compose, binding moved before layout), `src/index.ts` (the `InsetContext` type), unit and API tests, `test/api/exports/chartist.json`, type tests, `.size-limit.json` (a small raise for `chart` and the presets, measured), the "Custom layers" guide's doc comment links.
- `packages/essentials` (new): `package.json`, `tsdown.config.ts`, `tsconfig*.json`, `vitest.config.ts`, `src/index.ts`, `src/axisTitle.ts`, `src/styles.css`, tests, smoke tests, `.size-limit.json`, `README.md`, licenses.
- `packages/terminal`: rotated text in `src/draw.ts`, a test.
- `packages/examples`: the `essentials` type in `index.ts` and `scripts/check.ts`, two v2 examples (`essentials/axis-titles`, `essentials/axis-titles-composed`) and a dependency on `@chartist-js/essentials`.
- The visual regression tests, their own package (`packages/visual`) since #1525: `@chartist-js/essentials` as a workspace dependency, and the two baselines under `essentials/`.
- `apps/docs`: `src/content/packages/essentials/`, `src/data/packages.ts`, `src/lib/package-previews.ts`, the news data, TypeDoc options, `integrations/playground-lib.mjs`, `src/scripts/playground-env.ts`, `src/lib/gallery.ts` (the "Essentials" section), `src/data/plugins.ts`, `src/data/plugin-files.json`, the removed `src/examples/plugins/axistitle`, `src/pages/plugins.astro` (description and lead), `src/lib/v0-redirects.ts`, `coming-from-1x.mdx`, `custom-layers.mdx`, `e2e/plugins.spec.ts`, `e2e/plugin-contract.spec.ts`, `package.json` (the plugin out, the package in). No `MOVED_PAGES` entry.
- The old 0.x site: its regenerated redirect pages for the axis title anchors, pushed to its `gh-pages` branch at release time with the author's go.
- `nx.json`: `essentials` joins the release group.
- npm: a trusted publisher for `@chartist-js/essentials` (repository `chartist-js/chartist`, workflow `release.yml`, environment `release`), set up by the author before 2.2.0.
- `docs/decisions.md` at archive: the inset hook and its names, the no-bundler import map, the package's exports stable from 2.2.0, the "Essentials" gallery section, and plugins that an official package replaces leaving the site without a redirect.
- No new runtime dependencies.
