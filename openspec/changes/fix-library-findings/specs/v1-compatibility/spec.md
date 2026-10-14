## ADDED Requirements

### Requirement: 1.x behaviors v2 corrects

v2 SHALL correct these 1.x behaviors in both APIs, and the migration guide SHALL list them: an axis's own `low` and `high` win over a bar chart's reference value; a fixed scale axis with `divisor` has a tick at `high`; rounding to 0 digits rounds to integers; donut widths come from CSS unless `donutWidth` is set; `accumulate-relative` stacks negative values below zero with an axis that fits them.

#### Scenario: A bar chart's axis low

- **WHEN** a bar chart is created with `axisY: { low: 10 }` and values from 12 to 18
- **THEN** its value axis starts at 10

### Requirement: Animation events with compat

With the compat plugin, animations started on an element of a 1.x `draw` event SHALL emit `animationBegin` and `animationEnd` on the chart.

#### Scenario: Listening to an animation

- **WHEN** a `draw` listener calls `data.element.animate(…)` on a chart with compat
- **THEN** the chart's `animationBegin` and `animationEnd` listeners run
