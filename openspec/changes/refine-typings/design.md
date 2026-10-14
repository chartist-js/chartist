# Design

## Context

- Scene: `scene/node.ts` (`NodeContext`, `NodeMeta`, `SceneNode`, `node()`), `scene/tree.ts` (`findAll`, `mapNodes`, `assignKeys`).
- Roles and context set by `layers/line.ts`, `bar.ts`, `pie.ts`, `scales/grid.ts` (table in the survey; summarized in D1).
- Pipeline: `pipeline/types.ts` (`PhaseEvents`, `PhaseListener`), `emitter.ts`, `chart/types.ts` (`ChartHandle`, `ChartPlugin`, `PluginEntry`), `chart/plugins.ts`.
- Compatibility: `test/api/*.test-d.ts` (1.x contract, also run against `chartist@1.5.0`), `test/api/exports/chartist.json` (names), specs `public-api` and `v1-compatibility`. The 1.x `*DrawEvent` types already model a role-discriminated union.

## Decisions

### D1: `NodeRoles`, a map from role to context and attributes

```ts
export interface NodeRoles {
  point: { ctx: PointContext; attrs: LineAttrs }; // x1..y2, ct:value, ct:meta
  bar: { ctx: BarContext; attrs: LineAttrs };
  line: { ctx: PathContext; attrs: PathAttrs }; // d; ctx.path: SvgPath, values
  area: { ctx: PathContext; attrs: PathAttrs };
  slice: { ctx: SliceContext; attrs: PathAttrs }; // + center, radius, angles
  series: { ctx: SeriesContext; attrs: SeriesAttrs };
  grid: { ctx: GridContext; attrs: LineAttrs }; // ctx.axis: PlacedScaleAxis
  gridBackground: { ctx: {}; attrs: RectAttrs };
  label: { ctx: AxisLabelContext | PieLabelContext; attrs: LabelAttrs };
}
```

`label` keeps one role (1.x CSS and plugins key on it); its two contexts are a union discriminated by `ctx.kind: 'axis' | 'pie'` (added, so narrowing is one check).

`RoleNode<R>` is the node type for a role. `SceneNode` becomes `RoleNode<keyof NodeRoles> | CustomNode`, where `CustomNode` has `role?: string` (excluding the built-in names) and the current loose `ctx`, so custom nodes keep working. Plugins add roles by augmenting `NodeRoles` (`declare module 'chartist'`).

Contexts are written from what the layers set today (survey table), not from wishes; the type tests construct real charts and check the fields exist.

### D2: Builders keep their type

The builder methods return `this`-typed nodes (`attr(...): this`), so a point stays a point. `node(name, attrs, className, meta)` infers the role node from `meta.role` when it's a built-in role.

### D3: Queries narrow

`findAll(scene, query)` with a literal `role` returns `RoleNode<R>[]`; `NodeQuery.role` accepts the built-in names with autocomplete and any string (`keyof NodeRoles | (string & {})`). `mapNodes` passes `SceneNode` (the union), so a mapper narrows by checking `role`.

### D4: Events are a closed, augmentable set

`interface ChartEvents {}` (empty, augmentable) holds custom event payloads. `on`/`off`/`emit` are typed over `PhaseEvents & ChartEvents`; the catch-all overload goes. `ChartPlugin<Options = void, Events extends object = {}>` declares `provides?: readonly (keyof Events)[]`; plugin authors augment `ChartEvents` with the same entries (documented pattern). 1.x event names (`draw`, …) are declared by `chartist/compat`, so compat users keep typed listeners.

### D5: Listener returns by phase

- `compose`: `SceneNode | null | undefined | void` and the type allows a conditional `return` (no TS7030 under `noImplicitReturns`), via a `ComposeListener` whose return type includes `void`.
- `render`, `mount`: `void` (their returns are ignored today; the type says so).
- Other phases: payload or nothing, as now.

### D6: Plugins and options

- `withOptions(plugin, options)` returns a checked entry. Changed during implementation (2026-10-14): a bare `[plugin, options]` pair in a config array can't be checked without making `chart()` generic over the whole plugin list (mapped tuple types, poor errors), so bare pairs stay accepted for compatibility and the docs recommend `withOptions()` or a factory function that returns a plugin.
- `ChartPlugin<Options>` keeps one parameter; `provides` lists keys of the augmentable `ChartEvents` (D4), which is where the payloads live, so a second `Events` parameter isn't needed. `chartist/compat` declares the 1.x events by augmentation; the build points that augmentation at the published core declarations (`./index.js`, `./index.cjs`), since the declaration bundler doesn't rewrite `declare module` paths.
- Role attributes are required as the layers set them (not `Partial`), and every role context reads `seriesIndex`/`valueIndex` as `number | undefined` (contexts without a series declare them `undefined`), so generic code can read indexes on any node.
- `*PresetOptions` override `plugins` with `readonly PluginEntry[]`; the 1.x `Options.plugins` stays for the classes.
- `LineChartPresetOptions.series` is `Record<string, LineSeriesOptions>`; `BarChartPresetOptions.stackMode` adds `'overlap'`.
- Label formatters in preset and layer options: scale axes get `(value: number, index: number) => Label | null | undefined`, step axes get the label type; pie gets `(value: number | string, index) => …`.
- `ResolvedConfig<Preset = unknown>`; `isPreset(config, 'line')` narrows it to the line preset state. `Renderer<Output>` flows into the `render`/`mount` payloads.

1.x types (`LineChartOptions`, `Options`, `AxisOptions`, `Data`, `Series*`, `*DrawEvent`) don't change; the 1.x type tests prove it.

### D7: Context additions (the only runtime change)

Slices get `seriesIndex` (equal to their index, since each slice is its own series) and pie labels `seriesIndex` and `valueIndex`. `assignKeys` then keys slices like other series; this changes no output markup (keys and context aren't rendered), which the visual and rendering tests confirm.

### D8: Proof by deletion

The docs and examples that cast today drop the casts: `examples/line/{svg-animation,simple-svg-animation,path-animation,modify-drawing}`, `pie/donut-animation`, `compat/index.ts`, and the docs' plugin and animation examples. If a cast can't go, the type isn't done.

## Risks / Trade-offs

- **Breaking v2 users' types** (event typos, `ctx` fields) → intended, v2 is experimental; a note in the migration and plugin docs.
- **Union-heavy types slow the compiler or produce unreadable errors** → keep `NodeRoles` flat, avoid deep conditional types; check error messages in the type tests' `@ts-expect-error` cases read well.
- **Augmentation is unfamiliar to some plugin authors** → the plugins page shows the pattern next to `provides`.
- **Generic data left out** → follow-up change; `value` stays as precise as the role allows (`number | NormalizedMulti | undefined`).
