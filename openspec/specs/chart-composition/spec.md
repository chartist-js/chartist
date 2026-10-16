# chart-composition Specification

## Purpose

Defines how a single chart combines several layers and axes, so mixed chart types and multi-axis charts are possible, and how the 1.x chart types are expressed on top of that model.

## Requirements

### Requirement: Functional chart API

`chart(target, config)` SHALL create a chart from data, axes, layers, plugins and listeners, render it synchronously and return a handle with `update`, `destroy`, `on` and `off`. Layers, axes, renderers and plugins SHALL be created by factory functions. Listeners and plugins passed in `config` SHALL receive the events of the first render.

#### Scenario: Synchronous first render

- **WHEN** `chart('#el', { data, layers: [line()], on: { mount: fn } })` returns
- **THEN** the chart is rendered in `#el` and `fn` has been called once

#### Scenario: Updating and destroying

- **WHEN** `update({ data })` and then `destroy()` are called on the handle
- **THEN** the chart re-renders with the new data, and after `destroy` its output, resize observation and listeners are removed

### Requirement: Charts are composed of layers

A chart SHALL accept one or more layers. Each layer renders its own series (e.g. line, area, bar, scatter, pie) in a shared chart area and coordinate system. Layers SHALL render in declaration order.

#### Scenario: Bar and line combined

- **WHEN** a chart is configured with a bar layer for revenue and a line layer for margin on the same X axis
- **THEN** bars and the line are rendered in one SVG, aligned to the same X positions, with the line drawn above the bars

### Requirement: Custom layers

A layer SHALL be a plain object with a type name, the coordinate systems it supports, and a compose function. The compose function receives the prepared data, the chart area and its layer index, and returns scene nodes. Layers written outside Chartist SHALL work exactly like built-in layers: their nodes go through the per-node `compose` events and appear in the scene and the output in declaration order.

#### Scenario: A user-defined layer

- **WHEN** a chart is created with a custom layer whose compose function returns one `circle` node with role `point` per value
- **THEN** the output contains those circles, and a `compose` listener receives each of them with its role and data context

#### Scenario: Layer order

- **WHEN** a chart has two custom layers
- **THEN** the nodes of the first layer come before the nodes of the second layer in the scene and the output

#### Scenario: Unsupported coordinate system

- **WHEN** a custom layer that supports only `cartesian` is used in a `polar` chart
- **THEN** creating the chart throws an error naming the layer type and the coordinate system

#### Scenario: Keys for layer nodes

- **WHEN** a custom layer returns nodes without keys for series and values
- **THEN** each data node gets a key derived from the layer index, series index and value index

### Requirement: Axis factories

Axis types SHALL be created by factory functions (`stepAxis`, `autoScaleAxis`, `fixedScaleAxis`) that return plain axis objects. An axis SHALL compute its range and ticks from the data bound to it and project values into the chart area with the 1.x scale rules (bounds, `scaleMinSpace`, `onlyInteger`, `low`/`high`, `ticks`, `divisor`). Presets SHALL also accept the 1.x axis classes as an axis `type` and treat them as the matching factory.

#### Scenario: Factory and class give the same axis

- **WHEN** one line chart uses `axisY: { type: FixedScaleAxis, ticks: [0, 5, 10] }` and another uses the `fixedScaleAxis` factory with the same ticks
- **THEN** both render the same grid lines and labels

#### Scenario: Auto scale like 1.x

- **WHEN** a line chart with values 1 to 9 uses the default Y axis with `onlyInteger: true`
- **THEN** the Y labels and grid positions are the same as those of 1.5 for the same data, options and size

#### Scenario: Grid and label nodes

- **WHEN** a `compose` listener observes a line chart
- **THEN** it receives grid nodes with role `grid` and label nodes with role `label`, each carrying the axis and tick index in its data context

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

### Requirement: Coordinate systems

A chart SHALL use either a cartesian or a polar coordinate system. Layers SHALL declare which systems they support. Combining a layer with an unsupported system SHALL raise a descriptive error.

#### Scenario: Pie in polar coordinates

- **WHEN** a pie layer is used in a polar chart
- **THEN** slices are laid out around the chart center

#### Scenario: Unsupported combination

- **WHEN** a bar layer is configured in a polar chart
- **THEN** creating the chart throws an error naming the layer and the unsupported coordinate system

### Requirement: 1.x chart types as presets

`lineChart`, `barChart` and `pieChart` SHALL be preset functions over `chart` that take the 1.x arguments (target, data, options, responsive options) with the 1.x defaults. Their output SHALL match 1.x for the same input.

#### Scenario: Preset function

- **WHEN** `barChart('#chart', data, { stackBars: true })` is called
- **THEN** it returns a chart handle, and the output matches `new Chartist.BarChart('#chart', data, { stackBars: true })` in 1.5

### Requirement: 1.x classes as wrappers

`LineChart`, `BarChart` and `PieChart` SHALL remain available with their 1.x constructor signatures, defaults and methods (`update`, `detach`, `on`, `off`). They SHALL delegate to the preset functions and contain no chart logic. They SHALL keep the 1.x deferred first render, so listeners registered right after construction receive the first render's events. A constructor that throws SHALL leave nothing scheduled.

#### Scenario: Unchanged 1.x usage

- **WHEN** code written for 1.5, e.g. `new BarChart('#chart', data, { stackBars: true }, responsiveOptions)`, runs on v2
- **THEN** the chart renders the same visual output and class structure as 1.5 did

#### Scenario: Listener after construction

- **WHEN** `new LineChart('#chart', data).on('mount', fn)` runs
- **THEN** `fn` is called for the first render

#### Scenario: Missing target leaves nothing behind

- **WHEN** `new LineChart('#missing', data)` throws because no element matches
- **THEN** no first render is scheduled

### Requirement: Tree-shakable composition

Layers, axis types, renderers and the compatibility layer SHALL be importable separately. A bundle that uses only some of them SHALL NOT contain the others.

#### Scenario: Line-only bundle

- **WHEN** an application imports only `chart`, the line layer and the DOM renderer
- **THEN** its bundle contains no bar, pie, string-renderer, class-wrapper or compatibility code

### Requirement: Detaching a chart

The chart handle SHALL provide `detach()`, which stops reacting to container size changes and media queries but keeps the rendered output and the listeners. `destroy()` SHALL additionally remove the output and the listeners. A `detach()` during the first render SHALL take effect like one after it, for `chart()`, the presets and the 1.x classes.

#### Scenario: Detached chart stays visible

- **WHEN** `detach()` is called and the container is resized afterwards
- **THEN** the chart output stays in the container and is not rendered again

#### Scenario: Detach during the first render

- **WHEN** a listener of the first render calls `detach()` (a `mount` listener on `chart()`, a converted 1.x plugin's `created` listener on a preset, a `created` listener on a 1.x class), and the window and the container are resized afterwards
- **THEN** nothing throws, and the chart isn't rendered again

### Requirement: Axis kind and chart-specific normalization

A created axis SHALL report its kind (for example `step`, `autoScale`, `fixedScale`, or the 1.x class it wraps) and, for step axes, whether it is stretched, so layers can position elements per axis kind. Cartesian axes SHALL accept the 1.x normalization options of the chart type: the value dimension (`x` or `y`) for single values, and distributed series.

#### Scenario: Horizontal bars

- **WHEN** a bar chart with `horizontalBars: true` and data `[[1, 2]]` is created
- **THEN** the values are projected on the X axis, the labels on the Y axis, and the output equals 1.5's

#### Scenario: Step axis detection

- **WHEN** a bar chart uses the default label axis, and another one a 1.x `StepAxis` class as label axis
- **THEN** both center their bars on the steps, as 1.5 does for `StepAxis`

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

### Requirement: Layers widen their axes

A layer SHALL be able to report the value extent it needs on an axis, and axes SHALL include it. A bar layer that stacks SHALL report its stacked extent, positive and negative stacks apart for `accumulate-relative`.

#### Scenario: Stacked bars in chart()

- **WHEN** a `bar()` layer stacks series `[5, 5]` and `[4, 4]` on an auto scale axis
- **THEN** the axis reaches 9 and no bar is drawn past its end

### Requirement: Preset handles change options

The handles of `lineChart`, `barChart` and `pieChart` SHALL change the chart's options after creation, extending the current options or, when asked, the defaults, and SHALL keep data given to `update()` across responsive changes. The presets SHALL take phase listeners in their options, registered before the first render. Merging an object option over a numeric one, or a numeric one over an object, SHALL replace it.

#### Scenario: Showing the area later

- **WHEN** a line chart created without areas gets `setOptions({ showArea: true })`
- **THEN** it redraws with areas

#### Scenario: Data across a breakpoint

- **WHEN** a preset chart gets new data through `update()` and a responsive breakpoint changes afterwards
- **THEN** the redraw shows the new data

#### Scenario: Object padding on a pie

- **WHEN** a pie chart is created with `chartPadding: { top: 20 }`, with the class and the function
- **THEN** it renders with 20 px at the top and the pie's default 5 px on the other sides

#### Scenario: Object padding at a breakpoint

- **WHEN** a line chart with `chartPadding: 10` has a responsive override `{ chartPadding: { top: 3 } }` that matches
- **THEN** it renders with the override, without an error

### Requirement: Composed chart defaults

`chart()` SHALL give its SVG a chart type class from its layers when no `className` is given; `stepAxis()` without ticks SHALL use the data's labels; `cartesianAxes()` SHALL use the same defaults in its object and list forms.

#### Scenario: A composed chart's class

- **WHEN** `chart()` draws a bar layer and a line layer without `className`
- **THEN** its SVG has the class `ct-chart-bar`

### Requirement: Target line layer

The `targetLine()` layer SHALL draw one line across the chart area at a constant value on one axis: an axis id, by default the first Y axis. Several lines SHALL be several layers. On a Y axis the line SHALL be horizontal; on an X axis, vertical. On a step axis the value SHALL be a position by index, as for the axis's ticks. The line SHALL accept an optional label and an optional class. A label SHALL be drawn as SVG text next to the line, inside the chart area, at the line's end by default or at its start. The layer SHALL report its value as its extent, so the axis includes it (an axis's own `low` and `high` still win). A value outside the axis's range SHALL draw nothing. A layer without a value SHALL throw when it's created. The layer SHALL support only `cartesian` coordinates.

#### Scenario: One labeled line

- **WHEN** a line chart's Y axis goes from 0 to 800 and `targetLine({ value: 1000, label: 'Target' })` is one of its layers
- **THEN** the Y axis goes up to at least 1000, and the output has one horizontal `line.ct-target-line` across the chart area at 1000 and a `text.ct-target-label` reading "Target" at its right end

#### Scenario: Several lines

- **WHEN** `targetLine({ value: 20, label: 'Min' })` and `targetLine({ value: 80, label: 'Max', className: 'ct-series-b' })` are two layers of a chart
- **THEN** the output has two target lines in that order, and the second line and its label carry the class `ct-series-b`

#### Scenario: A vertical line

- **WHEN** a horizontal bar chart has `targetLine({ axis: 'value', value: 50 })` and `value` is its X axis id
- **THEN** the target line is vertical, at 50 on that axis, from the top to the bottom of the chart area

#### Scenario: Unknown axis

- **WHEN** a target line names an axis id the chart doesn't have
- **THEN** creating the chart throws an error naming the layer and the id

### Requirement: Band layer

The `band()` layer SHALL fill the area between a low and a high edge, on one X and one Y axis like the line layer. Each edge SHALL be a constant value (a number), values of its own (an array with one value per label, a number, `{ x, y }` or `null` for a hole), or a series: its name, or `{ series }` with a name or an index, since a bare number is a constant. Values of its own SHALL draw like the same values given as a series, without being part of the chart's data, and SHALL count towards the Y axis's range. Alternatively, `series` SHALL select a group of series, and the band SHALL cover the minimum to the maximum of their values at each value index. Series the band uses SHALL stay visible to the other layers: a layer without a series selection still draws them. The edges SHALL follow the same interpolation option as the line layer (`lineSmooth`, smooth by default), and `align: 'center'` SHALL line the band up with bars on a step axis as it does for lines. Where an edge has a hole, or no series of a group has a value, the band SHALL break, like a line's area. With `mark: true`, the band SHALL give every `point` and `bar` node of the chart whose value at its value index lies between the band's edges (edges included) the class `ct-in-band`, and every other one with a value the class `ct-out-band`; nodes at an index where the band has a hole SHALL get neither. Without `mark`, the band SHALL change no other layer's nodes. The band's values SHALL count towards its axes' range. The layer SHALL support only `cartesian` coordinates.

#### Scenario: Between two series

- **WHEN** a chart has series `p10` and `p90` and `band({ low: 'p10', high: 'p90' })` is a layer
- **THEN** the output has one `path.ct-band-area` whose upper edge follows `p90` and whose lower edge follows `p10`, inside a `g.ct-band` group

#### Scenario: The range of a group

- **WHEN** a chart has three team series and `band({ series: ['a', 'b', 'c'] })` is a layer
- **THEN** at each value index the band's upper edge is at the largest of the three values and its lower edge at the smallest

#### Scenario: Edges as values

- **WHEN** `lineChart` gets one series and `layers: { below: [band({ low: [3, 4, 3, 5], high: [9, 11, 10, 12] })] }`
- **THEN** the band follows those values, the Y axis includes them, and the chart still draws only its one series as a line

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
