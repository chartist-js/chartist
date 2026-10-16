## Why

Every render of a v2 chart builds a new SVG and throws the old one away: an update, a resize, a web font finishing loading or a responsive breakpoint. Elements lose their hover and focus state, what plugins attached to them is gone, and nothing can move from the old values to the new ones. Realtime and dashboard charts are what people asked for most since 2014: #3 (progressive data updates), #120, #754 (streaming with a sliding window), #607, #877, #839 and #709 (animating from one state to the next). v2's scene can be matched node by node between two renders. Plugins have no cleanup either (#961), which a chart that keeps its elements makes urgent.

Being the smallest charting library is one of Chartist's strongest points, and most charts render once and never update. Measured against today's bundle, patching and update animations would add about 3.5 to 4 kB gzipped, nearly doubling `chart()` (4.95 kB). So live updates are opt-in, in their own entry point, and the core only learns to give a renderer the previous render.

rc.4 is the last release candidate with features, and after 2.0 only additive changes can follow. The renderer contract, the plugin lifecycle and the cleanup hook change together, so the plugin contract changes once.

## What Changes

- **`chartist/live`:** a new entry point, built like `chartist/compat` (ESM, CJS, browser ESM and UMD, without a second copy of the core):
  - `liveDomRenderer(options?)`: the DOM renderer that keeps its SVG and patches it on every later render. Elements of nodes that stay are kept, with only the attributes, classes and text that changed set; new nodes are created, gone ones removed, and what plugins added to elements stays. The patched SVG equals a fresh render of the same input.
  - Its `key` option says what identifies a value across updates: its index (the default), its label (`key: 'label'`, for sliding windows) or a function of the value. Grid lines and axis labels are matched by axis and tick value, groups by layer and class.
  - `smilAnimations()`, passed as `liveDomRenderer({ animations: smilAnimations() })`: SMIL update animations, the easing support and the built-in keyframes for lines, areas, bands and pie slices. It's separate so charts that patch without animating don't carry it.
  - `diffScenes()`, the keyed diff, for other renderers that want to patch.
- **The renderer contract (core):** from a chart's second render on, `Renderer.render(scene, target, update)` gets the previous output, the previous scene, the render's `cause` (`update`, `resize`, `responsive`, `fonts`), the data's labels and a `keyframes` lookup. A renderer that patched returns its `changes` and `patched: true`; it can return the `animation` timing it used. Renderers stay stateless; the chart keeps what they return. `domRenderer()` ignores `update` and replaces its SVG, as today.
- **Changes and cause in `render` and `mount` (core):** every render's events get `cause` (`create` for the first render) and `changes` (each node `add`, `update` with its previous node, or `remove`). With a renderer that patched, they're its changes; otherwise they describe the replacement (every previous node removed, every new one added).
- **Update animations** (with `smilAnimations()`): when a page sets `--ct-update-duration` (and optionally `--ct-update-easing`), updated attributes move from their previous to their new values with SMIL `<animate>`. Attributes always hold the final values, and the animations are additive offsets on top of them, so an update during an animation continues smoothly from where the elements are. Points and bars (`<line>`), paths and labels animate in every browser, Safari included. Only `update` and `responsive` renders animate, never under `prefers-reduced-motion: reduce`. Without a duration in the CSS they take 300 ms with `ease-out`; `--ct-update-duration: 0s` turns them off.
- **Every CSS easing:** `--ct-update-easing` takes the CSS keywords, any `cubic-bezier()` including overshooting ones, `linear()` and `steps()`. Easings SMIL can express run as `keySplines`; the others are sampled into keyframes, because SMIL ignores an animation whose `keySplines` leave 0 to 1. The sampler is a core export, `sampleEasing()`, which `Svg#animate()` and plugins use too.
- **Keyframes (core hooks):** a layer and a v2 plugin may give the keyframes of an updated node (`keyframes(previous, next, …, progress)`, one set of attributes per progress point the renderer chooses), for what SMIL can't morph: it only interpolates paths with the same commands, number by number, and moves arcs along their chord. Plugins are asked first, then the node's layer; `smilAnimations()` brings the built-in keyframes for sliding lines and turning slices.
- **Animation timing for plugins:** `mount` carries the render's `animation` (`duration` and a CSS `easing`) when it animates, so plugins animate what they draw in step with the chart and respect reduced motion. `Svg#animate()` takes CSS easing strings, so that timing can be passed on as is.
- **Overshooting easings in `Svg#animate()`:** the exported `easeInBack`, `easeOutBack` and `easeInOutBack` never animated, in 1.x either, since browsers ignore out-of-range `keySplines`. They're drawn with sampled keyframes now.
- **Cleanup for plugins (#961, core):** `install()` may return a function that `destroy()` runs. A `mount` listener may return a function that runs before the next render touches the output, and on `destroy()`.
- **A `renderer` option on the presets (core):** `lineChart()`, `barChart()` and `pieChart()` take a renderer, as `chart()` does, so presets can use `liveDomRenderer()`.
- **The 1.x classes and the compat plugin always replace the SVG,** even with `liveDomRenderer()`, because 1.x `draw` listeners and plugins expect new elements.
- **The render lifecycle in words:** the phase docs, the `Renderer` doc comments and the guides say when elements are created, kept and removed, and what `render` and `mount` listeners may expect.
- **Docs:**
  - The examples gallery gets a "Live data" section: a sensor with a sliding window, a dashboard, a network speed stream, a seismograph, an animated pie and gauge, and bars that switch between grouped and stacked with new data in one update.
  - "Updating charts" becomes "Live updates" (`/docs/live-updates/`, with the old URL redirecting): `liveDomRenderer()`, keys and the `key` option, `cause` and the changes, cleanup functions, a chart fed with new values every second as its first example, and a dashboard with update animations.
  - The animations guide gets a section on update animations.
  - The events and plugins guide documents cleanup, the changes and `cause`, and writing plugins for live updates, with a small v2 tooltip plugin on a streaming chart.
  - The plugins page says that converted 1.x plugins keep a chart from updating live.

## Breaking changes vs 1.x

None. Charts draw a new SVG on every render unless they use `liveDomRenderer()`, and the 1.x classes and compat always do. One fix changes what 1.x code shows: animations with `easeInBack`, `easeOutBack` or `easeInOutBack` now run, where browsers ignored them before.

For v2 code from earlier release candidates, nothing changes either: `mount` listeners, custom renderers and `domRenderer()` behave as before. `render` and `mount` payloads gain fields, `install` and `mount` listeners may return a function, and renderers get a third argument they may ignore.

## Out of scope

- **Live updates by default.** They stay opt-in for 2.x; making them the default would be a change of default, for 3.0.
- **Exit animations,** which need removed elements to stay until their animation ends. The `remove` changes in `mount` allow a plugin to do it, and `smilAnimations()` can add it later without breaking anything.
- **Enter animations in the core.** CSS covers them for new elements with `@starting-style`, and plugins can animate the changes' added elements.
- **Incremental phases.** Layers stay pure functions of their full input. The pipeline takes 3 ms for 1,000 points, and the DOM is what patching saves.
- **Series identity from series names,** so that removing a series keeps the others' elements. Series are matched by index, as their `ct-series-<letter>` classes are.
- **Live updates for the 1.x classes, for converted 1.x plugins, and for string or terminal output.** Every plugin on the plugins page today is a 1.x plugin run through `fromLegacyPlugin` and compat. Native v2 versions of the popular ones (tooltips, legend, axis titles) are where most users will feel live updates; they're additive and can come in 2.x.
- **Animated `resize` renders.**
- **A helper to filter the changes.** `changes.filter(change => change.op === 'add' && change.node.role === 'bar')` reads well enough.

## Capabilities

### New Capabilities

- `live-updates`: the `chartist/live` entry point: `liveDomRenderer()` patching the SVG from one render to the next, keys from the data, `diffScenes()`, update animations with `smilAnimations()` and the built-in keyframes.

### Modified Capabilities

- `chart-pipeline`: `render` and `mount` carry the changes and the cause; `mount` listeners and `install` may return cleanup functions; layers and plugins may give keyframes; `mount` carries the animation timing.
- `chart-rendering`: renderers get the previous render as an optional third argument and may return their changes; `sampleEasing()` is exported.
- `chart-composition`: `destroy()` runs the cleanup functions; the presets take a `renderer`.
- `v1-compatibility`: the 1.x classes and the compat plugin replace the SVG on every render, whatever the renderer; `Svg#animate()` runs easings that overshoot and takes CSS easing strings.
- `library-distribution`: the `chartist/live` entry point in every format, in the exports map, and with size budgets.
- `chart-examples`: a `live` type for examples that update while they run, with seeded data so their screenshots stay the same.
- `docs-site`: the "Updating charts" guide becomes "Live updates" and the gallery gets a "Live data" section; the plugin guide covers plugins for live updates, and the plugins page notes that converted plugins keep charts from updating live.

## Impact

- `packages/chartist` core:
  - `src/render/types.ts` (the `update` argument, `changes`, `patched`, `animation` on the output);
  - `src/chart/chart.ts`, `src/chart/plugins.ts`, `src/chart/types.ts`, `src/pipeline/emitter.ts` and `src/pipeline/types.ts` (cause, changes in the payloads, cleanups, the keyframes lookup, the timing in `mount`);
  - `src/pipeline/phases.ts` (which layer drew which node), the `Layer` and `ChartPlugin` types (`keyframes`), `PathContext` (the smoothing it was drawn with);
  - the presets (`renderer`), `src/compat/index.ts` and `src/charts/PresetChart.ts` (always replacing);
  - `src/svg/animation.ts` (`sampleEasing()`, overshooting and CSS easings in `Svg#animate()`).
- `packages/chartist` live entry: `src/live/` (`liveDomRenderer()`, identity and `diffScenes()`, patching, `smilAnimations()` and the built-in keyframes), the build config (`tsdown.config.ts`), the exports map, the size budgets, and the smoke tests.
- Tests: unit tests, the API recordings and type tests for both entries, a property test that a patched chart equals a fresh one, and browser tests for patching and SMIL.
- `apps/docs`: the "Live updates" guide and its examples, the redirect from `/docs/updating-charts/`, the animations, events and plugins guides, and the plugins page.
- Size: about +0.5 kB gzipped for the core imports, measured from sketches; `chartist/live` about 1.5 kB, and about 2.2 kB more with `smilAnimations()`. No new dependencies. `packages/terminal` is unaffected.
