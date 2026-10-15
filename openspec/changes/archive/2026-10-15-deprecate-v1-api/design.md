# Design

## Context

`packages/chartist/src/index.ts` re-exports seven 1.x modules (`core`, `event`, `charts`, `axes`, `svg`, `utils`, and `interpolation` as the `Interpolation` namespace) next to the v2 modules, all with `export *`. Together they're 155 names. Some are shared with the functional API:

- **In functional signatures** (found by walking the declarations of every non-1.x root export): `LineChartData`, `BarChartData`, `PieChartData` (the presets' data), `LineChartOptions`, `BarChartOptions`, `PieChartOptions` (inside the `*PresetOptions` types), `LineInterpolation` (`LineSeriesOptions`), `AxisOptions`, `ChartPadding`, `Label`, `NormalizedSeries`, `NormalizedSeriesValue`, `NormalizedSeriesPrimitiveValue`, `SvgPath` (path and slice contexts).
- **In functional docs code** (the examples' `main.ts` files and the docs examples): `Interpolation`, `Svg`, `easings`, `getMultiValue`, `times`, `noop`, and `AutoScaleAxis` in the zoom plugin example (a 1.x plugin through compat).

The API reference already sorts the names: "1.x classes" (the classes, their options and events types, the 1.x drawing helpers), "Helpers" ("for plugins and custom layers"), "SVG and animation" (with `Interpolation`), "Data", and the 1.x event and plugin types on the `chartist/compat` page.

Two facts about TypeScript decide the mechanism. Both were checked with the language service of TypeScript 5.9 in a scratch project:

1. A `@deprecated` tag marks direct uses of the tagged declaration or specifier. Types built from it elsewhere (`Omit<LineChartOptions, …>`) and aliases declared in another module (`export type DrawEvent = …`) aren't marked.
2. A re-export of a deprecated name is deprecated too.

## Goals / Non-Goals

**Goals:** deprecation hints on the 1.x-only names of `chartist` that name the functional replacement; no runtime change; the removal in 3.0 announced.

**Non-goals:** removing or moving names; a separate entry for the 1.x API (the author decided against it for 2.x: a deprecation should point forward, and where the 1.x API goes in 3.0 is decided then); runtime warnings; changing the 1.x classes' behavior or types; deprecating `chartist/compat`.

## Decisions

### Which names are deprecated

The rule: a 1.5 root name is deprecated when the functional API neither uses it in its signatures nor documents it for plugins, custom layers or data. In terms of the API reference, that's the "1.x classes" page minus `AxisOptions`, `ChartPadding` and `LineInterpolation` (in functional signatures), plus the 1.x event and plugin types on the compat page. Roughly:

- **Values:** `LineChart`, `BarChart`, `PieChart`, `BaseChart`, `Axis`, `AutoScaleAxis`, `FixedScaleAxis`, `StepAxis`, `EventEmitter`, `getSeriesOption`, `optionsProvider`, `createSvg`, `createGrid`, `createGridBackground`, `createLabel`.
- **Types:** the `*ChartOptions`, `*ChartOptionsWithDefaults` and `*ChartEventsTypes` of each chart, `BaseChartEventsTypes`, `Options`, `OptionsWithDefaults`, `OptionsProvider`, `ResponsiveOptions`, `AxisType`, `LabelDirection`, `AnchorPosition`, `RadialLabelPosition`, `Dot`, `EventListener`, `AllEventsListener`, and the 1.x event and plugin types (`CreatedEvent`, `DrawEvent`, `DataEvent`, `OptionsChangedEvent`, the `*DrawEvent` and `*CreatedEvent` types, `Plugin`).

The remaining 1.5 names that no API page assigns clearly (`determineAnchorPosition`, `createChartRect`, `normalizePadding`, `axisUnits`, …) get sorted by the same rule while the list is written; the list is checked in and shown to the author before tagging. `LineChartOptions`, `BarChartOptions` and `PieChartOptions` are deprecated although the `*PresetOptions` types are built from them: a type built from a deprecated one isn't marked. That's the case the sandbox test hit.

### Messages

Each message names the replacement and the removal, in one or two sentences:

- Classes: "Use `lineChart()`. Removed in 3.0." (`chart()` for `BaseChart`; the scale functions `autoScaleAxis()`, `fixedScaleAxis()`, `stepAxis()` for the axis classes.)
- Option types: "For `lineChart()`, the options type is `LineChartPresetOptions`. Removed in 3.0."
- 1.x drawing helpers and event emitter: what the functional API does instead (layers, `on()`/`off()`), or "No replacement: 1.x internals." where there is none.
- 1.x event and plugin types: "Import it from `chartist/compat`. Removed from `chartist` in 3.0."
- The event maps of the 1.x classes (`LineChartEventsTypes` and the others): "The 1.x events of a `LineChart`. On `lineChart()`, the handle's `on()` knows its events." They type the classes' own `on()`, which functional code with compat doesn't use, so compat doesn't alias them (found while applying: their members have no docs of their own, which the compat page of the API reference requires).

### The tags go on the declarations

The plan was to tag export specifiers in `src/index.ts` (`export { /** @deprecated */ LineChart } from './charts'`). The first task showed that tsdown's declaration bundler drops comments on export specifiers, and that the bundled `index.d.ts` and `index.d.cts` export the 1.x names at their declarations (`export declare class LineChart …`), with no specifier left to tag after the build.

So the `@deprecated` tag goes into the JSDoc of each deprecated declaration in the source. Checked with the language service: a direct use of the name is reported with the message in its hover; a type built from it (`LineChartPresetOptions = Omit<LineChartOptions, …> & …`) and an alias of it in another module (compat's `DrawEvent`) are not. Declaration comments survive the bundler (`easings` already carries one), and TypeDoc reads them, so the API reference shows the badge without a separate list. The cost is inside the repo: editors strike through internal uses of the 1.x declarations. No configured linter checks deprecations, so builds and lint are unaffected.

### compat declares the 1.x event and plugin types as aliases

The compat declarations import the core from `./index.js` (the core stays external), so a plain re-export from compat would carry the root's tags along. Instead `src/compat/index.ts` declares each as a type alias of the core type (`export type DrawEvent = …`, with the type parameters where the type has any). An alias is its own declaration and isn't marked; it's the same type. The deprecation test checks that compat's are unmarked.

### Docs code

The examples' `main.classic.ts` files stay as they are: they're 1.x code as 1.x users have it, and the parity and visual tests run them against the published 1.5.0 package. In the playground editor they'll show the hints, which is accurate. Functional docs code that uses a 1.x-only name is rewritten without it, unless the text is about 1.x. The known case is the zoom plugin example's `AutoScaleAxis`: it's a 1.x plugin through compat, so it stays, and its text says so.

### API reference

It already shows a "deprecated" badge for `@deprecated` comments, read from the declarations' comments, so the tags show there without further work.

## Tests

- **Deprecations:** a checked-in list of the names deprecated on `chartist`. A test runs the TypeScript language service against the built `index.d.ts`, `index.d.cts`, `compat.d.ts` and `compat.d.cts`, and checks: exactly the listed names are reported as deprecated from `chartist`; none of compat's exports is.
- **Export surface:** unchanged for `chartist`; the compat lists gain the event and plugin types.
- **Types:** a type test types a `draw` listener with `PointDrawEvent` from `chartist/compat`; the 1.x type tests keep compiling unchanged.

## Risks / Trade-offs

- **Declaration bundling** could drop a tag in a future tsdown version; the deprecation test checks the built files.
- **Repo noise:** contributors see internal uses of the 1.x declarations struck through.
- **No way to silence the hints without migrating.** Code that stays on the classes in 2.x shows struck-through names until it moves to the functions. That's the message of a deprecation with removal; the docs say how to move.
- **Deprecation as lint errors:** projects with `@typescript-eslint/no-deprecated` as an error will fail their lint on 1.x imports. That's the point.
- **Older TypeScript** (before 4.0) ignores `@deprecated`: no hints, nothing breaks.
- **The UMD global** has no hints; classic script pages are 1.x code by definition.

## Migration

None needed for 2.x: everything keeps working. "Coming from 1.x" shows what replaces each deprecated part.
