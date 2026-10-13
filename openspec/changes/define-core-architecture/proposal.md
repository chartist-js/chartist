# Proposal

## Why

Chartist 1.x builds, measures and renders in one interleaved pass that writes to the live DOM. This blocks the most-wanted v2 features: compound charts (#37), multiple axes (#1058, #1405), server-side rendering and export (#87, #1424, #1378), layout-aware plugins (legends and axis titles that reserve space), container-query responsiveness and alternative renderers. The v2 core architecture has to be settled before any of that can be built. It also has to keep the zero-breaking-change promise for 1.x users.

## What Changes

- **Functional API.** The v2 API is made of functions: `chart(target, config)` creates a chart and returns a handle (`update`, `destroy`, `on`, `off`). The presets are `lineChart`, `barChart` and `pieChart`. The core is pure from config to scene (`toScene`), so a chart can be built and serialized without a DOM. Docs and examples use only this API.
- **Staged chart pipeline.** Every chart runs through the phases `resolve` → `prepare` → `layout` → `compose` → `scene` → `render` → `mount`. Each phase emits an event that plugins can observe and use to transform the chart. Rendering to an output is the last step.
- **Immutable event payloads.** Handlers receive read-only payloads. They transform the chart by returning a new value; returning nothing leaves it unchanged. Each handler receives the result of the previous one.
- **Scene graph (Chartist virtual DOM).** Chart code builds a tree of plain, immutable scene nodes instead of DOM nodes. Events carry scene nodes. Nodes have semantic roles (point, line, bar, label, …) and a chainable builder API with 1.x `Svg` method names that returns new nodes.
- **Interchangeable renderers.** A renderer turns the scene into output: DOM SVG (the default) or an SVG string (SSR, export, Node). The interface leaves room for canvas and others. Renderers and hosts provide size and text measurement to the layout phase.
- **Composable charts.** One chart combines several layers (line, area, bar, scatter, pie) and several axes in a cartesian or polar coordinate system. That includes left and right Y axes.
- **Presets.** `lineChart`, `barChart` and `pieChart` are presets over the composable chart and take the 1.x options. The 1.x classes `LineChart`, `BarChart` and `PieChart` stay as thin wrappers around them, with an unchanged 1.x API and minimal docs that point to the functions.
- **Responsive options** are evaluated against either window media queries (the 1.x default) or the chart container's size (container queries), switchable by configuration.
- **v1 compatibility plugin (opt-in).** A separate plugin emits the 1.x events (`data`, `optionsChanged`, `draw`, `created`, `animationBegin`, `animationEnd`) with live DOM elements wrapped in the 1.x `Svg` API, and runs 1.x plugins. It keeps the 1.x mutation semantics: 1.x handlers get mutable copies, and the plugin returns them as transformed values. The chart runtime contains no compat code. Without the plugin, using 1.x events or 1.x plugins produces a clear warning that explains how to add it.
- **1.x exports stay.** `Svg`, `SvgList`, `SvgPath`, the helpers and every other 1.x export remain available from `chartist` and the UMD global, as standalone utilities that work without the compat plugin. The compat plugin uses the same `Svg` class.
- **Labels.** Labels can render as SVG `<text>` with layout-computed line wrapping (the default for composable charts) or as HTML in `foreignObject` (the default for presets, matching 1.x).
- **Minimal, explicit breaking changes.** Chart constructors, options, responsive options, methods, output markup and CSS stay 1.x-compatible. Anything else from 1.x is restored by adding one plugin. The 1.x unit tests (with the compat plugin), public API tests against the built package and a visual regression baseline from 1.5 act as the contract.

## Out of scope

- Implementing individual layers and axis types beyond what the presets need, e.g. log or time axes, radar, candlestick, stacked + grouped bars. They build on this architecture in later changes.
- A canvas renderer (the interface must allow it, but it is not built here).
- Keyed diffing/patching and animated transitions between updates. Full re-render stays the default; patching is a later, optional module.
- Official plugins, the web component wrapper, CSS custom-property theming and the docs site.
- A public JSX/`h()` authoring API for scene nodes beyond the builder API exposed in events.

## Breaking changes vs 1.x

Unchanged without any migration: chart constructors and their signatures, options and defaults, responsive options, `update`/`detach`/`on`/`off`, the rendered SVG structure, class names, `ct:` attributes, and the CSS/Sass.

**No 1.x export is removed.** Everything 1.x exports from the package root (and the UMD global `Chartist`) stays exported with its 1.x behavior. That includes `Svg`, `SvgList`, `SvgPath`, `easings`, `Interpolation`, the axis classes, `EventEmitter` and the helper functions (`createSvg`, `createGrid`, `createLabel`, `optionsProvider`, `getMetaData`, `serialize`, `alphaNumerate`, …). Legacy plugins and user code that build their own SVG with `Svg` keep working without the compat plugin. v2 charts no longer use most of these internally. Unused exports are tree-shaken, so they cost nothing in bundles that don't import them.

**BREAKING (restored by adding the compat plugin, a one-line migration):**

- **1.x events.** `data`, `optionsChanged`, `draw`, `created`, `animationBegin` and `animationEnd` are no longer emitted by the core. v2 emits the phase events instead.
- **1.x plugins.** Plain plugin functions written for 1.x run only with the compat plugin.
- **`Svg` in events.** v2 events carry immutable scene nodes, not `Svg` wrappers. The scene node builder uses the 1.x method names, but returns new nodes and has no `parent()`/`root()` navigation. With the compat plugin, 1.x events carry real `Svg` wrappers as before.

**BREAKING (no compat):**

- **Charts don't call the exported helpers.** The helpers and `Svg` stay exported and work as in 1.x, but v2 charts build their output through the pipeline. Code that expected a chart to go through them (for example wrapping or patching `Chartist.createLabel` on the UMD global) has no effect on charts.

Any other difference found by the contract suites is a bug, or must be added to this list before release.

## Capabilities

### New Capabilities

- `chart-pipeline`: the staged chart lifecycle, its phase events, ordering and the ability to transform data, options, layout and scene.
- `scene-graph`: the renderer-independent scene representation, its node structure, roles and builder API.
- `chart-rendering`: the renderer contract, the default DOM SVG renderer, the SVG string renderer, and size/text measurement for layout.
- `chart-composition`: charts made of several layers and axes in cartesian or polar coordinates, and the 1.x chart types as presets.
- `responsive-options`: switching options by window media queries or by chart container size.
- `public-api`: tests that use Chartist only through its published entry points and record its export and type surface.
- `v1-compatibility`: the opt-in compat plugin that restores 1.x events, `Svg` usage and 1.x plugins, and the warnings shown when it is missing.

### Modified Capabilities

None (no existing specs).

## Impact

- `packages/chartist/src`: the core (`charts/BaseChart.ts`, `core/creation.ts`, `core/optionsProvider.ts`, `svg/*`, the three chart implementations) is restructured into pipeline, scene, renderers, layers, axes and presets. The 1.x `Svg`, `SvgList`, creation helpers, `optionsProvider` and `Axis` implementation move unchanged into `src/legacy/` and stay exported.
- New entry points for tree-shaking: core chart, layers, axes, renderers and compat. The bundle size budgets from `add-library-distribution` will be revisited. Some growth is accepted for the scene graph.
- Test suites: the 1.x unit tests stay as the compatibility contract. A new public API suite (`test:api`) tests the built package through its entry points, and its 1.x part must pass against the 1.5 code before core implementation starts. A Playwright visual regression harness (a separate change) must exist before core implementation starts.
- Docs: examples and guides use the functional API only. Guides mention the class API briefly, and the API reference describes each class in one line with an `@see` link to its function. The API reference will document phase events and scene nodes. The 1.x event docs move to a compatibility section, and a migration guide explains when the compat plugin is needed.
