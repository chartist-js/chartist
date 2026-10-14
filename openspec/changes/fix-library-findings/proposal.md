# Proposal

## Why

Writing the docs, the examples and the API reference turned up library bugs and gaps, now tracked on GitHub under the `v2` label. v2.0 freezes the functional API, so what would change its shape or defaults later has to be settled before the release, and the bugs readers would hit in the docs' own examples should be gone. The author prioritized them (2026-10-14): tiers 1 and 2 in this change, tier 3 after 2.0. Bugs that behave the same in 1.x are fixed too, for the 1.x classes as well: v2 is a major version, and each change is listed in the migration guide.

## What Changes

Tier 1, API shape and data:

- **#1472** Preset charts keep data given to `update()` when a responsive breakpoint changes.
- **#1473, #1469** `accumulate-relative` stacks positive values up and negative values down, with an axis that fits both; tests for every stack mode.
- **#1483** A stacked `bar()` layer in `chart()` fits its axis to the stacks.
- **#1474** Donut widths come from CSS (`--ct-donut-width`) unless `donutWidth` is set.
- **#1484** `cartesianAxes({ x, y })` has the list form's defaults.
- **#1486** `off(name)` without a listener removes only your listeners, never plugins'.
- **#1477** The preset charts' handles can change options after creation.
- **#1478** The preset charts take an `on` option, so listeners see the first render.
- **#1475** `stepAxis()` ticks default to `data.labels`.
- **#1481** `chart()` gives its SVG a `ct-chart-*` class from its layers.
- **#1489** `animationBegin` and `animationEnd` fire with compat for elements of `draw` events.

Fixed for v2 though 1.x does the same:

- **#1476** An axis's own `low`/`high` wins over the bar chart's reference value.
- **#1022** `fixedScaleAxis` with `divisor` puts a tick at `high`.
- **#1470** `roundWithPrecision(value, 0)` rounds to whole numbers.

Tier 2:

- **#1482** The size probe writes valid CSS.
- **#1480, #1488** `domRenderer`, `estimateText` and `ResponsiveWatcher` are exported.
- **#1490** `Svg#remove()` returns the parent.
- **#1424** Text measuring uses the container's document.
- **#1485, #478** Donut labels follow `labelPosition`; the overlap offset measures the drawn labels.
- The two responsive examples without breakpoint screenshots get them (`add-docs-examples` finding 4).

And the docs: pages that work around these (set `low` for accumulate-relative, set `className` by hand, listeners as plugins, `donutWidth` instead of the custom property) show the fixed behavior, "Coming from 1.x" lists what changed from 1.x, and the doc comments that describe the bugs are updated.

**Not in this change:** tier 3 (#1479 server rendering for presets, #1487 per-axis label alignment, #1491 SvgPath, #1471, #876, #633), and CI for the visual baseline (the release).

## Capabilities

### Modified Capabilities

- `chart-pipeline`: `off()` semantics.
- `chart-composition`: stacked bar extents, axis defaults, default ticks, the chart class.
- `v1-compatibility`: the 1.x behaviors v2 changes; animation events with compat.
- `visual-regression`: examples whose output changes on purpose get a reviewed baseline of their own.

## Impact

- `packages/chartist/src`: presets, layers (bar, pie), scales, pipeline emitter, chart, render, svg, core math and high/low, compat; unit tests for each fix; type tests for the new preset handle and options.
- `packages/examples`: own baselines where the output changes on purpose; two new breakpoint screenshots.
- `apps/docs`: the pages above, the migration guide's "What changed", the API reference (from the comments).
- GitHub: commits say `Fixes #n`, so the issues close when `next` reaches `main`.
