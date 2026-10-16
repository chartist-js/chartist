# Design

## Context

- **Rendering today.** `chart()` (`chart/chart.ts`) runs `runPipeline()` and then `renderer.render(scene, container)` on every render. The DOM renderer (`render/dom.ts`) builds the whole element tree with `build()`, records node → element in a `WeakMap` for `elementOf`, removes earlier Chartist SVGs (`removePrevious()`) and appends the new one. `PipelineState` already keeps the last scene, so a resize can re-run from `layout`.
- **Keys today.** `assignKeys()` (`scene/tree.ts`) keys nodes with a `seriesIndex` as `layer/series` or `layer/series/value`. Grid lines, axis labels, their `tspan`s and groups have no key: in a line chart, 16 of 59 nodes are keyed. Grid and axis label nodes carry their `axis` and tick `index` (`scales/grid.ts`), and `axis.ticks[index]` is the tick value. Path commands carry the data of their point (`PathCommand.data`), and slices carry `startAngle` and `endAngle`.
- **Listeners.** `render` and `mount` are emitted with `emitter.notify()`, which ignores return values. `install()` returns `void`. `destroy()` removes the output and clears the emitter.
- **Plugins can't change rendering.** `chart()` picks the renderer before plugins install, `ResolvedConfig` doesn't hold it, only `chart()` holds the previous output, and `render`/`mount` are notified, not transformed. A `live()` plugin would need a private hook into the core. The renderer is the public extension point for how a scene becomes output.
- **Extra entry points.** `chartist/compat` (`tsdown.config.ts`) is built in every format and imports only the package root (`../index`), which stays external and points to the matching core build. The core and compat share a few globals (`Symbol.for('chartist.presetState')`). The presets take no `renderer` option; custom renderers go through `lineChartConfig()` and `chart()`.
- **1.x code.** The compat plugin's `mount` listener wraps the new elements for `draw` events (`compat/index.ts`). 1.x `draw` listeners and the four SMIL examples append `<animate>` elements and replay with `update({})`.
- **Size today** (gzipped): `chart` 4.95 kB (budget 5), `lineChart` 13.65 kB (13.7), `pieChart` 9.67 kB (9.75), everything 26.83 kB (26.9). Sketches of this change, measured as their marginal gzip size on `dist/index.min.js`:

  | Part                                    | kB      |
  | --------------------------------------- | ------- |
  | keys and identity                       | 0.36    |
  | diff                                    | 0.34    |
  | patcher                                 | 0.46    |
  | chart wiring (cause, cleanups, changes) | 0.29    |
  | easing sampler                          | 0.66    |
  | SMIL writer                             | 0.77    |
  | built-in keyframes                      | 0.37    |
  | **total**                               | **3.1** |

  That's about 3.5 to 4 kB in production code, which would take `chart` to about 8.7 kB if it were all in the core.

- **What the spikes measured** (Chromium, 60 frames of a sliding window): full rebuild 1.2 ms per frame for 50 points and 10.5 ms for 500; a keyed patch 0.7 ms and 4.2 ms, with the same elements kept. `toScene()` takes 0.8 ms for 100 points, 3 ms for 1,000 and 14 ms for 10,000 (line only).
- **What CSS can't do.** `x1`, `y1`, `x2` and `y2` aren't CSS properties, so CSS transitions can't move points and bars (both `<line>`). The `d` property transitions in Chromium and Firefox but not in Safari.
- **What SMIL can do,** measured the same in Chromium, Firefox and WebKit:
  - Additive `<animate>`, an offset from `previous − next` to 0 over the attribute's final value, with a second update halfway through, drew `x1` at 0, 50, 50 (right after the second update), 150 and 200.
  - `d` animates with SMIL in WebKit, both from/to and additive.
  - Sampling a paused timeline needs a rendered frame after `setCurrentTime()`.
- **What SMIL morphs** (the same three engines, `d` from → to):
  - paths with the same commands interpolate number by number, and absolute and relative commands are normalized;
  - a vertex more, or a line that becomes a curve, doesn't interpolate. Chromium and Firefox switch halfway; WebKit keeps the old path, or draws nothing at all for line → curve;
  - an arc's end point moves along the chord with the radius fixed, so a slice bulges off its circle, and a flipped large-arc flag is handled differently per engine, passing through the center.
- **SMIL easing.** All three engines ignore an animation whose `keySplines` leave 0 to 1, as the SVG spec says. Chartist's exported `easeInBack`, `easeOutBack` and `easeInOutBack` have such values, so `Svg#animate()` with them doesn't animate, in 1.x either.

## Goals / Non-Goals

**Goals:**

- Charts that never update pay at most about 0.5 kB for this change.
- Live updates use public extension points only: a renderer, the renderer contract, and hooks any plugin or layer can use.
- The phases `resolve` to `scene`, layers and renderers stay pure functions of their input. The state between renders lives with the chart, which hosts the pipeline.
- 1.x behavior, and the behavior of v2 code that doesn't opt in, is untouched.

**Non-Goals:**

- Incremental phases (layers computing their output from a data delta). One added value moves every x on a step axis, every y when the scale changes, every slice of a pie and every stacked bar above it, so a delta of one value is a change of most nodes anyway. Every layer, including third-party ones and `compose` listeners, would need an incremental algorithm.
- Reading the DOM to diff. The previous scene says what was rendered.
- Making live updates the default. That's a change of default, for 3.0.

## Decisions

### Live updates are a renderer, in their own entry point

`chartist/live` exports `liveDomRenderer(options?)`, `smilAnimations()` and `diffScenes()`. A chart opts in with `renderer: liveDomRenderer()`, on `chart()` or a preset.

- _Alternative, everything in the core and on by default:_ +3.5 to 4 kB for every chart (`chart` +75%, `lineChart` +27%), for code most charts never run.
- _Alternative, patching in the core and animations separate:_ about +1.5 kB for every chart, for the same reason.
- _Alternative, a `live()` plugin:_ plugins can't make the renderer patch, reach the previous output or change the `render`/`mount` payloads. It would need a private hook, so the plugin architecture wouldn't support it and nobody else could build something similar.
- _Why a renderer:_ "how a scene becomes output" is what renderers decide. The core only has to give renderers the previous render, which is a general improvement: a canvas renderer can use the same contract.
- **The build** follows compat: a `liveBase` entry `src/live/index.ts` in ESM, CJS (+ `d.cts`), declarations, browser ESM importing `./index.min.js`, and UMD extending the global `Chartist`. The entry imports only `../index`. It has no side effects, so it's not listed under `sideEffects`.

### What the core gives renderers

```ts
type RenderCause = 'create' | 'update' | 'resize' | 'responsive' | 'fonts';
interface SceneChange {
  readonly op: 'add' | 'update' | 'remove';
  readonly node: SceneNode; // for 'remove', the node of the previous scene
  readonly previous?: SceneNode; // 'update' only
}
type Keyframes = readonly Readonly<Record<string, AttrValue>>[];
interface RenderUpdate<TOutput> {
  readonly previous: TOutput; // what this renderer returned last time
  readonly previousScene: SceneNode;
  readonly cause: RenderCause;
  readonly labels: readonly unknown[]; // the prepared data's labels
  readonly keyframes: (
    previous: SceneNode,
    next: SceneNode,
    progress: readonly number[]
  ) => Keyframes | undefined;
}
interface Renderer<TOutput> {
  render(
    scene: SceneNode,
    target: Element,
    update?: RenderUpdate<TOutput>
  ): TOutput;
}
interface RenderOutput {
  readonly changes?: readonly SceneChange[]; // with `patched`
  readonly patched?: boolean;
  readonly animation?: UpdateAnimation; // { duration: ms, easing: CSS string }
  /* elementOf, remove as today */
}
```

- **The chart.** `chart()` passes `update` from the second render on, unless the internal replace flag is set (compat, 1.x classes). It keeps the output it got back; renderers keep nothing.
  - When `output.patched` is `true`, it emits `output.changes`; otherwise it builds the replacement changes (`remove` for every previous node, `add` for every new one; a short tree walk).
  - `output.animation` goes into `mount` as `animation`.
- **The keyframes lookup** is built by `chart()`.
  - `compose()` records each layer's top-level nodes and context in the pipeline state (`drawn`). The first time a renderer asks, the lookup builds a node → layer map from them, once per render, so `toScene()` doesn't pay for it. A node a `scene` listener replaced belongs to no layer and only gets keyframes from plugins.
  - It asks the plugins that have `keyframes`, in order, then the layer (with its `LayerContext` from the last run).
  - It's a function, so nothing runs unless a renderer animates.
- **`domRenderer()`** ignores `update`, so its output never has `patched`.
- **Exported from the core for renderers:** `RenderUpdate`, `SceneChange`, `RenderCause`, `UpdateAnimation`, `sampleEasing()`, `keySplinesOf()`, `renderElement(node, document)` and `applyAttribute(element, name, value)`.
  - `renderElement()` is `build()` made public: it's what `domRenderer()` uses, and what `liveDomRenderer()` needs to create added nodes without a second copy (HTML namespace inside `foreignObject`, `style` through `style.cssText` for CSP).
  - `applyAttribute()` is the private `setAttribute()` of `render/dom.ts` made public, for changing kept elements under the same rules.
  - Each of them is something a third-party renderer needs too.
- **No internal shared library.** `index.min.js` and `live.min.js` are separate files, so a module both import at build time would be bundled into both, and a page loading both would get it twice. Shared code goes through the core's exports, as `docs/decisions.md` decided for the `@chartist-js` packages.
- _Alternative, the diff in the core so every renderer gets changes:_ it would put the diff into every bundle. Renderers that patch compute their changes, and `diffScenes()` is there for them.

### Changes, cause and cleanups in the core

- **`render()` in `chart()` takes the cause:** `create` for the first render; `update` from `handle.update()` (which the presets' `update()` and `setOptions()` call); `responsive` from `onResponsiveChange()`; `resize` from the resize observer; `fonts` from `onFontsLoaded()`.
- **The payloads.** `render` and `mount` get `cause`, `previous` (the previous scene) and `changes`. In `mount`, `elementOf(node)` covers removed nodes too: the chart asks the previous output's `elementOf` for nodes of the previous scene.
- **`mount` cleanups.** The emitter's `notify()` returns what the listeners returned.
  - `chart()` keeps the functions among them. It calls them in registration order right before the next `renderer.render()`, and in `destroy()` before `output.remove()`.
  - A cleanup that throws doesn't stop the others; the first error is rethrown after all ran.
- **`install` cleanups.** `installPlugins()` collects what `install` returns. `destroy()` calls the cleanups in reverse order after removing the output, then clears the emitter.
- **`detach()`** runs neither: a detached chart keeps its output and listeners.
- **Types.** `PhaseResult<'mount'>` and `install`'s return type become `unknown`: a returned function is the cleanup, anything else is ignored. `void | (() => void)` would reject `on('mount', () => chart.detach())` and `install: chart => chart.on(…)`, which return the handle, so it would break code that compiles today.
- **1.x replacing.** The compat plugin and `PresetChart` set an internal flag on the handle (a global symbol, like `chartist.presetState`). `chart()` then never passes `update`, so even `liveDomRenderer()` builds a new SVG.
- **Presets.** `renderer` joins the preset options and is passed to `chart()`. It's left out of what `setOptions()` and responsive options can change, like `plugins` and `on`.

### The live renderer

`liveDomRenderer({ key, animations })` wraps `domRenderer()`, which it gets through the public API, for measuring, labels and the first render.

- **First render, or no `update`:** `domRenderer().render()`, returned as is (no `patched`).
- **With `update`:** `diffScenes(update.previousScene, scene, { key, labels: update.labels })`. Then it patches the previous SVG, found with `update.previous.elementOf(update.previousScene)`, and returns `{ svg, elementOf, remove, changes, patched: true, animation }` with a new node → element `WeakMap`. The renderer itself keeps no state, so one instance serves any number of charts.
- **Identity, in `diffScenes()`.** Matching runs per parent, as the DOM is a tree. A node's identity is:
  - a value node (with `seriesIndex` and `valueIndex`): `v:<layer>/<series>/<value key>`. The value key is the index, the label (`labels[valueIndex]`, or `labels[seriesIndex]` for flat pie data), or the `key` function's result, given `{ seriesIndex, valueIndex, value, label, meta }`. The layer comes from the node's pipeline key (`layer/…`);
  - a series node: `s:<layer>/<series>`;
  - a grid line or axis label (`ctx.axis`): `t:<axis id>:<role>:<axis.ticks[index]>`;
  - another node with a key (a plugin's own): `k:<key>`;
  - the rest: `p:<name>.<first class>`.
  - Identities that repeat among siblings get `#2`, `#3` in document order, so repeated labels match in their order.
  - The scene's keys don't change.
- **Changes.** A matched node with another element name is a `remove` and an `add`. An `update` is a node whose classes, attributes or text differ. Every node of an added or removed subtree gets an entry. Entries follow the new scene's document order, and `remove` entries come after their former parent's kept children.
- **Patching** walks the new scene with the changes looked up by node.
  - **Attributes** are set or removed by comparing the previous node's attributes with the new node's, never by reading the DOM; `style` goes through `style.cssText`.
  - **Classes** change through `classList` with the difference between the two nodes, which keeps classes a listener added.
  - **Text** is set on nodes without children.
  - **Added nodes** are built with `renderElement()`, and removed nodes' elements are removed.
  - **Order:** the scene children are put in order by walking from the end, calling `insertBefore()` only for an element that isn't already before its successor. Elements the scene doesn't know (a listener's `title`, an `animate`) stay where they are relative to their previous sibling.
- **Op names.** `add`, `update` and `remove` describe what happens to a node. "Enter" and "exit" are kept for animations (an exit animation would play before a `remove`), as Vue, Svelte and Angular use them.

### Update animations

`smilAnimations()` returns the animation step that `liveDomRenderer()` runs for each `update` change after patching.

- **Configured in CSS.** Duration and easing are presentation, so they're CSS custom properties: `--ct-update-duration` and `--ct-update-easing`. They're read once per render through the DOM renderer's `measureStyle` with the root class. A page can scope them to one chart.
  - _Alternative, a JavaScript option:_ against "what CSS can style isn't a JavaScript option".
- **When it animates.** Only when the duration is above zero, the cause is `update` or `responsive`, and `matchMedia('(prefers-reduced-motion: reduce)')` doesn't match. It checks the media query itself, so charts styled without Chartist's stylesheet respect it too. The resolved `{ duration, easing }` goes back into the output as `animation`.
- **Numbers and paths SMIL can morph.** A changed numeric attribute, or a `d` with the same commands (after normalizing relative ones), gets an additive offset: from `previous − next` to 0, with `additive="sum"`, `begin="indefinite"` started with `beginElement()`, and `fill="remove"`.
  - The attribute already holds the new value, so the drawing ends there whatever happens to the animation.
  - An update during the animation adds a new offset while the running ones keep adding theirs, so it continues from where the element is drawn.
  - A `d` with different commands and no keyframes isn't animated: SMIL can't interpolate it, and WebKit draws nothing while it tries.
- **Easing, technique 1: `keySplines`.** The CSS keywords and `cubic-bezier()` curves within 0 to 1 become `calcMode="spline"`, `keyTimes="0;1"` and `keySplines`: one exact animation per attribute.
- **Easing, technique 2: sampled frames.** Everything else (overshooting `cubic-bezier()`, `linear()`, `steps()`) and every node with keyframes. `sampleEasing()` gives the eased progress points.
  - For numbers and morphable paths, each frame is `previous + (next − previous) × progress`. For keyframes, the renderer calls `update.keyframes(previous, next, progress)`, then the built-in keyframes.
  - Frames go into `values` with uniform `keyTimes` and `calcMode="linear"` (`"discrete"` for `steps()`).
  - Frames that all have the new value's shape (numbers, lines, areas, bands) are written as additive offsets (`frame − next`), so interruptions stay smooth. Other frames (pie slices) are written as they are.
- **`sampleEasing(easing, duration)` and `keySplinesOf(easing)`** live in the core (`svg/animation.ts`), next to `easings`. `keySplinesOf()` gives the `keySplines` of an easing SMIL can express, so `chartist/live` can choose between the two techniques through the public API.
  - `Svg#animate()` uses it for out-of-range `keySplines`, which fixes `easeInBack`, `easeOutBack` and `easeInOutBack`, and for CSS easing strings. A name of `easings` wins, since none of them is CSS.
  - Plugins can use it for their own frames.
  - It's tree-shaken out of charts that use neither `Svg` nor `chartist/live`.
  - 1.x guided mode keeps its behavior otherwise: the attribute is set to `from` first and to `to` on `endEvent`, with `fill="freeze"`.
- **Cleaning up.** Each `animate` it adds has the class `ct-update-animation` and removes itself on `endEvent`. The next patch also removes those of its elements whose end time has passed, in case `endEvent` didn't fire (a hidden tab, a paused timeline).
- _Alternative, a requestAnimationFrame tween in JavaScript:_ state between frames in the renderer, a loop per chart, and interruption that has to read where an element is. SMIL keeps the timing in the document and the renderer stateless.
- _Alternative, CSS transitions:_ they can't move `<line>`s, nor paths in Safari.

### Keyframes

```ts
interface Layer {
  keyframes?(
    previous: SceneNode,
    next: SceneNode,
    context: LayerContext,
    progress: readonly number[] // eased; may go below 0 or above 1
  ): Keyframes | undefined;
}
interface ChartPlugin<TOptions> {
  keyframes?(
    previous: SceneNode,
    next: SceneNode,
    progress: readonly number[]
  ): Keyframes | undefined;
}
```

- **What they return:** one set of attributes per progress point, or `undefined` for the defaults.
- **When they run:** they're called once per animated update, never per frame. SMIL plays the frames.
- **The progress points** come from the renderer, which owns the duration and easing. A layer or plugin only computes the shape at a given progress, overshoot included (`from + (to − from) × 1.1`).
- **Plugins are asked first,** then the layer: it's how `compose` listeners relate to layers.
- _Alternative, a function `progress → attributes` ("tween"):_ it reads as a per-frame callback; an array says what it is.
- _Alternative, a count instead of progress points:_ evenly spaced frames would have to be mapped back to times through the easing, which has no single answer for an easing that overshoots.

**The built-in keyframes ship in `smilAnimations()`,** not in the layers, so the layers stay as small as they are. They're used when the lookup returns nothing, and they read only node contexts:

- **Where number by number is exact.** Bars, points, grid lines, axis labels, target lines and trend lines (`<line>` or boxes). Also a line's path whose identities and value count stay the same: `none`, `simple`, `step` and `cardinal` smoothing make every control point a fixed weighted sum of the vertices; `monotoneCubic`'s slopes aren't linear but stay visually close.
- **Lines, areas and bands following values, when the identities or the number of values change.**
  - From `previous.ctx.path` and `next.ctx.path` (the commands carry their value's data) and the renderer's value keys, the step builds a start position for each new vertex: the previous position of the same key, or the previous position of its nearest kept neighbor, the one before it if there is one.
  - Each frame interpolates the vertices and runs them through the smoothing the path was drawn with. That's a new `PathContext.smoothing` field, a reference to the interpolation function, which costs the core a few bytes. The area's baseline is taken from its path.
  - Every frame has the new path's commands, so it's written as an additive offset.
  - A vertex that left the series leaves its segment at once; animating it out is an exit animation (out of scope).
- **Pie and donut slices and their labels, when their angles change:** interpolate `startAngle` and `endAngle` and draw each frame as an arc from `ctx.center` and `ctx.radius`, in the same command layout the pie layer uses (with `SvgPath`, exported by the core). Labels are placed at the interpolated middle angle.

### Plugins and live updates

Every plugin on the plugins page is a converted 1.x plugin today, and those keep their charts replacing (see "1.x replacing"). Native v2 plugins get the changes, cleanups and kept elements with `liveDomRenderer()`. They can key their own nodes with `node(name, attrs, classes, { key })`, give keyframes, and read the timing:

- `mount` carries `animation` when the render animated, and nothing otherwise, so plugins never animate when the chart doesn't.
  - _Alternative, plugins reading `--ct-update-*` themselves:_ every plugin would redo the cause and reduced-motion checks and could get them wrong.
- HTML elements take the CSS easing as is in the Web Animations API (`element.animate(frames, { duration, easing })`). SVG elements take it in `Svg#animate()`.

### Testing

- **Unit (jsdom), core:**
  - the cause of each kind of render;
  - replacement changes, and `patched` changes passed on;
  - `elementOf` for removed nodes;
  - cleanups (order, once, destroy, detach);
  - the keyframes lookup (plugin order, layer fallback, nodes without a layer, nothing computed without a renderer asking);
  - the `animation` timing passed into `mount`;
  - the presets' `renderer`;
  - the replace flag;
  - `sampleEasing()`;
  - `Svg#animate()` easings.
- **Unit (jsdom), live:**
  - `diffScenes()`: adds, updates, removes, every identity rule, the three `key` modes, repeated identities, a changed element name, document order;
  - patching: identity, kept listener attributes, children and classes, ordering with foreign children;
  - the animations a render adds, read from the DOM;
  - the built-in keyframes.
- **Property test:** a seeded random sequence of updates per chart type, with `liveDomRenderer()`, in the three `key` modes. After each step, the patched SVG's `outerHTML` (without `ct-update-animation` elements) equals a fresh chart's. A seeded generator in the test, no new dependency.
- **Browser (Playwright, Chromium, Firefox and WebKit):** a page that updates a bar chart, a sliding line and a pie with `smilAnimations()` and `--ct-update-duration`, paused with `pauseAnimations()` and sampled with `setCurrentTime()` and a rendered frame. It checks:
  - drawn positions halfway through;
  - an interruption without a jump;
  - a sliding line moving left;
  - pie frames on the arc;
  - an overshooting `cubic-bezier()` passing its target and settling;
  - a path that gains a vertex never drawn empty;
  - `Svg#animate()` with `easeOutBack`;
  - nothing on resize and under emulated reduced motion;
  - a 10 per second stream leaving no ended `animate` elements behind.
- **Builds:** the no-bundler smoke test loads `live.min.js` with `index.min.js`, and `live.umd.js` after `index.umd.js`.
- **Visual tests** stay as they are: examples use `domRenderer()`.

## Risks / Trade-offs

- **Live updates stay opt-in through 2.x.** Charts that don't opt in keep losing hover and plugin state on updates. The guide makes the switch a one-liner and says when it pays off.
- **A patcher bug shows up as wrong output after many updates** → the property test, run on every CI run.
- **Code written for one renderer meets the other.** A `mount` listener that adds DOM listeners on every render adds them again to kept elements once a chart switches to `liveDomRenderer()` → the live updates guide and the plugin guide show acting on `add` entries or returning a cleanup.
- **Elements a listener added can end up out of order** when their neighbors move. They keep their position relative to their previous sibling, which is right for the common cases (children appended to an element, an element appended to a group).
- **Many overlapping animations** when updates come faster than the duration: each one adds `animate` elements per changed attribute, alive until they end (24 per attribute at 60 updates per second and 400 ms). The guide says to keep the duration below the update interval for streaming, and the browser test measures a 10 per second stream.
- **CSS that sets a presentation attribute's property** (e.g. `opacity`) wins over SMIL on that attribute. The animations only touch geometry, which the stylesheet doesn't set.
- **Pie animations restart from the previous shape when interrupted** (see the spec).
- **`renderElement()` and the `update` contract become public API,** so they're final at 2.0. Both are small and follow from what the DOM renderer already does.

## Migration Plan

- It ships in `2.0.0-rc.4`. Nothing changes for existing code.
- The release notes and the live updates guide introduce `chartist/live`.
