# Tasks

## 1. Stacking and axes (agent 1)

- [ ] 1.1 `Layer.extent` and axes merging it (D6); the bar layer's stacked extent; the preset on the same path.
- [ ] 1.2 accumulate-relative extent and stack selection (#1473, #1469); stack mode tests.
- [ ] 1.3 `cartesianAxes({ x, y })` defaults (#1484); `stepAxis()` ticks from labels (#1475).
- [ ] 1.4 #1476, #1022, #1470 with unit tests.

## 2. Presets, handles and events (agent 2)

- [ ] 2.1 `PresetHandle.setOptions` (D2); `update({ data })` keeps preset data (#1472); type tests.
- [ ] 2.2 `on` in preset options (D3); type tests.
- [ ] 2.3 `off(name)` removes only your listeners (D4).
- [ ] 2.4 The default `ct-chart-*` class (D5, #1481).
- [ ] 2.5 Animation events with compat (D8, #1489).

## 3. Pie, SVG, rendering and exports (agent 3)

- [ ] 3.1 Donut width from CSS (D7, #1474); donut labels and the overlap offset (#1485, #478).
- [ ] 3.2 #1490, #1424, #1482; exports #1480, #1488 and the export lists.
- [ ] 3.3 Breakpoint screenshots for `bar/extreme-responsive` and `bar/view-box`.

## 4. Integration

- [ ] 4.1 Own baselines for the examples whose output changes on purpose, reviewed, in their own commit (D1).
- [ ] 4.2 Docs: the pages that work around the fixes, "Coming from 1.x" → What changed, doc comments that describe the old behavior.
- [ ] 4.3 Plan updated; findings marked fixed; full gate. Commits name `Fixes #n`.
