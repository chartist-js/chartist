# Design

## Context

1.x (`packages/chartist/src`) works like this:

- `BaseChart` defers the first draw with `setTimeout(0)`, so listeners can be registered right after construction.
- It listens to `window` resize and evaluates responsive options with `window.matchMedia` (`core/optionsProvider.ts`).
- Each chart type (`LineChart.ts`, `BarChart.ts`, `PieChart.ts`, ~500–600 lines each) calls `createSvg()`, which **attaches the `<svg>` to the container first**. Then it measures `clientWidth`/`clientHeight`, builds axes, and creates every element with `new Svg(...)`, which immediately creates and appends a DOM node.
- `draw` events are emitted synchronously right after each element is created, with `element`/`group` as `Svg` wrappers around **live, attached** DOM nodes.
- Axis labels are HTML `<span>`s in `foreignObject` with inline `style`. Their alignment depends on flexbox rules in `styles/index.scss`.

Building, measuring and rendering are therefore one interleaved pass bound to the DOM. That rules out SSR, other renderers, layout-aware plugins and composition. Motivation: see `proposal.md`. Requirements: see `specs/`.

## Goals / Non-Goals

**Goals:**

- Separate data, layout, scene building and rendering into explicit phases with events, so plugins can act at every stage.
- Make the scene (virtual DOM) the single source of truth for every renderer.
- Express 1.x charts as presets over a composable chart and keep 1.x behavior byte-for-byte where tests observe it.
- Keep all compatibility code out of the core: it ships only with the opt-in compat plugin.

**Non-Goals:**

- Diff/patch rendering and animated data transitions (a later, optional module).
- Shipping new layer or axis types beyond what the presets need.
- A public JSX/`h()` authoring API.

## Decisions

### D1 Pipeline phases and the event model

```
 resolve --> prepare --> layout --> compose --> scene --> render --> mount
 options     data         size,      per-node    whole     renderer   live output
 + resp.     normalize    axes,      events      tree      output     (DOM refs)
                          chart rect
```

- Each phase emits one event (`compose` emits one per node). Listeners run synchronously in registration order.
- **Payloads are read-only; listeners transform by returning** (author decision, 2026-10-13):
  - A listener returns a new payload value to transform the phase, or `undefined` to leave it unchanged.
  - The emitter passes each listener's result to the next listener; the last result is the phase output.
  - Observe-only listeners allocate nothing. Transforms copy only what they change and share the rest (structural sharing).
  - Immutability is enforced by `Readonly` types. Payloads are frozen in our tests, not in production, because deep freezing costs time on large data sets. Mutating a payload in plain JS is unsupported.
  - `render` and `mount` are observe-only: their output already exists, so return values are ignored.

  ```ts
  c.on('prepare', ({ data }) => ({
    data: { ...data, series: data.series.slice(0, 3) }
  }));
  c.on('compose', node =>
    node.role === 'point' ? node.addClass('ct-point--x') : undefined
  );
  ```

- Events go through the existing `EventEmitter` (`event/EventEmitter.ts`), extended to chain return values. `on`/`off`/`'*'` keep working; `'*'` listeners only observe.
- **Phase names differ from the 1.x event names** (`data`, `optionsChanged`, `draw`, `created`), so v2 and legacy events can coexist on the same emitter without ambiguity.
- _Alternatives considered:_
  - Mutable payloads, as in 1.x's `data` event. No copies, but plugins can corrupt shared state, and the core can't be pure. Replaced by the return-value model; 1.x mutation semantics live in compat (D6).
  - Separate transform hooks next to `on()`. Rejected: a second API. Return values give the same result through `on()`.

### D2 Scene nodes: plain data plus a thin builder

```
SceneNode {
  name: 'g' | 'path' | 'line' | 'text' | 'foreignObject' | ...
  attrs: Record<string, string | number>
  classes: string[]
  children: SceneNode[]
  text?: string
  key?: string            // layer/series/value derived (scene-graph spec)
  role?: 'point' | 'line' | 'area' | 'bar' | 'slice' | 'grid' | 'label' | ...
  ctx?: { seriesIndex, valueIndex, value, meta, axes, ... }   // never rendered
  ref?: unknown           // renderer-bound output (e.g. DOM element), see D6
}
```

- **Nodes are immutable.** The builder methods (`attr`, `addClass`, `removeClass`, `append`, `remove`, `replace`, `text`, `empty`) keep the 1.x `Svg` method names but **return a new node** instead of mutating. Chains like `node.addClass('a').attr({ r: 8 })` read the same as in 1.x.
- A `compose` listener returns the new node to replace the composed one, or `null` to drop it. The phase splices the result into the tree.
- **No `parent()`/`root()`.** Back-references don't work with immutable trees that share subtrees. Tree work happens in the `scene` event through free functions: `mapNodes(scene, fn)` (returns a new tree, unchanged subtrees shared) and `findAll(scene, { role, seriesIndex, ... })`.
- `elem(name, attrs, className)` becomes the free function `node(name, attrs, className)` for creating nodes.
- Methods live on a small prototype, not on every node object. Nodes are created through one factory, so the shared prototype stays an internal detail.
- `ref` is the one exception to immutability: renderers and compat bind output to it (D6). It is never part of a node's value.
- The scene is the public payload of `compose` and `scene` events. The size cost (D9) is accepted.
- _Alternatives considered:_
  - Internal-only scene with only the `Svg` handle exposed. Rejected: plugins could not work renderer-independently.
  - An HTM/JSX-style `h()` API. Deferred: the builder is enough for now, and `h()` can be added later on top of the same node format.

### D3 Renderer and host contracts

```
Renderer {
  render(scene, target): Output        // mount or produce output
  measureText?(text, classes, maxWidth): { width, height, lines? }
}
Host {                                 // where size comes from
  size(): { width, height }
  observe(cb): unobserve               // ResizeObserver / none
}
```

- The **DOM renderer** creates SVG elements from the scene and fills `node.ref` with each element for `mount`. Text measurement uses an offscreen SVG `<text>` in the same document, so CSS fonts apply.
- The **string renderer** serializes the scene. Text measurement uses an average-glyph-width estimate driven by font size. It never touches globals.
- The **DOM host** uses `ResizeObserver` on the container. This replaces the `window` resize listener; container size changes also cover window resizes. A **static host** returns the explicit width and height.
- _Alternatives considered:_ keeping the `window` resize listener. Rejected: it misses container changes (tabs, sidebars, #119, #287) and re-renders charts whose size didn't change.

### D4 Composition model

```
Chart {
  coordinates: 'cartesian' | 'polar'
  axes:   [{ id: 'x', side: 'bottom', type: StepAxis },
           { id: 'y', side: 'left',   type: AutoScaleAxis },
           { id: 'y2', side: 'right', type: AutoScaleAxis }]
  layers: [{ type: BarLayer,  series, x: 'x', y: 'y'  },
           { type: LineLayer, series, x: 'x', y: 'y2' }]
}
```

- Layers and axis types are passed in as imported values, not looked up by string. That makes them tree-shakable (chart-composition spec).
- Layout reserves space for all axes per side, then computes one shared chart area. Each axis computes its range from the layers bound to it.
- Polar charts have no cartesian axes. `PieLayer` uses center and radius from layout.
- **Presets** are thin functions (`lineChart`, `barChart`, `pieChart`, D10). They translate 1.x options (`axisX`, `axisY`, `stackBars`, `horizontalBars`, `donut`, …) into a `Chart` configuration with one layer and the 1.x axis setup, and they import only that layer.
- _Alternatives considered:_ keeping three monolithic chart classes and adding a "combined" chart. Rejected: it duplicates axis and layout code and doesn't scale to multi-axis.

### D5 Responsive options

- Responsive options and their merge order are unchanged.
- A `responsive: 'window' | 'container'` option selects the evaluator. `window` uses `matchMedia` as in 1.x and stays the default.
- `container` evaluates a small parser for the supported size features against `Host.size()`.
- JavaScript cannot read CSS `@container` rules, so container mode is a JS evaluation of the same syntax. Pure-CSS styling with `@container` still works independently.

### D6 v1 compatibility: opt-in plugin, eager DOM at the compose boundary

```
 v2 phases ... compose(node) -------------------------------> scene --> render (DOM) --> mount
                   |                                                       ^
                   | compat plugin installed?                              |
                   v                                                       |
          create live DOM for node (attached to the live <svg>),           |
          bind node.ref = element, wrap in 1.x Svg,                        |
          emit legacy 'draw' (element/group live)          DOM renderer adopts bound refs,
          mark node "dom-owned" when legacy code touched it   never rewrites dom-owned nodes
```

- 1.x `draw` handlers receive elements that are already in the document (see Context). Only creating real DOM at that moment reproduces this exactly: `getBBox`, `getNode`, SMIL `beginElement`, DOM listeners.
- **Adopt, don't duplicate.** Scene nodes stay in the tree with `ref` bound, and the DOM renderer adopts them. v2 listeners in phases before `compose` still apply.
- **Opt-in plugin** (author decision, 2026-10-12): users add `compat` to `plugins`. The core contains no compat code (v1-compatibility spec).
  - `compat` is a regular v2 plugin (`{ name, install }`). Its `install` registers listeners on the v2 phases and emits the legacy events from them:
    - `optionsChanged` in `resolve`;
    - `data` in `prepare`;
    - `draw` in `compose`, after creating the live DOM;
    - `created` after `mount`, with the live `svg` wrapper;
    - `animationBegin`/`animationEnd` from the SMIL helpers in its `Svg`.
  - The core needs two small extension points:
    - the DOM renderer adopts pre-bound `node.ref` elements;
    - a plugin can claim plain-function plugins, which compat uses to run 1.x plugins.
- **What stays in the core** is detection only: a list of the six legacy event names checked in `on()`, and the "plugin is a plain function" check. These produce the one-time warnings. That's a few hundred bytes. Eager DOM creation and legacy emission live in compat. `Svg`/`SvgList` stay exported from the package (D11), but the chart runtime doesn't use them.
- **Shared `Svg` class.** Compat does not ship its own `Svg`. It uses the `Svg` class from the legacy surface (D11), so `new Svg(...)` created by user code can be passed to `element.replace(...)` in a draw handler, and `instanceof Svg` holds.
- **Packaging:**
  - ESM/CJS: subpath export `chartist/compat`, versioned with the core.
  - Browser: a separate `dist/compat.umd.js` that attaches `Chartist.compat` to the existing UMD global.
  - No separate npm package is needed, because compat is tightly coupled to core internals.
- **1.x mutation semantics.** 1.x `data` and `optionsChanged` handlers mutate their payload. Compat gives them a mutable copy and returns that copy as the transformed value of the v2 phase (D1). `draw` handlers act on the live DOM; compat returns the node with `ref` bound and marks it dom-owned.
- The 1.x first-render deferral (`setTimeout(0)`) is kept only in the class wrappers (D10), because 1.x code registers `on()` listeners after construction. The functional API renders synchronously, because listeners and plugins are passed at creation.
- _Alternatives considered:_
  - Pure `Svg` facade over scene nodes (no DOM). Rejected: it breaks handlers that measure or touch DOM.
  - Automatic activation bundled with the presets. Rejected by the author: it adds compat code to every preset user's bundle and hides that 1.x APIs are legacy. The explicit plugin plus warnings makes the migration a deliberate one-line step.

### D7 Labels

- **Composable charts** default to SVG `text` with layout-time wrapping into `tspan` lines via `Renderer.measureText`. Browsers don't implement SVG 2 `inline-size`, so wrapping must be computed.
- **Presets** keep 1.x HTML labels (`foreignObject` + `span`), because user CSS and the 1.x flexbox alignment depend on them.
- The inline `style` on `foreignObject` (a CSP issue, #1430) moves to attributes and classes where the output stays identical. Where it can't, it stays as it is and becomes a tracked theming follow-up.

### D8 Contract suites before implementation

Three suites form the contract. The 1.x parts are recorded against **unchanged 1.5 code** before core work starts:

- **1.x unit tests** stay as they are. Their DOM-structure assertions become the scene-graph output contract.
- **Visual regression baseline** (Playwright), recorded from 1.5 (done: `add-visual-regression-harness`). It reuses the example definitions shared with the docs.
- **Public API tests** (author decision, 2026-10-13; `public-api` spec). They test the package only through its entry points, resolved to the built package, so internal refactoring can't hide an API break:
  - **Export surface:** runtime export names per entry point, compared against checked-in lists. 1.5 names may never disappear, and ESM, CJS and the UMD global must match.
  - **Type surface:** type tests (Vitest `expectTypeOf` in typecheck mode) compiled against the built `.d.ts` files.
  - **Behavior:** the documented 1.x API (constructors, `update`/`detach`/`on`/`off`, plugins, responsive options, `Svg`, `SvgList`, `SvgPath`, `Interpolation`, axis classes, helpers) in jsdom, plus the UMD global in a browser. v2 functions are added by the change that introduces them.
  - Lives in `packages/chartist/test/api/` as its own target (`test:api`) that depends on `build`, like `test:smoke`. Unlike the 1.x unit tests, these tests don't change when internals move (e.g. to `src/legacy/`).

### D9 Size

The scene objects, builder prototype and pipeline add code. It is offset by:

- the chart runtime no longer using `Svg`/`SvgList`, eager DOM creation or legacy event emission. `Svg` stays exported (D11) but is tree-shaken when not imported; eager DOM and legacy emission move to the opt-in compat plugin;
- sharing axis and layout code across layers;
- tree-shaking.

Per-entry budgets are re-baselined in the implementation change. A noticeable increase for the pipeline is accepted (author decision, 2026-10-12).

### D10 Functional API first, classes as wrappers

Author decision, 2026-10-13.

```ts
import {
  chart,
  line,
  bar,
  stepAxis,
  autoScaleAxis,
  lineChart,
  toScene,
  renderToString
} from 'chartist';

const c = chart('#el', {
  data,
  axes: {
    x: stepAxis(),
    y: autoScaleAxis(),
    y2: autoScaleAxis({ side: 'right' })
  },
  layers: [bar({ y: 'y' }), line({ series: [2], y: 'y2' })],
  plugins: [tooltip()],
  on: { scene: scene => /* ... */ undefined }
});
c.update({ data: nextData });
c.on('compose', fn);
c.off('compose', fn);
c.destroy();

lineChart('#el', data, options, responsiveOptions); // preset, 1.x options
renderToString(toScene(config, { width: 400, height: 300 })); // pure, no DOM
```

- **`chart(target, config)`** is the composable chart. It returns a handle `{ update, destroy, on, off }`. The handle holds the lifecycle state (host, current scene, listeners); "functional" means factories, plain data and pure phases, not stateless.
- **Pure core.** `toScene(config, { width, height, measureText? })` runs `resolve` → `scene` without side effects and returns the scene. `chart()` is `toScene` plus a host (size, resize) and a renderer (`render`, `mount`). Tests and SSR use `toScene` directly.
- **Factories for everything configurable.** Layers (`line()`, `bar()`, `pie()`), axes (`stepAxis()`, `autoScaleAxis()`, …), renderers and plugins (`tooltip()` returns `{ name, install }`). They are tree-shakable imports, which also replaces the class-valued `type` fields sketched in D4.
- **Listeners at creation.** `config.on` and `config.plugins` are registered before the first render. That's why the functional API renders synchronously (D6), without 1.x's `setTimeout(0)`.
- **Class wrappers.** `LineChart`, `BarChart`, `PieChart` and `BaseChart` stay in the core with their 1.x signatures. Each constructor calls the preset function after the 1.x deferral and forwards `update`, `detach`, `on` and `off` to the handle. They hold no chart logic.
- **Docs.** Examples and guides use only the functional API. The class wrappers get a one-line API description with an `@see` link to their function. Guides mention the class style briefly (migration guide, getting started).
- _Alternatives considered:_
  - Classes as the primary API with functions as helpers. Rejected: class methods tree-shake worse, generics flow worse through constructors, and lifecycle state would spread into the core.
  - Moving the class wrappers into compat. Rejected: 1.x constructors must work without migration (proposal).

### D11 The 1.x export surface stays

Author decision, 2026-10-13: `Svg` was public, and legacy plugins and user code use it (and other exports) for their own SVG work. No 1.x export is removed.

- **Legacy surface.** The 1.x standalone modules move unchanged into `packages/chartist/src/legacy/`: `Svg`, `SvgList`, the creation helpers (`createSvg`, `createGrid`, `createGridBackground`, `createLabel`, `createChartRect`), `optionsProvider` and the 1.x `Axis` implementation they depend on. The package root re-exports them under their 1.x names. Their 1.x unit tests move with them and stay unchanged.
- **Shared, not duplicated.** Modules that v2 keeps using are not copied: `SvgPath`, `Interpolation`, `easings`, `EventEmitter` and the pure utility functions are used by both the v2 core and the legacy surface.
- **Axis classes as option values.** 1.x options reference axis classes (`axisY: { type: FixedScaleAxis }`). The presets map the 1.x classes to the v2 axis factories, so these options keep working.
- **No cost when unused.** `sideEffects: false` and module-level exports keep the legacy surface out of bundles that don't import it. The size budgets check that `chart` and the preset entries don't pull it in. The UMD build contains everything, as in 1.x.
- **Docs.** The legacy surface gets minimal API docs: a one-line description marking it as the 1.x API and an `@see` link to the v2 equivalent (scene nodes, `chart()`). Helpers that were never meant to be public are marked `@deprecated` but still work.
- **Why not in compat?** `Svg` is useful without a chart: users who draw their own SVG shouldn't have to install a chart plugin, and `import { Svg } from 'chartist'` must keep working. Compat is only for 1.x _chart_ behavior (events, plugins, live DOM in draw).
- _Alternatives considered:_
  - Moving `Svg` into `chartist/compat`. Rejected: breaks direct imports and the UMD global `Chartist.Svg` for code that never used chart events.
  - Removing the low-level helpers. Rejected: they were exported in 1.x and some plugins use them.

## Risks / Trade-offs

- [Compat drifts from 1.x in edge cases, e.g. element order or timing] → The contract suites (D8) gate every core change. Draw event order is asserted explicitly.
- [1.x users upgrade and silently lose `draw` customizations] → One-time console warnings name the event or plugin and link to the migration guide. The release notes and the migration guide put "add the compat plugin" first. The npm major version signals the change.
- [Scene allocation slows large datasets (thousands of points)] → Benchmark against 1.5 in the implementation change. Nodes are plain objects with a shared prototype; data context is stored by reference.
- [String renderer text metrics are approximate] → Document it. Allow passing a custom `measureText` (e.g. from a font-metrics library) for exact SSR layout.
- [Two label modes increase the CSS surface] → Presets keep 1.x CSS. The new mode gets its own small stylesheet, part of the theming change.
- [Returned payloads can break invariants] → Validate critical layout values (finite numbers, non-negative sizes) after `layout`, with descriptive errors.
- [Plain-JS plugins mutate read-only payloads anyway] → Freeze payloads in our tests and in a debug option, and document the return-value rule with every event.
- [Copying slows transforms on large scenes] → Structural sharing in `mapNodes` and node builders. Benchmark together with scene allocation.
- [Two API styles confuse users] → Docs show only the functional API. The classes are documented as 1.x wrappers.

## Migration Plan

This change produces no code. Implementation follows in this order:

1. Visual regression harness and 1.5 baseline (done).
2. Public API test suite, written and passing against the 1.5 code.
3. Scene graph + DOM/string renderers + pipeline skeleton with return-value events, `toScene` and `chart()`.
4. Port the axes and the line layer; `lineChart` preset, `LineChart` wrapper, legacy surface (D11) + compat plugin. The contract suites must pass.
5. Bar and pie layers and presets.
6. Multi-axis and composition. Container-query responsiveness.

Each step is its own OpenSpec change. Rollback means not merging that step; `next` always passes the contract suites.

## Open Questions

- Whether `compose` events should also be emitted for container groups (`g.ct-series`, `g.ct-grids`). 1.x doesn't emit `draw` for them. This can be decided when porting the line layer without affecting the specs.
- The exact estimate model for string-renderer text metrics.
