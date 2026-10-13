# Tasks

## 1. Pipeline

- [x] 1.1 Layout without axes uses the 1.x minimums (D1). Verify: a unit test compares with 1.x `createChartRect` for normal and too-small sizes, and the existing pipeline tests pass (the 0-size test updated to 1 px).

## 2. Pie chart

- [x] 2.1 `layers/pie.ts` (D2) with `moveLabel`. Verify: unit tests for donut widths (px and %), label positions and anchors, `ignoreEmptyValues`, a single value, and `preventOverlappingLabelOffset`.
- [x] 2.2 `presets/pieDefaults.ts` and `presets/pieChart.ts` (D3). Verify: unit tests for structure (pie and donut root classes) and responsive options.
- [x] 2.3 `PieChart` as a `PresetChart` subclass with `moveLabel`, keeping `determineAnchorPosition`; `PieChart.spec.ts` adds `compat`. Verify: the 1.x pie tests pass.
- [x] 2.4 Compat: `slice` and `label` payloads, no axes for pies, axis events ignoring pie labels. Verify: the line and bar event parity tests stay green, and a pie unit test checks the payload fields.

## 3. Parity and contract

- [x] 3.1 `test/parity/pie-fixtures.ts`, `pie.spec.ts` and `pie-events.spec.ts` against `chartist-v1`. Verify: all fixtures pass; a deliberate change to the 0.2° overlap fails with a readable diff.
- [x] 3.2 `test:api`: `withCompat` for the pie constructions, export lists (`pieChart`, `pie`, new types), and `pie.v2.api.ts`. Verify: `test:api` and `test:api:v1` pass.
- [x] 3.3 The `donut-animation` example imports `compat`. Verify: `test:visual` and `test:visual:v1` pass unchanged.

## 4. Integration

- [x] 4.1 Size budgets (`import { pieChart }`, `import { PieChart }`, whole package) recorded in the plan; the roadmap updated. Verify: the full local gate and the format check pass.

## Workflow follow-up

- Archive `add-pie-chart` and sync `chart-pipeline`.
- Next: the legacy surface move (`src/legacy/`), then step 6 (multiple axes, composition, container queries).
