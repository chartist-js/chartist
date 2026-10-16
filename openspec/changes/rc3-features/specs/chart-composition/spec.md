## ADDED Requirements

### Requirement: Bar layer offset

The `bar()` layer SHALL take an `offset` in px that moves all its bars along the label axis: to the right for vertical bars with a positive offset, down for horizontal bars. The value axis and the bars' lengths SHALL not change. Without `offset`, bars SHALL be drawn as before.

#### Scenario: Grouped stacks

- **WHEN** a chart has `bar({ series: ['2024 new', '2024 returning'], stackBars: true, offset: -8 })` and `bar({ series: ['2025 new', '2025 returning'], stackBars: true, offset: 8 })`
- **THEN** each label has two stacks 16 px apart, centered on the label, each stacking only its own series

#### Scenario: Horizontal bars

- **WHEN** a horizontal bar layer has `offset: 6`
- **THEN** its bars are drawn 6 px lower than without it

### Requirement: Trend line layer

The `trendLine()` layer SHALL fit a least-squares straight line through the values of each series it selects (all by default) and draw it from the series' smallest to its largest X: on a step axis X is the value index, on a scale axis the value's `x`. It SHALL skip holes, draw nothing for a series with fewer than two values, and take `x`, `y`, `align` (as the line layer) and `classNames`. Each line SHALL be a `line.ct-trend-line` with the role `trendLine` inside a series group with the series' classes, so it takes the series' color, and its context SHALL carry the series index, the slope and the intercept. The values at the line's ends SHALL count towards the Y axis's range. The layer SHALL support only `cartesian` coordinates.

#### Scenario: A rising series

- **WHEN** a line chart's series `[1, 2, 4, 3, 5]` gets `trendLine()` as an extra layer
- **THEN** a `line.ct-trend-line` in `g.ct-series-a` runs from the fitted value at index 0 to the fitted value at index 4, and its context has the slope 0.9

#### Scenario: Ends outside the values

- **WHEN** the fitted line's end lies below the smallest value of the series
- **THEN** the Y axis extends to include it

#### Scenario: Too few values

- **WHEN** a selected series has one value and holes
- **THEN** no trend line is drawn for it

### Requirement: Label alignment per axis

An axis SHALL take `labelAlign` (`horizontal` and `vertical`, as the `align` of `axisLabels()`) in the preset axis options (`axisX`, `axisY`) and in the axes of `cartesianAxes()`. It SHALL align that axis's SVG text labels and win over the `align` of `axisLabels()`. HTML labels SHALL ignore it, as they ignore `align`.

#### Scenario: X centered, Y at the end

- **WHEN** a line chart with `labels: 'svg'` has `axisX: { labelAlign: { horizontal: 'middle' } }` and `axisY: { labelAlign: { horizontal: 'end' } }`
- **THEN** the X labels are centered in their boxes and the Y labels end-aligned

#### Scenario: The axis wins over the layer

- **WHEN** `axisLabels({ align: { horizontal: 'start' } })` draws an axis with `labelAlign: { horizontal: 'end' }`
- **THEN** that axis's labels are end-aligned and the other axes' labels start-aligned
