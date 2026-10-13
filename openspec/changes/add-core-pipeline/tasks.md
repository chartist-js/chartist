# Tasks

## 1. Scene graph

- [ ] 1.1 `src/scene/node.ts`: `SceneNode` types, `node(name, attrs?, className?)`, and the builder prototype (`attr`, `addClass`, `removeClass`, `append`, `remove(child)`, `replace(child, next)`, `text`, `empty`), each returning a new node that shares unchanged fields. Verify: unit tests in `node.spec.ts`, with every input deep-frozen by a `freezeDeep` test helper, show the originals unchanged and children arrays shared when untouched.
- [ ] 1.2 `src/scene/tree.ts`: `findAll(scene, { role?, seriesIndex?, valueIndex?, key? })`, `mapNodes(scene, fn)` (post-order, unchanged subtrees reused by identity, `null` drops a node), and key assignment from `layerIndex/seriesIndex/valueIndex`. Verify: unit tests, including identity checks for untouched subtrees.

## 2. Pipeline

- [ ] 2.1 `src/pipeline/emitter.ts`: `createPhaseEmitter()`, a factory (no class) returning `on`/`off`/`'*'`, `transform` (chaining, `undefined` keeps, `null` drops and stops) and `notify`. Verify: unit tests for order, chaining, `off` with and without a listener, and `'*'` receiving final values.
- [ ] 2.2 `src/pipeline/phases.ts`: `resolve` (defaults, padding, coordinate check with the specified error), `prepare` (normalize series), `layout` (area from size and padding, validated), `compose` (per-node events, post-order, drop), `scene` (root `svg`, layers in order, keys). Verify: unit tests per phase, plus a test that `prepare`/`layout` listeners returning new values change later phases and that received payloads stay unchanged (frozen).
- [ ] 2.3 `src/chart/toScene.ts`: `toScene(config, { width, height, measureText? })`, synchronous, with plugins and `config.on`. Verify: a unit test running in the Node environment (`// @vitest-environment node`) produces equal scenes for equal inputs and touches no `window`/`document`.

## 3. Renderers

- [ ] 3.1 `src/render/measure.ts` (estimate) and `src/render/string.ts` (`renderToString`): escaping, `ct:` attributes, root `xmlns`/`xmlns:ct`, width/height. Verify: unit tests in the Node environment for escaping, namespaces and a snapshot-free structural check, plus well-formedness by parsing the output with `DOMParser` in jsdom.
- [ ] 3.2 `src/render/dom.ts`: `domRenderer()` factory (namespaced elements, `ct:` via `setAttributeNS`, replace a previous Chartist svg, `elementOf`), and DOM `measureText` with an estimate fallback. Verify: unit tests in jsdom, including that the same scene rendered to DOM and string gives the same markup (`outerHTML` vs string, after normalizing attribute order).

## 4. chart()

- [ ] 4.1 `src/chart/chart.ts`: target resolution and error, plugin installation (`{ name, install }`, `[plugin, options]`), the 1.x-function plugin warning (once per page, plugin skipped), `config.on`, synchronous first render, size from options or container. Verify: unit tests for each, including `mount` listeners getting live elements via `elementOf`.
- [ ] 4.2 Handle: `update(partial)` (re-run from `resolve`), `destroy()` (svg, observer and listeners removed), `on`/`off` returning the handle. DOM host with `ResizeObserver` re-running from `layout` only on real size changes. Verify: unit tests with a stub `ResizeObserver` showing a re-layout on size change, no re-render on an equal size, and no observer after `destroy`.
- [ ] 4.3 Export `chart`, `toScene`, `renderToString`, `node`, `findAll`, `mapNodes` and the public types from `src/index.ts` with `@experimental` JSDoc. Verify: `pnpm nx run chartist:build` succeeds, and importing `chartist` in Node (`test:smoke`) still works without globals.

## 5. Public API suite and size

- [ ] 5.1 Exclude `*.v2.api.ts`/`*.v2.test-d.ts` in v1 mode and relax `exports.api.ts` to "1.5.0 names listed" in v1 mode. Then run `test:api:update-exports` and review the diff. Verify: the diff adds exactly the new names; `test:api:v1` stays at 118 passing tests.
- [ ] 5.2 `chart.v2.api.ts`, `scene.v2.api.ts` and `render.v2.api.ts`: the `chart-composition` custom layer scenarios (user-defined layer, order, unsupported coordinates, keys), the functional API scenarios (synchronous render, update/destroy), the pipeline scenarios (transform by return, observe without copy, unchanged payload, plugin hooks) and string rendering in Node. Add `*.v2.test-d.ts` for the config, layer, node and payload types. Verify: `pnpm nx run chartist:test:api` passes, and the export coverage check covers the new names.
- [ ] 5.3 Size budgets: add `import { chart }` and `import { toScene, renderToString }` entries from the measured sizes plus about 5%, and re-baseline the whole-package entries. Verify: `pnpm nx run chartist:test:size` passes, and the measured numbers are recorded in the plan's size notes.

## 6. Integration

- [ ] 6.1 Run the full local gate (`pnpm nx run-many -t typecheck check build test test:smoke test:size test:visual test:visual:v1 test:api test:api:v1 test:e2e lint` and `pnpm nx format:check --all`). Verify: all green; the visual baseline and `test:api:v1` are unchanged.
- [ ] 6.2 Update the plan's roadmap (step 3 done) and record the D2 `elementOf` deviation in `docs/v2-high-level-plan.md` if it affects later steps. Verify: the plan reads consistently with the archived design.

## Workflow follow-up

- Archive `add-core-pipeline` and sync the `chart-composition` spec.
- Next: step 4 (axes, line layer, `lineChart` preset, `LineChart` wrapper, legacy surface, compat plugin).
