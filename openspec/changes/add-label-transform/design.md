## Context

- `AxisOptions` in `packages/chartist/src/core/types.ts` declares `labelInterpolationFnc` for the 1.x classes and the presets alike; the presets' axis option types and `cartesianAxes()` axis definitions build on it.
- Axis labels are resolved in `layers/axes.ts` (`drawnOptions`, which defaults to identity) and applied in `scales/grid.ts` (`axis.ticks.map(options.labelInterpolationFnc)`).
- Pie labels: `PieChartOptions.labelInterpolationFnc` (`charts/PieChart/PieChart.types.ts`), passed by `presets/pieChart.ts` to `pie()` (`layers/pie.ts`).
- The preset defaults (`lineDefaults.ts`, `barDefaults.ts`, `pieDefaults.ts`) set `labelInterpolationFnc` to an identity function, as 1.x did.
- 15 of the examples' `main.classic.ts` files and 20 `main.ts` files use the option. The visual tests render the classic entries against 1.5.0.

## Goals / Non-Goals

**Goals:** one resolution rule in one place; no change in output for 1.x code.

**Non-Goals:** runtime warnings; touching the 1.x `Axis` class (exported, deprecated as a whole), which keeps reading `labelInterpolationFnc`.

## Decisions

- **Name: `labelTransform`**, as proposed in #215. It says what the function does: a value goes in, the label comes out.
- **One resolver:** `labelTransformOf(options)` returns `options.labelTransform ?? options.labelInterpolationFnc ?? identity`. `layers/axes.ts` and `layers/pie.ts` call it; `scales/grid.ts`'s `DrawnAxisOptions` field becomes `labelTransform`.
- **No default on the new name.** The defaults move from `labelInterpolationFnc: identity` to nothing: the resolver supplies identity. A default on either name would beat a user's option under "the new name wins" (a default `labelTransform` would hide a user's `labelInterpolationFnc`). The 1.x classes read their options through the presets, so they get the same resolution. Their output is unchanged, which the parity and visual tests show.
  - *Alternative:* keep the default on the old name only. Rejected: it keeps the deprecated name alive in our own code, and resolution then depends on where a value came from.
- **Shared types:** `labelTransform` joins `AxisOptions` and `PieChartOptions`, so the presets, `cartesianAxes()` and the 1.x classes take it alike. `labelInterpolationFnc` gets `@deprecated Use labelTransform; removed in Chartist 3.` The export deprecation list (`deprecated.json`) records export names, not properties, so it doesn't change. A type test checks the tag survives in the declaration files.
- **Docs:** guides, examples' `main.ts` and API comments switch. `main.classic.ts` files keep the old name (1.x code). "Coming from 1.x" gets one line under the option changes.

## Risks / Trade-offs

- [Two names for a while] → The types steer to the new one, and the guides only show it.
- [A responsive override with the old name over a base with the new one] → The new name wins, as the rule says; the guide's responsive section shows the new name only.

## Migration Plan

Replace `labelInterpolationFnc` with `labelTransform`; nothing else changes. Record in `docs/decisions.md` at archive time: the option is renamed, the old name is removed in Chartist 3.
