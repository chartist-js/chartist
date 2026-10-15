## MODIFIED Requirements

### Requirement: 1.x behaviors v2 corrects

v2 SHALL correct these 1.x behaviors in both APIs, and the migration guide SHALL list them: an axis's own `low` and `high` win over a bar chart's reference value; a fixed scale axis with `divisor` has a tick at `high`; rounding to 0 digits rounds to integers, in `roundWithPrecision` and `SvgPath`; donut widths come from CSS unless `donutWidth` is set, and in the page the ring is laid out for that width; `accumulate-relative` stacks negative values below zero with an axis that fits them; a slice that fills the circle is drawn centred; smoothed lines connect x values in descending order; holes given as `{ x, y: null }` leave gaps with every interpolation; a chart-level `low` or `high` that empties the value range is repaired instead of looping; a next tick at position 0 counts when sizing labels; a line chart's top-level `referenceValue` applies to its default Y axis; label spans carry no `xmlns` attribute; series p to z are coloured; `SvgPath` splits, joins, parses, scales and translates consistently; options arrays from another realm stay arrays; a `detach()` during the first render sticks; a missing target throws once; charts use their container's document and window; printed charts scale to the printed box.

#### Scenario: A bar chart's axis low

- **WHEN** a bar chart is created with `axisY: { low: 10 }` and values from 12 to 18
- **THEN** its value axis starts at 10

#### Scenario: A single-value donut

- **WHEN** a donut is drawn for `series: [5]` with `startAngle: 34`
- **THEN** the ring's centre is the chart's centre within 0.01 px, with the class and the function

#### Scenario: Descending x values

- **WHEN** a line chart with the default smoothing draws `[{ x: 3, y: 1 }, { x: 2, y: 4 }, { x: 1, y: 2 }]` on an auto scale X axis
- **THEN** its path draws one connected line through the three points

#### Scenario: Object holes with step interpolation

- **WHEN** a line chart with `lineSmooth: Interpolation.step()` draws `[{ x: 1, y: 1 }, { x: 2, y: null }, { x: 3, y: 2 }]`
- **THEN** its path has a gap at x 2 and contains no `NaN`

#### Scenario: Equal low and high on a stacked bar chart

- **WHEN** a stacked horizontal bar chart with `onlyInteger` gets a chart-level `low` equal to its stacked high
- **THEN** it renders without an error, with a value axis that contains the bars

#### Scenario: Line chart reference value

- **WHEN** a line chart is created with `referenceValue: 0` and values from 5 to 8
- **THEN** its Y axis starts at 0, and an `axisY.referenceValue` wins over the top-level one

#### Scenario: Serialized chart parses

- **WHEN** a chart with HTML labels is serialized with `XMLSerializer` and parsed as SVG
- **THEN** parsing succeeds

#### Scenario: Rounding a path to integers

- **WHEN** `new SvgPath(false, { accuracy: 0 }).move(0.4, 0.6).stringify()` runs
- **THEN** it returns `M0,1`, and `accuracy: false` keeps the decimals

#### Scenario: Missing target

- **WHEN** `new LineChart('#missing', data)` throws because no element matches and the timers run afterwards
- **THEN** nothing else throws
