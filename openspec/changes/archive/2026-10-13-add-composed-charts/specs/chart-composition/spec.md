# Spec Delta

## MODIFIED Requirements

### Requirement: Multiple axes

A cartesian chart SHALL support several axes per direction, each with an id and placed at a side (top, bottom, left, right). Axes on the same side SHALL stack outward by their offsets. Each layer SHALL be bound to one X and one Y axis by id. Each axis SHALL compute its range only from the series of the layers bound to it.

#### Scenario: Left and right Y axes

- **WHEN** a bar layer is bound to a left Y axis and a line layer to a right Y axis
- **THEN** the left axis range covers only the bar values, the right axis range covers only the line values, and both axes show labels on their sides

#### Scenario: Two axes on one side

- **WHEN** two Y axes with offsets 40 and 30 are both on the left side
- **THEN** the chart area starts 70 px further right than without axes, and the second axis's labels sit left of the first axis's labels

#### Scenario: The x/y shorthand

- **WHEN** a chart uses `cartesianAxes({ x, y })` without ids or sides
- **THEN** it renders exactly as before this change

## ADDED Requirements

### Requirement: Layers select their series

A layer SHALL accept a series selection by index or name. A layer without a selection draws all series. Selected series SHALL keep their chart-wide index for classes, keys and data contexts.

#### Scenario: Bars and a line from one data set

- **WHEN** a chart has the series `revenue` and `margin`, a bar layer selects `revenue` and a line layer selects `margin`
- **THEN** the bar layer draws only revenue bars in `g.ct-series.ct-series-a`, and the line layer only the margin line in `g.ct-series.ct-series-b`

### Requirement: Grid and label layers

Composed charts SHALL draw grid lines and axis labels with dedicated layers (`axisGrid`, `axisLabels`) for the axes they name, or for all axes. They SHALL use the 1.x classes (`ct-grids`, `ct-grid`, `ct-labels`, `ct-label`, direction and side classes), so 1.x CSS applies.

#### Scenario: Grid for one axis only

- **WHEN** `axisGrid({ axes: ['quarters', 'revenue'] })` is used on a chart with a third axis `margin`
- **THEN** grid lines exist for `quarters` and `revenue`, and none for `margin`

### Requirement: Category alignment of lines

A line layer SHALL be able to place its points in the middle of each step of a step axis, so a line lines up with bars on the same axis. The default SHALL be the 1.x position.

#### Scenario: Line over bars

- **WHEN** a bar layer and a line layer with `align: 'center'` share a step X axis with four labels
- **THEN** each line point has the same X coordinate as the middle of its category's bars
