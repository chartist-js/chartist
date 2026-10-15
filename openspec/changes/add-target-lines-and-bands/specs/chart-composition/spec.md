## ADDED Requirements

### Requirement: Target line layer

The `targetLine()` layer SHALL draw one or several lines across the chart area at constant values on one axis: an axis id, by default the first Y axis. On a Y axis the lines SHALL be horizontal; on an X axis, vertical. On a step axis a value SHALL be a position by index, as for the axis's ticks. Each line SHALL accept an optional label and an optional class. A label SHALL be drawn as SVG text next to its line, inside the chart area, at the line's end by default or at its start. The layer SHALL report its values as its extent, so the axis includes them (an axis's own `low` and `high` still win). A value outside the axis's range SHALL draw nothing. The layer SHALL support only `cartesian` coordinates.

#### Scenario: One labeled line

- **WHEN** a line chart's Y axis goes from 0 to 800 and `targetLine({ value: 1000, label: 'Target' })` is one of its layers
- **THEN** the Y axis goes up to at least 1000, and the output has one horizontal `line.ct-target-line` across the chart area at 1000 and a `text.ct-target-label` reading "Target" at its right end

#### Scenario: Several lines

- **WHEN** `targetLine({ lines: [{ value: 20, label: 'Min' }, { value: 80, label: 'Max', className: 'ct-series-b' }] })` is a layer
- **THEN** the output has two target lines in a `g.ct-target-lines` group, in that order, and the second line and its label carry the class `ct-series-b`

#### Scenario: A vertical line

- **WHEN** a horizontal bar chart has `targetLine({ axis: 'value', value: 50 })` and `value` is its X axis id
- **THEN** the target line is vertical, at 50 on that axis, from the top to the bottom of the chart area

#### Scenario: Unknown axis

- **WHEN** a target line names an axis id the chart doesn't have
- **THEN** creating the chart throws an error naming the layer and the id

### Requirement: Band layer

The `band()` layer SHALL fill the area between a low and a high edge, on one X and one Y axis like the line layer. Each edge SHALL be a constant value (a number) or a series: its name, or `{ series }` with a name or an index, since a bare number is a constant. Alternatively, `series` SHALL select a group of series, and the band SHALL cover the minimum to the maximum of their values at each value index. Series the band uses SHALL stay visible to the other layers: a layer without a series selection still draws them. The edges SHALL follow the same interpolation option as the line layer (`lineSmooth`, smooth by default), and `align: 'center'` SHALL line the band up with bars on a step axis as it does for lines. Where an edge has a hole, or no series of a group has a value, the band SHALL break, like a line's area. With `mark: true`, the band SHALL give every `point` and `bar` node of the chart whose value at its value index lies between the band's edges (edges included) the class `ct-in-band`, and every other one with a value the class `ct-out-band`; nodes at an index where the band has a hole SHALL get neither. Without `mark`, the band SHALL change no other layer's nodes. The band's values SHALL count towards its axes' range. The layer SHALL support only `cartesian` coordinates.

#### Scenario: Between two series

- **WHEN** a chart has series `p10` and `p90` and `band({ low: 'p10', high: 'p90' })` is a layer
- **THEN** the output has one `path.ct-band-area` whose upper edge follows `p90` and whose lower edge follows `p10`, inside a `g.ct-band` group

#### Scenario: The range of a group

- **WHEN** a chart has three team series and `band({ series: ['a', 'b', 'c'] })` is a layer
- **THEN** at each value index the band's upper edge is at the largest of the three values and its lower edge at the smallest

#### Scenario: Constant edges

- **WHEN** `band({ low: 40, high: 60 })` is a layer of a line chart
- **THEN** the band fills the chart area's full width between 40 and 60 on the Y axis, and the Y axis includes 40 and 60

#### Scenario: A hole in an edge

- **WHEN** the high edge series has a hole at value index 3
- **THEN** the band is drawn as two paths, one before and one after index 3

#### Scenario: Marking values in and out of the band

- **WHEN** a chart has `band({ low: 40, high: 60, mark: true })` and a line layer with the values 30, 50 and 70
- **THEN** the points at 30 and 70 get the class `ct-out-band`, the point at 50 gets `ct-in-band`, and a bar layer's bars are marked the same way

#### Scenario: No marking by default

- **WHEN** a band is created without `mark`
- **THEN** no node of any other layer gets `ct-in-band` or `ct-out-band`

#### Scenario: Missing edge

- **WHEN** `band({ low: 10 })` is created without a high edge or a group
- **THEN** it throws an error saying the band needs `low` and `high`, or `series`

### Requirement: Layer refinement

A layer SHALL be able to define an optional `refine` method. Once every layer of the chart has composed its nodes and the nodes have their keys, `refine` SHALL be called for each node with a role, from all layers, children before their parents, with the node and the refining layer's own compose context. It SHALL return a changed node, or `undefined` to leave the node unchanged. It SHALL NOT be able to drop a node or change the scene's structure. With several refining layers, each node SHALL pass through their `refine` methods in the order of `layers`. Charts without a refining layer SHALL render exactly as if refinement didn't exist. Custom layers SHALL be able to define `refine` like built-in ones.

#### Scenario: A layer marks another layer's nodes

- **WHEN** a custom layer listed before a line layer defines `refine` that adds `ct-marked` to every `point` node
- **THEN** every point of the line layer has the class `ct-marked`, although the line layer composes after it

#### Scenario: Refiners in list order

- **WHEN** two layers define `refine`, the first adding `ct-a` to points and the second adding `ct-b` only to points that have `ct-a`
- **THEN** every point has both classes

#### Scenario: Unchanged structure and keys

- **WHEN** a refining layer returns changed nodes
- **THEN** every node keeps its key and its place in the scene

#### Scenario: No refining layer

- **WHEN** a chart has no layer with `refine`
- **THEN** its scene equals the scene before refinement existed

### Requirement: Extra layers on presets

`lineChart`, `barChart` and `pieChart` SHALL accept a `layers` option with two optional lists: `below`, drawn after the grid and before the chart's series, and `above`, drawn after the series and before the axis labels. The extra layers SHALL draw on the preset's axes and receive all series. Responsive options SHALL merge into `layers` like the other preset options: a list they give replaces that list, and the other list stays. A preset without `layers` SHALL render exactly as before.

#### Scenario: A target line on a bar chart preset

- **WHEN** `barChart('#chart', data, { layers: { above: [targetLine({ value: 1000 })] } })` is called
- **THEN** the target line is drawn on top of the bars, before the axis labels in the output

#### Scenario: A band below the lines

- **WHEN** `lineChart` gets `layers: { below: [band({ low: 2, high: 6 })] }`
- **THEN** the band is drawn above the grid and below the series' lines and points

#### Scenario: Unchanged output

- **WHEN** a preset is called without `layers`
- **THEN** its output is identical to the output before this option existed
