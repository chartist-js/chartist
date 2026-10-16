## Why

`labelInterpolationFnc` was always the wrong name: the function doesn't interpolate, it transforms a tick's value into the label shown (#215). Before 2.0 final is the last chance to give the functional API a better name without a breaking change, and the author decided to do it (2026-10-16): a new option, the old one deprecated and removed in Chartist 3.

## What Changes

- **New option `labelTransform`** wherever `labelInterpolationFnc` is accepted today:
  - the axis options of the presets (`axisX`, `axisY` of `lineChart` and `barChart`);
  - the axes of `cartesianAxes()`, which `axisLabels()` draws;
  - `pieChart` and the `pie()` layer, for slice labels.
- **The new name wins:** when both are set (in the options, the defaults or a responsive override), `labelTransform` is used. Without either, labels show the value as before.
- **`labelInterpolationFnc` keeps working,** marked `@deprecated` in the types with a pointer to `labelTransform`. It's removed in Chartist 3.
- **The 1.x classes** share the axis option types, so they accept `labelTransform` too. 1.x code that sets `labelInterpolationFnc` draws exactly what it drew before.
- **Docs and examples** use `labelTransform`. The examples' 1.x entries (`main.classic.ts`) keep `labelInterpolationFnc`, since they're 1.x code and run against 1.5.0. "Coming from 1.x" mentions the rename.

## Breaking changes vs 1.x

None. `labelInterpolationFnc` behaves as in 1.x; the new option is additive.

## Out of scope

- Removing `labelInterpolationFnc` (Chartist 3).
- Renaming other 1.x options.
- Runtime deprecation warnings: deprecation stays type-level, as for the rest of the 1.x API.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chart-composition`: the `labelTransform` option and its precedence over `labelInterpolationFnc`.

## Impact

- `packages/chartist`:
  - `src/core/types.ts` (axis options), `src/charts/PieChart/PieChart.types.ts`, `src/layers/pie.ts`, `src/layers/axes.ts`, `src/scales/grid.ts`, `src/presets/` (defaults and the pie preset);
  - a small internal resolver for the two names;
  - tests: unit tests for precedence, a 1.x parity check that old code is unchanged, type tests for the deprecation.
- `packages/terminal`: one use of the option.
- `apps/docs` and `packages/examples`: the guides, the API text and the functional examples switch to `labelTransform`; "Coming from 1.x" gets a line.
