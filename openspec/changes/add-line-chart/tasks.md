# Tasks

## 1. Scales

- [ ] 1.1 `src/scales/axis.ts`: axis types, `AxisSetup`, and the chart-rect math (offsets per side, minimum size, 1 px minimum area) ported from `createChartRect`. Verify: unit tests compare the area with `createChartRect` for start/end positions, offsets, padding and tiny sizes.
- [ ] 1.2 `stepAxis`, `autoScaleAxis` and `fixedScaleAxis` factories ported from the 1.x classes. Verify: unit tests compare `ticks`, `range` and `project()` with the 1.x class instances for the same data, options and area (stretch, onlyInteger, low/high, scaleMinSpace, ticks, divisor).
- [ ] 1.3 `src/scales/legacy.ts`: `legacyAxis(type)` for 1.x axis classes and subclasses (detected by `prototype.projectValue`). Verify: unit tests with the three 1.x classes and a custom subclass.
- [ ] 1.4 Pipeline extension: `axes` in `ResolvedConfig`, axis-aware area and axis creation in `layout`, `axes` in the layout payload and the layer context. Verify: the existing pipeline tests still pass, and new tests cover charts with and without axes.

## 2. Grids, labels and renderers

- [ ] 2.1 `src/scales/grid.ts`: grid lines, the grid background and HTML labels as nodes with roles and ctx, using the 1.x geometry and classes. Verify: unit tests against the attributes 1.x `createGrid`, `createGridBackground` and `createLabel` produce.
- [ ] 2.2 Renderers: the XHTML namespace inside `foreignObject` (DOM), and `xmlns` on the first HTML element in it (string). Verify: unit tests; the DOM `span` has `namespaceURI` XHTML; the string output parses as XML with the span in the XHTML namespace.

## 3. Line layer and preset

- [ ] 3.1 `src/layers/line.ts`: series groups, points, line and areas with interpolation, holes, `areaBase`, per-series options and `reverseData`, the 1.x element order and attributes, and the ctx fields for later draw events. Verify: unit tests per feature on the scene.
- [ ] 3.2 `src/presets/lineDefaults.ts` and `src/presets/lineChart.ts`: option merge, the config and the internal preset plugin (1.x groups, root `class`/`style`/`viewBox`), and window-mode responsive options with `change` listeners removed on `destroy`. Verify: unit tests for structure, responsive switching and destroy.

## 4. Parity

- [ ] 4.1 `test/parity/line.spec.ts`: fixtures from the 1.x `LineChart.spec.ts` cases and the options of all line examples, rendered with `LineChart` and with `lineChart` and compared as normalized markup. Verify: all fixtures equal; a deliberate change (e.g. a different point offset) makes the test fail with a readable diff.
- [ ] 4.2 Visual: the `test/visual/fixture/v2-line.ts` shim, a `CHARTIST_LIB=v2` mode in the Vite and Playwright configs (own port, the four event/animation examples skipped), and the Nx target `test:visual:v2`. Verify: `pnpm nx run chartist:test:visual:v2` passes against the unchanged 1.5 baseline for the remaining line examples, and runs the bar and pie examples unchanged.

## 5. Exports, API suite and size

- [ ] 5.1 Export `lineChart`, `line`, `stepAxis`, `autoScaleAxis`, `fixedScaleAxis` and the new types (`@experimental`), and update the export list. Verify: the `test:api:update-exports` diff shows only the new names.
- [ ] 5.2 `test/api/line.v2.api.ts` and `line.v2.test-d.ts`: the delta scenarios (factory vs class, auto scale like 1.x, grid and label nodes), `lineChart` with 1.x options, and responsive options. Verify: `test:api` passes and `test:api:v1` is unchanged.
- [ ] 5.3 Size: an `import { lineChart }` budget from the measured size plus about 5%, and the whole-package budgets re-baselined. Record the numbers next to 1.x `import { LineChart }` in the plan. Verify: `test:size` passes.

## 6. Integration

- [ ] 6.1 Add `test:visual:v2` to the local gate in the plan and run the full gate. Verify: all targets green, and the format check is clean.
- [ ] 6.2 Leave a design note for the compat change: the 1.x `draw` event order (grid and label interleaved per tick; points, line, area per series) versus the v2 compose order. Verify: the note is in the plan under step 4.

## Workflow follow-up

- Archive `add-line-chart` and sync the `chart-composition` spec.
- Next: the compat change (the `LineChart` wrapper, the legacy surface, the compat plugin).
