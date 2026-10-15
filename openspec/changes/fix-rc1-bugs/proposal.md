# Proposal

## Why

All 206 open issues were checked against the published 2.0.0-rc.1 on 2026-10-15, and 127 were closed as fixed, answered or obsolete. Of the rest, most are feature requests. These are real bugs: each is reproduced on rc.1, traced to a file and line, and has a small, contained fix. Most are 1.x bugs too, so they're fixes that 2.0 should ship with. The author asked (2026-10-15) to fix them in one change, against their existing issues, and to open issues for the ones that have none.

## What Changes

**Pie and donut**

- **#842 (and its duplicate #903):** an object `chartPadding` over a numeric default throws ("Cannot create property 'right' on number '5'"). It affects pies, and any chart whose responsive options or `setOptions()` put an object over a number. `extend` starts from an empty object when the target isn't one, and the pie default becomes an object of 5s.
- **#1302:** a slice that fills the circle (one value) is drawn as one arc between points 0.02 px apart, so rounding moves its centre by up to 5.8 px. It's drawn as two half-circle arcs instead.
- **#1493:** the donut ring is laid out for 60 px whatever `--ct-donut-width` says, although the spec says donut widths come from CSS. The DOM renderer measures the computed stroke width of a donut slice in the container, as it measures text. Server rendering keeps `donutWidth` or 60.
- **#1456:** series p to z get no colour, because the stylesheet stops at o. The default styles cover a to z and cycle the 15 colours, with each extra series falling back to the property of the series whose colour it repeats.

**Lines and axes**

- **#1038 (and its duplicate #1075):** with the default smoothing, x values in descending order draw no line. Monotone cubic interpolation breaks the line only where x repeats or changes direction, not wherever it decreases.
- **#1040:** `{ x, y: null }` holes give `NaN` in the path with `Interpolation.step()` and `simple()`. Both check the y value of a hole, like the other interpolations.
- **#1057:** a stacked bar chart whose `low` equals its high loops forever in `gcd` (or draws at `NaN`). The empty-range repair runs again after the chart-level `low`/`high` are applied, and `rho`/`gcd` stop on non-finite input.
- **#1471:** a next tick at position 0 is taken for "no next tick" when computing label lengths, so a bar label can be drawn over its neighbour. The check uses the index.
- **New issue:** `lineChart()` ignores the top-level `referenceValue` its options document. It's applied to the default Y axis, and the axis's own value wins, as for bars.

**Lifecycle and environment**

- **#876:** options arrays from another realm (iframe, `vm`) are turned into objects, and the charts throw. `extend` uses `Array.isArray`.
- **#1492 (rest of #1424):** `Svg` checks `instanceof Element`, and responsive options and the 1.x classes' resize listener use the global `window`. So charts in another document fail, or follow the wrong window. Chartist uses the container's document and window.
- **#929:** `detach()` called during the first render doesn't stick: from `created` on the 1.x classes, from a listener on `chart()`, and it even throws on the presets. All three subscribe before the first render or remember the detach.
- **#118:** charts don't fit when printed, because they're laid out at screen size. During printing the chart's SVG gets a `viewBox` of its layout size, so it scales to the printed box.
- **New issue:** `new LineChart('#missing')` throws as it should, then crashes again on a timer. The first render is scheduled only after the target check.

**SVG**

- **#1491:** four `SvgPath` inconsistencies:
  - `accuracy: 0` doesn't round;
  - `splitByCommand` pieces lose `close` and `accuracy`;
  - `join` shares commands with its sources;
  - `parse` fails on H, V, Q, S, T, exponents, negative numbers without a separator and implicit repeats.

  A fifth bug, found while checking: `scale` and `translate` change an arc's radius, rotation and flags.

- **#1217:** HTML label spans get an extra `xmlns="http://www.w3.org/2000/xmlns/"`, so serialized charts don't parse as SVG. The attribute is dropped.

**Docs (new issue)**

- "Coming from 1.x" says the classes redraw on window resize; they also follow their container.
- The axes guide says `low`/`high` fix the scale's ends; the auto scale still rounds them out to a step.
- The server rendering guide says the presets take `labels`; `pieChart()` and the 1.x classes don't.

**GitHub, each step with the author's go**

- Open the three new issues, drafted in the author's voice (`issues.md` in this change).
- Close #903 as a duplicate of #842, #1075 as a duplicate of #1038, and #1424 as a duplicate of #1492.
- Reference the issues in the commits, so they close when the fixes reach `main`.

## Breaking changes vs 1.x

None that break working code. These change what 1.x code gets, all of them corrections of 1.x bugs:

- **Drawing changes:**
  - a full-circle slice is centred;
  - descending x values draw a line;
  - `NaN` paths, the bar-label overlap and the stack overflow are gone;
  - a top-level `referenceValue` works on line charts;
  - series p to z are coloured.
- **Markup:** label spans lose the extra `xmlns` attribute.
- **`SvgPath`:** `accuracy: 0` rounds to integers, and `split`/`join`/`parse`/`scale`/`translate` behave consistently.
- **In an iframe,** media queries follow the iframe's window, not the top window.
- **Printed charts** scale to the page.

Each goes into "1.x behaviors v2 corrects" and the migration guide. No committed example draws differently, so the visual baselines don't change.

## Out of scope

- Feature requests among the open issues: grid line at the right edge of bars (#921/#966), pie `reverseData` (#924), an empty-donut placeholder (#895), bar baselines (#701, #1045, #1084), log and time axes, new chart types, label wrapping in pies, and the rest.
- The other open "partly" issues, unless listed above.
- A re-layout at the print width (the browsers disagree about it); this change only scales.
- `measureStyle` for `toScene()`: server rendering documents `donutWidth` instead.

## Capabilities

### Modified Capabilities

- `v1-compatibility`: more 1.x behaviors v2 corrects.
- `chart-rendering`: style measurement for layout, charts in another document, printing.
- `chart-composition`: detaching during the first render, object options over numeric defaults, a missing target on the 1.x classes.
- `chart-theming`: series a to z, colours cycling with fallbacks.
- `responsive-options`: media queries use the container's window.

## Impact

- `packages/chartist/src`:
  - `utils/extend.ts`, `presets/pieDefaults.ts`, `layers/pie.ts`;
  - `render/` (style measurement) and `chart/chart.ts` (style measurement, subscribe before render, print);
  - `interpolation/monotoneCubic.ts`, `step.ts`, `simple.ts`, `core/data/bounds.ts` and `highLow`, `core/math.ts`;
  - `presets/barChart.ts`, `presets/lineChart.ts`, `presets/preset.ts`, `compat/index.ts`;
  - `scales/grid.ts`, `axes/Axis.ts`, `svg/Svg.ts`, `svg/SvgPath.ts`;
  - `responsive/responsive.ts`, `charts/BaseChart.ts`, `charts/PresetChart.ts`, `core/creation.ts`;
  - the styles (`_settings.scss`, `index.scss`).
- Tests: unit tests next to each fix, API tests (v2-only where 1.5.0 has the bug), adjusted 1.x-ported pie tests and parity fixtures for single values, a JSDOM-without-globals API test, a print test, and the CSS size budget.
- Docs: "Coming from 1.x", the axes guide, the server rendering guide, "Pie and donut charts" and "Styling with CSS".
- No new dependencies. The CSS grows by about 300 bytes gzipped, so its size budget rises from 1.5 kB to 1.8 kB.
