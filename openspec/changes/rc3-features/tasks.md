# Tasks

## 1. Dark defaults (#1463)

- [ ] 1.1 Add the dark label and grid defaults in `@supports (color: light-dark(...))`, with `$ct-text-color-dark` and `$ct-grid-color-dark` (`false` leaves them out). Verify: a compiled-CSS test, a Playwright test of the computed label color under `color-scheme: dark` and without it, screenshots of a dark page checked by looking, and `chartist:test:visual` unchanged

## 2. `bar()` offset (#262)

- [x] 2.1 Add `offset` to `bar()` for every bar mode, with its doc comment. Verify: unit tests for the "Bar layer offset" scenarios (grouped stacks, horizontal bars, no offset unchanged)

## 3. Trend line (#1209)

- [ ] 3.1 Add `layers/trendLine.ts` (fit, drawing, extent, `align`, `classNames`), the `trendLine` role and its context, and the export. Verify: unit tests for the "Trend line layer" scenarios, export and type lists updated, `chartist:test:api`
- [ ] 3.2 Add the trend line styles and the class to `ct-chart-series-color`. Verify: the compiled-CSS test and a screenshot

## 4. Label alignment per axis (#1487)

- [x] 4.1 Add `labelAlign` to `AxisOptions`, used by `axisLabels()` (over its `align`) and the presets' label layer. Verify: unit tests for the "Label alignment per axis" scenarios

## 5. Line breaks in pie labels (#546)

- [x] 5.1 Split pie labels at `\n` into centered `tspan` lines. Verify: unit tests for the "Line breaks in pie labels" scenarios, `chartist:test:visual` and `test:visual:v1` unchanged, the terminal tests

## 6. Docs, examples and the gate

- [ ] 6.1 Document each addition in its guide (styling with CSS, bar charts or composed charts, target lines and bands or line charts, axes and scales, pie and donut charts), and add gallery examples for grouped stacks and a trend line. Verify: `docs:check` samples, screenshots in light, dark and at 390 px
- [ ] 6.2 Record the two gallery baselines on the reference platform, and run the gate: lint, typecheck, test, build, `test:api`, `test:size`, visual, docs e2e. Verify: all green
