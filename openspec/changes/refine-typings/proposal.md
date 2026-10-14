# Proposal

## Why

Chartist was JavaScript in 2014 and became TypeScript in a hurry. The v2 functional API was built on those types, and it shows: the docs and examples work kept needing casts (`ctx.axis as ScaleAxis`, `ctx.x as number`, `ctx.path as SvgPath`), presets accept plugins that throw at runtime and reject ones that work, and an event name typo compiles. The author asked (2026-10-14) to take the chance of the new API and type it properly, starting with scene nodes discriminated by their role.

What's loose today (survey of `packages/chartist/src`):

- **Scene nodes:** `role` is any string and `ctx` is a bag of `unknown` (plus an index signature). The builder methods (`attr`, `addClass`, …) return a plain `SceneNode`, so nothing survives a change. `findAll(scene, { role: 'bar' })` returns `SceneNode[]`.
- **Events:** a catch-all overload `on(name: string, listener: (payload: any) => void)` lets typos compile and gives custom events `any` payloads; `provides` isn't linked to anything; `render` and `mount` listeners are typed as if their return values mattered; a `compose` listener that returns only in an `if` fails `noImplicitReturns`.
- **Plugins:** `[plugin, options]` pairs aren't checked against the plugin's options; the presets' `plugins` option is the 1.x type (accepts plain functions, which throw, and rejects pairs, which work).
- **Options:** the line chart's per-series `series` option allows every option although five are read; `stackMode` lacks `'overlap'`; label formatters get `unknown`; `ResolvedConfig.preset` and render `output` are `unknown`.
- **Data context gaps:** pie slices have no `seriesIndex` (so they're never keyed and `findAll({ seriesIndex })` misses them), and pie labels have neither `seriesIndex` nor `valueIndex`.

## What Changes

- **Role-discriminated scene nodes.** A `NodeRoles` map from each built-in role (`point`, `line`, `area`, `bar`, `slice`, `series`, `grid`, `gridBackground`, and the axis and pie `label`s) to its context and attributes. `SceneNode` becomes a union of those role nodes and a generic node for custom roles, so `if (node.role === 'point')` narrows `node.ctx` to `{ x, y, value, valueIndex, seriesIndex, … }`. The map is open to module augmentation, so plugins can add roles.
- **Typed queries and builders.** `findAll(scene, { role: 'bar' })` returns bar nodes; the builder methods keep the node's type (`node.attr(...)` on a point is still a point node).
- **Typed events.** `on`, `off` and `emit` know the phase events and, through an augmentable `ChartEvents` interface, the custom ones; unknown names no longer compile. Listener return types per phase: `compose` may return a node, `null` or nothing on any path; `render` and `mount` listeners return nothing.
- **Typed plugins.** `ChartPlugin<Options, Events>` links `provides` to the events it declares; pairs are checked (`[plugin, options]` must match), with a `withOptions(plugin, options)` helper for inference.
- **Tighter options where the v2 types own them.** Preset options take v2 plugin entries; the line preset's per-series options take only what's read; `stackMode` includes `'overlap'`; label formatters get the axis value type (`number` on scale axes, the label on step axes); `ResolvedConfig` and render output carry their types (with an `isPreset()` guard for plugins).
- **Consistent context.** Slices get `seriesIndex`, pie labels `seriesIndex` and `valueIndex`, so keys and queries work for pies like for the other charts.
- **Type tests.** New `*.v2.test-d.ts` cases pin the narrowing, the event and plugin checks and the option types, including `@ts-expect-error` cases for what must not compile.

**Not in this change:** generic data (a value type flowing from `data` into `ctx.value`) is the riskiest part, because the 1.x `Data`/`Series` types are a compatibility contract; it's listed as a follow-up. Library behavior changes beyond the added context fields stay in `fix-library-findings`.

## Capabilities

### Modified Capabilities

- `scene-graph`: roles are typed; built-in roles have a defined context; pies carry series and value indexes.
- `chart-pipeline`: events and plugins are typed; unknown event names are type errors.
- `public-api`: the v2 type surface has type tests for narrowing and for what must not compile.

## Impact

- `packages/chartist/src/scene`, `pipeline`, `chart`, `layers`, `presets`, `scales`: types, plus the added pie context fields.
- The 1.x types keep every name and shape: the 1.x type tests against `chartist@1.5.0` must keep passing unchanged. Tightening happens in v2-only types (`*PresetOptions`, layer options, scene and pipeline types).
- Users of the v2 API (still `@experimental`) may see new type errors where code relied on `any`: event typos, custom events without a declaration, `ctx` fields that don't exist for a role. That's the point; the migration and plugin docs get a short note.
- Docs and examples drop their casts (`examples/line/*-animation`, `pie/donut-animation`, docs plugin and animation examples) as the proof.
