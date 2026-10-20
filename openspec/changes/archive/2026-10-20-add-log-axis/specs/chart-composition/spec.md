## ADDED Requirements

### Requirement: Minor grid lines

A created axis SHALL be able to list minor ticks next to its ticks. `axisGrid()` and the presets' grids SHALL draw a grid line for each minor tick the axis places inside the chart area, when the axis shows its grid: a `line` with the axis's grid classes (`ct-grid` and the direction class) plus `ct-grid-minor` (the `gridMinor` class name of `axisGrid()`; the presets always use `ct-grid-minor`), the role `grid`, and a context with the axis, the minor tick's index and `minor: true`. An axis's minor grid lines SHALL come before its other grid lines in the scene, so they're drawn beneath them. Axis labels SHALL ignore minor ticks. The core stylesheet SHALL style `.ct-grid-minor` through `--ct-grid-minor-color`, `--ct-grid-minor-width` and `--ct-grid-minor-dasharray`, lighter than the other grid lines by default and following the color scheme like them. Axes without minor ticks SHALL produce the same scene as before minor ticks existed.

#### Scenario: A custom axis with minor ticks

- **WHEN** a custom axis factory creates an axis with ticks 0 and 10 and minor ticks 2, 4, 6 and 8, and the chart has `axisGrid()` and `axisLabels()`
- **THEN** the output has four `line.ct-grid.ct-grid-minor` elements before the two other grid lines, and two labels

#### Scenario: No grid

- **WHEN** that axis has `showGrid: false`
- **THEN** the output has no minor grid lines

#### Scenario: Restyled with CSS

- **WHEN** a page sets `--ct-grid-minor-color: red` on the chart
- **THEN** the minor grid lines are red and the other grid lines keep their color

#### Scenario: Unchanged charts

- **WHEN** a chart uses only the core's axis types
- **THEN** its scene is the same, node for node, as before minor ticks existed

### Requirement: Axis transforms

An axis factory, and the axis it creates, SHALL be able to declare a transform: a `forward` function, in whose results the axis is linear, and its `inverse`. A layer's `extent` SHALL receive the transforms of the X and Y axis it draws on, or none for axes without one. The presets SHALL keep the transform of an axis factory given as `axisX.type` or `axisY.type`. Axes without a transform SHALL behave as before.

#### Scenario: A transform reaches the layers

- **WHEN** a custom axis factory declares a square root transform and a custom layer reads its axes in `extent` and `compose`
- **THEN** `extent` receives the transform for that axis id's direction, and the created axis in `compose` carries the same transform

#### Scenario: Through a preset

- **WHEN** `barChart` gets `axisY: { type: factory }` and the factory declares a transform
- **THEN** the bar chart's value axis carries that transform

### Requirement: Trend lines on transformed axes

On axes with a transform, `trendLine()` SHALL fit its least-squares straight line to the transformed values (`forward(x)` on a scale X axis, the index on a step axis, and `forward(y)`), skip values whose transformed value isn't a finite number, and draw a straight line between the fitted ends, placed by their values (`inverse` of the fitted transformed values). The context's slope and intercept SHALL be those of the line in transformed values. The values at the line's ends SHALL count towards the Y axis's range as values. On axes without a transform, the fit SHALL be the same as before.

#### Scenario: An exponential trend on a log axis

- **WHEN** a line chart on a base 10 log Y axis has the values 1, 10, 100 and 1,000 on a step X axis and a `trendLine()` layer
- **THEN** the trend line runs from the point of the first value to the point of the last, and its context has the slope 1 and the intercept 0

#### Scenario: Values without a place

- **WHEN** a series on a log Y axis has the values 0, 10, 100 and 1,000
- **THEN** the trend line is fitted to 10, 100 and 1,000 only

#### Scenario: Linear axes unchanged

- **WHEN** a line chart's series `[1, 2, 4, 3, 5]` on the default axes gets `trendLine()`
- **THEN** its context has the slope 0.9, as before
