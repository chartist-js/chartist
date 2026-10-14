# Tasks

## 1. Scene nodes

- [x] 1.1 `NodeRoles` with the built-in contexts and attributes (D1), `RoleNode<R>`, `SceneNode` union with `CustomNode`; `label` context `kind`.
- [x] 1.2 `this`-typed builders; `node()` infers role nodes (D2).
- [x] 1.3 `findAll` narrowing and `NodeQuery.role` (D3).
- [x] 1.4 Pie context additions and slice keys (D7); rendering and visual tests unchanged.

## 2. Events and plugins

- [ ] 2.1 `ChartEvents` and typed `on`/`off`/`emit` without the catch-all (D4); compat declares the 1.x events.
- [ ] 2.2 Listener return types per phase (D5).
- [ ] 2.3 `ChartPlugin<Options, Events>`, checked pairs, `withOptions()` (D6).

## 3. Options

- [ ] 3.1 Preset `plugins`, line `series`, `stackMode` `'overlap'`, label formatter value types (D6).
- [ ] 3.2 `ResolvedConfig<Preset>`, `isPreset()`, typed renderer output (D6).

## 4. Proof

- [ ] 4.1 Type tests (`*.v2.test-d.ts`): narrowing, queries, builders, events, plugins, options, with `@ts-expect-error` cases; the 1.x type tests unchanged against `chartist@1.5.0`.
- [ ] 4.2 Remove the casts from examples, compat and docs examples (D8); visual tests and docs checks pass.
- [ ] 4.3 Docs: a note on typed nodes and events in Events and plugins, and in Coming from 1.x; findings updated (typing items resolved).
- [ ] 4.4 Plan updated; full gate.
