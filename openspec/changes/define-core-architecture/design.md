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

- Each phase emits one event (`compose` emits one per node). Listeners run synchronously in registration order and may **mutate the payload**. This matches 1.x's mutable `data` event and costs no copies.
- Events go through the existing `EventEmitter` (`event/EventEmitter.ts`), so `on`/`off`/`'*'` keep working.
- **Phase names differ from the 1.x event names** (`data`, `optionsChanged`, `draw`, `created`), so v2 and legacy events can coexist on the same emitter without ambiguity.
- _Alternative considered:_ ordered transform hooks returning new values (a functional pipeline). It's cleaner for immutability but needs more allocations and a second API next to `on()`. Rejected for size and familiarity.

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

- The builder methods (`attr`, `addClass`, `removeClass`, `elem`, `append`, `remove`, `replace`, `text`, `empty`, `parent`, `root`) mirror the 1.x `Svg` method names and signatures. That keeps one mental model across v1 and v2.
- Methods live on a small prototype, not on every node object.
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
- **Presets** are thin functions/classes. They translate 1.x options (`axisX`, `axisY`, `stackBars`, `horizontalBars`, `donut`, …) into a `Chart` configuration with one layer and the 1.x axis setup, and they import only that layer.
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
- **What stays in the core** is detection only: a list of the six legacy event names checked in `on()`, and the "plugin is a plain function" check. These produce the one-time warnings. That's a few hundred bytes. The `Svg`/`SvgList` classes, eager DOM and legacy emission all live in compat.
- **Packaging:**
  - ESM/CJS: subpath export `chartist/compat`, versioned with the core.
  - Browser: a separate `dist/compat.umd.js` that attaches `Chartist.compat` to the existing UMD global.
  - No separate npm package is needed, because compat is tightly coupled to core internals.
- The 1.x first-render deferral (`setTimeout(0)`) is kept for presets. The composable `Chart` renders on a microtask instead, and exposes a synchronous path for string rendering.
- _Alternatives considered:_
  - Pure `Svg` facade over scene nodes (no DOM). Rejected: it breaks handlers that measure or touch DOM.
  - Automatic activation bundled with the presets. Rejected by the author: it adds compat code to every preset user's bundle and hides that 1.x APIs are legacy. The explicit plugin plus warnings makes the migration a deliberate one-line step.

### D7 Labels

- **Composable charts** default to SVG `text` with layout-time wrapping into `tspan` lines via `Renderer.measureText`. Browsers don't implement SVG 2 `inline-size`, so wrapping must be computed.
- **Presets** keep 1.x HTML labels (`foreignObject` + `span`), because user CSS and the 1.x flexbox alignment depend on them.
- The inline `style` on `foreignObject` (a CSP issue, #1430) moves to attributes and classes where the output stays identical. Where it can't, it stays as it is and becomes a tracked theming follow-up.

### D8 Contract suites before implementation

- The 1.x unit tests stay as they are. Their DOM-structure assertions become the scene-graph output contract.
- A Playwright visual regression baseline is recorded from **unchanged 1.5 code** before core work starts (separate change). It reuses the example definitions shared with the docs.

### D9 Size

The scene objects, builder prototype and pipeline add code. It is offset by:

- removing `Svg`/`SvgList`, eager DOM creation and legacy event emission from the core (they move to the opt-in compat plugin);
- sharing axis and layout code across layers;
- tree-shaking.

Per-entry budgets are re-baselined in the implementation change. A noticeable increase for the pipeline is accepted (author decision, 2026-10-12).

## Risks / Trade-offs

- [Compat drifts from 1.x in edge cases, e.g. element order or timing] → The contract suites (D8) gate every core change. Draw event order is asserted explicitly.
- [1.x users upgrade and silently lose `draw` customizations] → One-time console warnings name the event or plugin and link to the migration guide. The release notes and the migration guide put "add the compat plugin" first. The npm major version signals the change.
- [Scene allocation slows large datasets (thousands of points)] → Benchmark against 1.5 in the implementation change. Nodes are plain objects with a shared prototype; data context is stored by reference.
- [String renderer text metrics are approximate] → Document it. Allow passing a custom `measureText` (e.g. from a font-metrics library) for exact SSR layout.
- [Two label modes increase the CSS surface] → Presets keep 1.x CSS. The new mode gets its own small stylesheet, part of the theming change.
- [Mutable payloads let plugins break invariants] → Validate critical layout values (finite numbers, non-negative sizes) after `layout`, with descriptive errors.

## Migration Plan

This change produces no code. Implementation follows in this order:

1. Visual regression harness and 1.5 baseline.
2. Scene graph + DOM/string renderers + pipeline skeleton.
3. Port the axes and the line layer; `LineChart` preset + compat plugin. The contract suites must pass.
4. Bar and pie layers and presets.
5. Multi-axis and composition. Container-query responsiveness.

Each step is its own OpenSpec change. Rollback means not merging that step; `next` always passes the contract suites.

## Open Questions

- Whether `compose` events should also be emitted for container groups (`g.ct-series`, `g.ct-grids`). 1.x doesn't emit `draw` for them. This can be decided when porting the line layer without affecting the specs.
- The exact estimate model for string-renderer text metrics.
