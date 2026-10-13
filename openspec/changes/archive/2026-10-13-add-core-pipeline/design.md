# Design

## Context

- The architecture is decided in `openspec/changes/archive/2026-10-13-define-core-architecture/design.md` (D1–D11), and the requirements live in the main specs `chart-pipeline`, `scene-graph`, `chart-rendering` and `chart-composition`. This change implements the parts that don't depend on axes or presets.
- The 1.x code in `packages/chartist/src` (`charts/`, `core/`, `svg/`, `axes/`, `event/`) stays untouched. Its `EventEmitter` is public 1.x API and keeps its `emit(): void` behavior.
- The public API suite (`test/api`) runs against the local build and against 1.5.0. New v2 exports must be listed and tested there (`public-api` spec).
- `sideEffects` in `package.json` only lists CSS/Sass, so unused root exports are tree-shaken.
- jsdom (unit and API tests) has no `ResizeObserver`, no layout and no SVG text metrics.

## Goals / Non-Goals

**Goals:**

- A complete vertical slice from `chart()`/`toScene()` to DOM and string output, proven with custom layers.
- Pure, side-effect-free code from config to scene. Globals are touched only in the DOM host and the DOM renderer, and only at call time.
- Small. The pipeline skeleton should stay well below the 1.x line chart (8.8 kB gzipped).

**Non-Goals:**

- Matching 1.x output. That is the presets' job (step 4); this change defines no default structure beyond the root `svg`.
- Performance tuning beyond avoiding obvious copies. Benchmarks come with the line layer.

## Decisions

### D1 Module layout

```
src/scene/     node.ts (factory + builder prototype), tree.ts (findAll, mapNodes, keys)
src/pipeline/  emitter.ts (createPhaseEmitter), phases.ts (resolve … scene), types.ts
src/render/    dom.ts (DOM renderer + DOM text measurement), string.ts, measure.ts (estimate)
src/chart/     chart.ts (chart(), handle, DOM host), toScene.ts
```

- **No classes in v2 code** (functional API, define-core-architecture D10). State lives in closures of factory functions that return plain objects, e.g. `createPhaseEmitter()`, `domRenderer()` and the `chart()` handle. The only shared prototype is the scene node builder (D2). There, thousands of nodes share one set of methods instead of carrying their own closures, and the prototype is never exposed as a constructor.
- `src/index.ts` adds the new exports next to the 1.x ones.
- No module imports from the 1.x folders, except the pure helpers (`normalizePadding`, `escapingMap`, `namespaces`), so the v2 slice tree-shakes independently.

### D2 Scene nodes: immutable objects on a shared prototype, renderer bindings outside

```ts
interface SceneNode {
  readonly name: string;
  readonly attrs: Readonly<Record<string, string | number>>;
  readonly classes: readonly string[];
  readonly children: readonly SceneNode[];
  readonly content?: string; // text content, set with .text()
  readonly key?: string;
  readonly role?: string;
  readonly ctx?: Readonly<NodeContext>; // never rendered
  // builder (prototype): attr, addClass, removeClass, append, remove, replace, text, empty
}
```

- `node(name, attrs?, className?)` creates nodes through `Object.create(nodeProto)`. Every builder call returns a new node and copies only the changed field; `children` arrays are shared until changed.
- `remove(child)` and `replace(child, next)` take the child node to act on, because nodes have no parent references.
- The text content is stored in `content`, not `text`, because an own `text` field would shadow the `text()` builder method on the prototype.
- **Deviation from define-core-architecture D2:** there is no `ref` field. Renderers keep a `WeakMap<SceneNode, Element>` per render and expose it as `elementOf(node)` in `mount`. Mutating immutable, possibly shared nodes would break structural sharing. The compat plugin (step 4) gets the same map to adopt live elements.
- Freezing: in our tests, a helper (`freezeDeep`) deep-freezes payloads and nodes, so any mutation throws. Production code never freezes.

### D3 Phase emitter: a factory with transform semantics

```ts
createPhaseEmitter(): {
  on(name, listener); off(name, listener?);  // '*' supported, observe-only
  transform<T>(name, value: T): T | null;    // chains return values
  notify(name, value): void;                 // render, mount: return values ignored
}
```

- Listeners live in a closure (`Map<string, Listener[]>`); nothing is exposed but the four functions.
- `transform` runs the listeners in registration order. A non-`undefined` result replaces the value. A `null` result (only meaningful for `compose`) drops the node and stops the chain. `'*'` listeners then receive the final value.
- _Alternative considered:_ extending the 1.x `EventEmitter`. Rejected: it's public 1.x API with `emit(): void`, and the compat plugin will need both emitters side by side.

### D4 Phase payloads

| Phase     | Payload (read-only)                                | Transformable |
| --------- | -------------------------------------------------- | ------------- |
| `resolve` | `{ config }` (defaults merged, listeners removed)  | yes           |
| `prepare` | `{ data }` (series normalized to arrays of values) | yes           |
| `layout`  | `{ width, height, padding, area }`                 | yes           |
| `compose` | the scene node (one event per node with a `role`)  | yes, or drop  |
| `scene`   | `{ scene }`                                        | yes           |
| `render`  | `{ scene, output }`                                | no            |
| `mount`   | `{ scene, output, elementOf }` (DOM only)          | no            |

- `compose` walks each layer's result depth-first and post-order, so children are composed before their parent, and the parent receives the composed children. Container nodes without a `role` emit no event; this answers the open question of define-core-architecture.
- After `layout`, the area is validated (finite numbers, non-negative size), with an error naming the listener phase (Risk in define-core-architecture).

### D5 Layers and config

```ts
interface Layer {
  type: string;
  coordinates: readonly ('cartesian' | 'polar')[];
  compose(ctx: { data; area; layerIndex; measureText }): readonly SceneNode[];
}
interface ChartConfig {
  data: { labels?; series };
  layers: readonly Layer[];
  coordinates?: 'cartesian' | 'polar'; // default 'cartesian'
  padding?: number | Partial<ChartPadding>; // default 1.x chartPadding
  width?: number | string;
  height?: number | string;
  className?: string;
  plugins?: readonly (Plugin | [Plugin, unknown])[];
  on?: Partial<Record<PhaseName | '*', Listener>>;
}
```

- The coordinate check runs in `resolve`, before any layer composes, and throws `Layer "<type>" does not support <coordinates> coordinates`.
- Keys: after `compose`, data nodes without a key get `layerIndex/seriesIndex/valueIndex` from their `ctx`. Series nodes get `layerIndex/seriesIndex`.
- The scene root is `node('svg', { width, height }, className)`, with each layer's nodes appended in declaration order and no wrapper groups. Presets will define their own groups to match the 1.x structure.

### D6 toScene and text measurement

- `toScene(config, { width, height, measureText? })` runs `resolve` → `scene` synchronously with a fresh emitter that has only the config's `on` listeners and plugins.
- `measureText(text, { classes, fontSize? })` returns `{ width, height }`. The default estimate is `width = length × fontSize × 0.6` and `height = fontSize × 1.2`, with `fontSize` 12 (the 1.x `.ct-label` size). It's passed into `compose` for layers.

### D7 Renderers

- `renderToString(scene)` serializes the scene:
  - attributes and text are escaped with the 1.x `escapingMap`;
  - `ct:` attributes keep their prefix;
  - the root gets `xmlns` and `xmlns:ct`.
  - It never touches globals.
- **DOM renderer.** `domRenderer()` returns `{ render, measureText }`. `render(scene, container)`:
  - builds a new element tree with `createElementNS`, and `ct:` attributes with `setAttributeNS` (as 1.x does);
  - replaces a previous Chartist `svg` in the container (the 1.x rule);
  - returns `{ svg, elementOf }`.
  - Its `measureText` uses an offscreen `<text>` in the same document (`getComputedTextLength`, `getBBox`) and falls back to the estimate where those are missing (jsdom).
- The `Renderer` type is exported for later renderers. `chart()` takes an optional `renderer` (default: DOM).

### D8 chart() and the DOM host

- `chart(target, config)`:
  1. Resolves the target (a selector or an Element). If nothing matches, it throws the 1.x message `Target element "<sel>" is not found`.
  2. Installs plugins in order, then registers `config.on`.
  3. Runs the pipeline synchronously and renders.
- **Size:** fixed `width`/`height` win. Otherwise the size comes from the container's `clientWidth`/`clientHeight`.
- **Resizes:** a `ResizeObserver` (when available) re-runs from `layout` with the cached `resolve`/`prepare` results, but only when the size changed.
- **Handle:**
  - `update(partial)` shallow-merges the config and re-runs from `resolve`;
  - `destroy()` removes the svg, disconnects the observer and clears listeners;
  - `on`/`off` delegate to the emitter and return the handle.
- **Plugins:**
  - A plain function in `plugins` is a 1.x plugin. It is skipped with a one-time console warning that names the compat plugin; the compat plugin itself arrives in step 4, and this warning is already part of the `v1-compatibility` spec.
  - A v2 plugin's `install(chart, options)` receives the handle.

### D9 Public API suite and size

- **Export list:** the new names go into `test/api/exports/chartist.json` via `test:api:update-exports`.
- **Test files:** v2-only files are named `*.v2.api.ts` and `*.v2.test-d.ts`. The suite config excludes them when `CHARTIST_API_TARGET=v1`.
- **Exact export match:** in v1 mode, `exports.api.ts` keeps checking that every 1.5.0 name is listed, but skips the exact-equality checks, because the list now also contains v2 names. The local run still checks exact equality.
- **Size budgets:**
  - two new size-limit entries, `import { chart }` and `import { toScene, renderToString }`, set from the measured size plus about 5%;
  - the whole-package entries are re-baselined.
  - Accepted by the author in define-core-architecture D9.

## Risks / Trade-offs

- [The builder on immutable nodes allocates on every call] → It copies only the changed field and shares children. The line layer change benchmarks against 1.5.
- [No `ref` on nodes diverges from the architecture text] → Recorded here (D2). `elementOf` gives the same access, and compat adopts elements through the same map.
- [`ResizeObserver` loops (resize → render → resize)] → Re-render only when the observed size differs from the last layout size. Re-renders run synchronously in the observer callback; a responsive svg is `100%` sized, so rendering doesn't change the observed container. If a loop shows up in practice, defer to the next animation frame.
- [Experimental exports get used and then change] → `@experimental` in JSDoc. Nothing is released from `next` until the v2 pre-releases.
- [jsdom lacks metrics, so the DOM `measureText` path stays untested there] → Unit tests cover the fallback. A Playwright check (`test:e2e` of the playground or a small browser test in `test:smoke`) covers real measurement.

## Migration Plan

Additive only: merge when all targets are green. Rollback means reverting the commit, because no 1.x module changes.

## Open Questions

- Whether the scene root should already carry the `ct-chart-*` class convention. This can be decided by the line preset in step 4 without changing this change's API.
