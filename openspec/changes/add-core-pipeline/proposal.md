# Proposal

## Why

`define-core-architecture` decided on a functional, pipeline-based v2 core, and `add-public-api-tests` locked in the 1.x contract. The next step (Migration Plan step 3) is the foundation that every later step builds on: scene graph, pipeline, renderers, hosts and `chart()`. The line layer, axes and presets (step 4) need it, and building it before any 1.x code is replaced means the foundation can be tested on its own.

## What Changes

- **Scene graph.**
  - Immutable scene nodes with a chainable builder that has the 1.x `Svg` method names but returns new nodes (`attr`, `addClass`, `removeClass`, `append`, `remove`, `replace`, `text`, `empty`).
  - Tree functions: `node()` to create nodes, `findAll()` to query by role and data context, and `mapNodes()` to transform a tree, reusing unchanged subtrees.
  - Roles, data context and stable keys on data nodes.
- **Pipeline.**
  - The phases `resolve` → `prepare` → `layout` → `compose` → `scene` → `render` → `mount`, with read-only payloads.
  - Listeners transform a phase by returning a new value, and the results chain in registration order. `compose` emits one event per node.
  - `render` and `mount` are observe-only.
- **`toScene(config, { width, height, measureText? })`.** A pure function that runs `resolve` to `scene` without touching the DOM, timers or globals.
- **Renderers.**
  - `renderToString(scene)` serializes a scene to standalone SVG markup.
  - The DOM renderer (the default for `chart()`) creates SVG elements, replaces a previous Chartist SVG in the container, and exposes the element of each node to `mount` listeners.
  - Both provide text measurement: a font-size-based estimate for strings, and real SVG text measurement in the DOM.
- **Hosts.** The DOM host reads the container size and re-runs the pipeline from `layout` when a `ResizeObserver` reports a change. Fixed `width`/`height` options take precedence.
- **`chart(target, config)`.** Renders synchronously and returns `{ update, destroy, on, off }`. `config.on` listeners and v2 plugins (`{ name, install }`, or `[plugin, options]`) are registered before the first render.
- **Custom layers.** A layer is a plain object with a type, the coordinate systems it supports, and a `compose` function that returns scene nodes for the chart area. This change ships no chart layers (the line layer comes in step 4). The contract is public, so tests and early users can write their own.
- **Exports.** The root entry gains `chart`, `toScene`, `renderToString`, `node`, `findAll`, `mapNodes` and their types. They are marked `@experimental` in the API docs until v2.0, so the API can still change before the release. The export lists, type tests and behavior tests of the public API suite cover them.

No 1.x module changes behavior. The 1.x unit tests, the visual baseline and `test:api:v1` parity stay green.

## Out of scope

- Axes, the line, bar and pie layers, the presets and the class wrappers (steps 4 and 5).
- The compat plugin and the warnings for 1.x events and plugins (step 4, with the first preset).
- Wrapped SVG text labels and `foreignObject` labels (they come with the axes, which are the first users of text layout).
- Container-query responsive options (step 6). `resolve` evaluates no responsive options yet.
- Diffing/patching renders and animations.

## Breaking changes vs 1.x

None. This change only adds exports. The 1.x surface and output are unchanged, as the public API suite (`test:api`) and the visual baseline verify.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chart-composition`: adds the custom layer contract (layer shape, coordinate-system check, compose output), which the existing requirements assume but don't define.

## Impact

- `packages/chartist/src/`: new folders `scene/`, `pipeline/`, `render/` and `chart/`, and new exports in `src/index.ts`. No 1.x module is modified.
- `packages/chartist/test/api/`: export list update, behavior tests (`chart.api.ts`, `scene.api.ts`, `render.api.ts`) and type tests for the new API. `test:api:v1` skips the v2 files, because 1.5.0 doesn't have the API.
- `packages/chartist/.size-limit.json`: new budgets for `import { chart }` and `import { toScene, renderToString }`, and slightly higher whole-package budgets.
- Unit tests for the internals with Vitest in `src/**`, next to the code.
- Docs: none yet. The API reference for v2 comes with the docs change.
