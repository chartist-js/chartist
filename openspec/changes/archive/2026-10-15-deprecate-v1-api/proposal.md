# Proposal

## Why

The root entry `chartist` exports the functional API and the whole 1.x API side by side, with nothing to tell them apart. Autocomplete offers `LineChart` next to `lineChart` and `LineChartOptions` next to `LineChartPresetOptions`. A sandbox test of 2.0.0-rc.1 ran into this: a React component typed its options as `LineChartOptions`, and `lineChart()` rejected them with a long error about `plugins`, without naming the right type. The same happens to everyone who moves from `new LineChart(el, data, options)` to `lineChart(el, data, options)` with a typed options variable, which is exactly what "Coming from 1.x" recommends.

The author decided (2026-10-14) to deprecate the 1.x API in 2.x, with removal in 3.0, and (2026-10-15) to do it on the existing entry, without a separate entry for the 1.x API. The RC phase is the time to do it, so that 2.0.0 ships with the deprecations from the start.

## What Changes

- **The 1.x-only names on `chartist` are marked `@deprecated`,** each with a message that names the functional replacement and the removal: `LineChart`: "Use `lineChart()`. Removed in 3.0."; `LineChartOptions`: "For `lineChart()`, the options type is `LineChartPresetOptions`. Removed in 3.0." Editors strike them through and show the hint. The deprecation is in the type declarations only: nothing changes at runtime, no warnings are logged, and every name stays exported.
- **What stays undeprecated:** names the functional API uses or documents for itself: the data types (`LineChartData`, `Data`, `Series`, …), `Svg`/`SvgList`/`SvgPath`, `easings`, `Interpolation`, the helpers for plugins and custom layers, and the option types that appear in functional signatures (`AxisOptions`, `ChartPadding`, `LineInterpolation`).
- **The 1.x event and plugin types** (`DrawEvent`, `CreatedEvent`, `Plugin`, …) are also exported from `chartist/compat`, unmarked, because compat stays the supported way to use the 1.x events and plugins on the functional API in 2.x.
- **The UMD global `Chartist` doesn't change.** Classic script tags have no import to deprecate.
- **Removal is planned for 3.0.** Whether the 1.x API then disappears or moves elsewhere is decided for 3.0. `docs/decisions.md` records the deprecation and the plan.
- **Docs:** "Coming from 1.x" explains the deprecation and what replaces each part; the API reference marks the deprecated names; `llms.txt` says the 1.x names are deprecated. Functional docs code that uses a 1.x-only name is rewritten without it, or keeps it where it's about 1.x.

## Breaking changes vs 1.x

None. Every 1.x name stays exported from `chartist` and from the UMD global, with its 1.x behavior; 1.x code compiles and runs unchanged. The deprecations are editor hints. A project that treats deprecations as lint errors (for example `@typescript-eslint/no-deprecated`) will see them, which is the purpose. The removal in 3.0 will be breaking, and is announced here.

## Out of scope

- Removing or moving anything. That's 3.0.
- A separate entry for the 1.x API (decided against for 2.x).
- Runtime deprecation warnings: they'd be noise for 1.x code that works.
- Changing the 1.x classes' behavior or types, or the examples' 1.x entries (`main.classic.ts`), which also run against the published 1.5.0 package.
- Deprecating `chartist/compat` or the 1.x events and plugins in 2.x.

## Capabilities

### Modified Capabilities

- `v1-compatibility`: the 1.x-only names on `chartist` are deprecated, with removal in 3.0; the 1.x event and plugin types are also exported from `chartist/compat`.
- `public-api`: which names are deprecated is recorded and tested against the built declarations.

## Impact

- `packages/chartist`: the root entry lists the 1.x-only names with `@deprecated` next to its `export *` lines; the compat entry re-exports the 1.x event and plugin types; the export surface lists, a new deprecation list and test, and type tests.
- `apps/docs`: "Coming from 1.x", the API reference (deprecation badges), `llms.txt`, and docs code that uses 1.x-only names.
- `docs/decisions.md`: the 1.x compatibility section.
- No new dependencies, no new files in `dist`, no size change.
