# value-labels Specification

## Purpose

The `valueLabels()` layer of `@chartist-js/essentials` writes each value next to the point or bar that shows it, the v2 successor of the 1.x point labels and bar labels plugins, for the browser, the server and the terminal.

## Requirements

### Requirement: The value labels layer

`@chartist-js/essentials` SHALL export `valueLabels(options)`, a layer that draws one label per `point` and `bar` node the chart's other layers drew, after those nodes have passed the chart's refining layers and `compose` listeners. It SHALL draw its labels in a `g.ct-value-labels` group at its own place in the chart's layers, so on a preset it goes in `layers.above`. A point or bar that a `compose` listener dropped SHALL get no label. The layer SHALL support only `cartesian` coordinates, draw no series itself, and leave every axis range as it is. Created without options, it SHALL label every point and bar of the chart.

#### Scenario: Labels on a bar chart

- **WHEN** `barChart('#chart', { labels: ['Q1', 'Q2', 'Q3'], series: [[5, 4, 7]] }, { layers: { above: [valueLabels()] } })` is rendered
- **THEN** the output has a `g.ct-value-labels` group after the bars and before the axis labels, with three `text.ct-value-label` elements reading `5`, `4` and `7`

#### Scenario: Labels on a line chart

- **WHEN** a line chart with two series of four values has `valueLabels()` in `layers.above`
- **THEN** the output has eight labels, one per point

#### Scenario: A dropped bar

- **WHEN** a `compose` listener returns `null` for the bar of value index 1
- **THEN** that value has no label, and the other bars keep theirs

#### Scenario: A pie chart

- **WHEN** a `pieChart` gets `valueLabels()` as an extra layer
- **THEN** creating the chart throws an error naming the layer type and the `polar` coordinate system

#### Scenario: Unchanged axes

- **WHEN** the same chart is rendered with and without `valueLabels()`
- **THEN** both have the same axis ranges, ticks, chart area and series output

### Requirement: What the layer labels

The `roles` option SHALL choose which nodes get labels: `point`, `bar` or both (the default). The `series` option SHALL choose series by index or name, as a layer's series selection does; nodes of other series SHALL get no label. A line series drawn without points (`showPoint: false`) SHALL be labeled at its values' positions on the line. Areas, bands, slices, target and trend lines SHALL get no labels.

#### Scenario: Bars only

- **WHEN** a composed chart draws a bar layer and a line layer and has `valueLabels({ roles: ['bar'] })`
- **THEN** only the bars have labels

#### Scenario: One series by name

- **WHEN** a chart's series are named `revenue` and `costs` and it has `valueLabels({ series: ['revenue'] })`
- **THEN** only the values of `revenue` have labels

#### Scenario: A line without points

- **WHEN** a line chart has `showPoint: false` and `valueLabels()`
- **THEN** each value has a label at the position its point would have, and no point is drawn

### Requirement: Label text and format

A label's default text SHALL be the value along the value axis (the Y value of a point and of a vertical bar, the X value of a horizontal bar), written with `Intl.NumberFormat` in the `locale` option (default: the runtime's locale) with the `numberFormat` options, so a server and a browser in the same locale write the same text. A value of 0 SHALL be labeled. The `format(item)` option SHALL receive an item with the same fields, under the same names, as the item of `@chartist-js/tooltips`' `format`: the node's `role`, `seriesIndex`, `valueIndex`, the `value` (a number, or `{ x, y }` for a value with both), its `meta`, the `series` as given, its `seriesName`, the `label` at the value's index in the chart's labels, and the node's `context`, typed by the role so that checking `item.role` narrows it. A string or number it returns SHALL be the label's text; `undefined` SHALL keep the default text; `null` or an empty string SHALL draw no label for that value. A line break (`\n`) in the text SHALL start a new line, drawn as stacked `tspan` elements in SVG mode. Holes and values without a number on the value axis SHALL get no label and SHALL NOT call `format`.

#### Scenario: A unit

- **WHEN** a bar chart has `valueLabels({ format: item => `${item.value} %` })` and a bar of 42
- **THEN** that bar's label reads `42 %`

#### Scenario: Number formatting

- **WHEN** a bar chart has `valueLabels({ locale: 'de-CH', numberFormat: { style: 'currency', currency: 'CHF' } })` and a bar of 1250
- **THEN** that bar's label reads as `Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })` writes 1250, on the server and in the browser

#### Scenario: Text from meta

- **WHEN** a stacked horizontal bar chart has the value `{ value: 59.62, meta: 'WO 54182526' }` and `valueLabels({ format: item => `${item.meta}: ${item.value}` })`
- **THEN** that segment's label reads `WO 54182526: 59.62`

#### Scenario: Some values only

- **WHEN** `format` returns `undefined` for bars and a text for points
- **THEN** the bars keep their default labels, and the points get the text

#### Scenario: Two lines

- **WHEN** `format` returns `'Q3\n1,250'`
- **THEN** the label has two lines, `Q3` above `1,250`

#### Scenario: Zero

- **WHEN** a bar has the value 0
- **THEN** its label reads `0`

#### Scenario: Skipping values

- **WHEN** `format` returns `null` for values below 10
- **THEN** those values have no label element, and the others have theirs

#### Scenario: A hole

- **WHEN** a line series has a `null` value at index 2
- **THEN** no label is drawn for index 2, and `format` isn't called for it

### Requirement: Label positions on points

The `pointPosition` option SHALL place point labels: `above` (the default), `below`, `left`, `right` or `center`. Above and below, a label SHALL be centered horizontally on the point; left and right, centered vertically and anchored at the side next to the point. The `offset` option SHALL set the distance in px between the point's center and the label's nearest edge, 8 by default for points; `center` SHALL ignore it.

#### Scenario: Above by default

- **WHEN** a point is at (100, 200), the label's font size is 12 px and `offset` isn't set
- **THEN** its label has `text-anchor: middle`, `x` 100, and its text's bottom edge 8 px above y 200

#### Scenario: To the right

- **WHEN** `valueLabels({ pointPosition: 'right', offset: 6 })` labels a point at (100, 200)
- **THEN** the label starts at x 106, with `text-anchor: start`, vertically centered on y 200

### Requirement: Label positions on bars

The `barPosition` option SHALL place bar labels along the bar, in the direction from its base to its value: `end`, past the bar's end; `inside-end`, inside the bar at its end; `center`, in the middle of the bar; `inside-base`, inside the bar at its base. Without it, a bar SHALL be labeled at its `end`, and a segment of stacked bars (`stackBars` with stacking modes that accumulate) at its `center`. A label SHALL be centered across the bar. The `offset` option SHALL set the distance in px between the bar's end or base and the label's nearest edge, 4 by default for bars. A bar of a negative value SHALL be labeled below its end (vertical) or left of it (horizontal); a bar of 0 SHALL be labeled as if it were positive.

#### Scenario: Vertical bars

- **WHEN** a vertical bar ends at y 120 and is labeled with the defaults
- **THEN** its label is centered on the bar's x, its text's bottom edge 4 px above y 120

#### Scenario: Horizontal bars

- **WHEN** a horizontal bar chart (`horizontalBars: true`) has `valueLabels()`
- **THEN** each label starts 4 px right of its bar's end, with `text-anchor: start`, vertically centered on the bar

#### Scenario: Negative bars

- **WHEN** a bar has the value -3 on a vertical bar chart
- **THEN** its label's top edge is 4 px below the bar's end

#### Scenario: Stacked segments

- **WHEN** a stacked bar chart with three series has `valueLabels()`
- **THEN** each segment's label is centered in its segment, on both axes

#### Scenario: Inside the end

- **WHEN** `valueLabels({ barPosition: 'inside-end' })` labels a tall vertical bar
- **THEN** the label's top edge is 4 px below the bar's end, and the label has the class `ct-value-label-inside`

### Requirement: Labels that don't fit

With `overflow: 'fit'` (the default), the layer SHALL fit labels to their bars and to the chart's edges:

- a label inside a bar or centered in it whose extent along the bar is longer than the bar SHALL be drawn at the bar's `end` instead, or, for a stacked segment, SHALL NOT be drawn;
- a label that would cross the edge of the chart area grown by the chart's padding SHALL be moved inward until it doesn't; a bar's `end` label that would cross that edge along the bar SHALL be drawn at `inside-end` instead.

With `overflow: 'show'`, every label SHALL be drawn where its position puts it.

#### Scenario: A short bar

- **WHEN** `barPosition: 'center'` labels an unstacked vertical bar 6 px tall with a 12 px label
- **THEN** the label is drawn past the bar's end, without `ct-value-label-inside`

#### Scenario: A thin stacked segment

- **WHEN** a stacked segment is 5 px tall and its label 12 px
- **THEN** the segment has no label, and the other segments keep theirs

#### Scenario: The highest bar

- **WHEN** a vertical bar reaches the top of the chart area and there isn't room for its label in the padding above it
- **THEN** its label is drawn inside the bar's end, with the class `ct-value-label-inside`

#### Scenario: The first point

- **WHEN** a point label centered on the first point would start left of the chart area grown by the padding
- **THEN** the label is moved right until its left edge is on that edge

#### Scenario: No fitting

- **WHEN** the same charts use `overflow: 'show'`
- **THEN** every label is drawn at its position, even where it leaves its bar or the chart

### Requirement: Label modes

Labels SHALL be SVG `text` by default, whatever the chart's `labels` option says. With the layer's `labels: 'html'`, each label SHALL be a `foreignObject` (with `overflow: visible`) sized to the measured text, holding a `span` with the label's classes, at the same position. Labels SHALL be measured with the chart's text measurement, so in the browser the page's fonts and the label's CSS count.

#### Scenario: SVG by default

- **WHEN** a chart drawn with HTML axis labels has `valueLabels()`
- **THEN** its value labels are `text` elements

#### Scenario: HTML labels

- **WHEN** a chart has `valueLabels({ labels: 'html' })`
- **THEN** each value label is a `foreignObject` holding a `span.ct-value-label` with the label's text

### Requirement: Value label classes and styles

Each label SHALL have the class `ct-value-label`, the class of its series as the series group has it (`ct-series-b`, or the series' own `className`), and `ct-value-label-inside` when it's drawn inside or centered in a bar. The `classNames` option SHALL replace `group` (`ct-value-labels`), `label` (`ct-value-label`) and `inside` (`ct-value-label-inside`). The essentials stylesheet SHALL style labels with custom properties only: `--ct-value-label-color` (default: the axis label color, following a dark color scheme like it), `--ct-value-label-inside-color` (default: white) and `--ct-value-label-size` (default: the axis label size). Setting `--ct-value-label-color: var(--ct-color)` SHALL color each label in its series' color.

#### Scenario: Series classes

- **WHEN** a chart with two series has `valueLabels()`
- **THEN** the labels of the second series have the classes `ct-value-label ct-series-b`

#### Scenario: Series colors

- **WHEN** a page sets `.ct-value-label { --ct-value-label-color: var(--ct-color); }`
- **THEN** each label is drawn in its series' color

#### Scenario: Inside labels

- **WHEN** a label is drawn inside a bar
- **THEN** it has the class `ct-value-label-inside` and the stylesheet gives it `--ct-value-label-inside-color`

### Requirement: Value label nodes

Each label SHALL be a node with the role `valueLabel`, declared for TypeScript in the essentials package, with a context of its source node's role, series index, value index, value, meta, the text and the label's position (`above`, `end`, …, after fitting) and its anchor in px. Its key SHALL follow the scene's keys for value nodes, with the value labels layer's index. `compose` listeners SHALL receive these nodes and be able to change or drop them.

#### Scenario: Finding labels

- **WHEN** a `scene` listener queries the scene for nodes with role `valueLabel` in series 1
- **THEN** it gets the labels of the second series, each with its value index and text

#### Scenario: Dropping a label

- **WHEN** a `compose` listener returns `null` for `valueLabel` nodes whose text is `0`
- **THEN** those labels are missing and the rest of the chart is unchanged

### Requirement: Value labels in live updates

With `liveDomRenderer()`, a value label SHALL be identified like the value it labels, following the renderer's `key` option, so an update keeps its element, changes its text and moves it with its bar or point, animated with the chart's update timing. Labels of new values SHALL be added and labels of removed values removed.

#### Scenario: A changed value

- **WHEN** a live bar chart's value at index 2 changes from 5 to 8
- **THEN** the label of index 2 is the same element, reads `8`, and moves with the bar's end

#### Scenario: A sliding window

- **WHEN** a live line chart with `key: 'label'` shifts its labels by one
- **THEN** the value labels of the labels that stay are the same elements, the first one is removed and a new one is added

### Requirement: Value labels on the server and in the terminal

Value labels SHALL render with `toScene()` and `renderToString()` the same as in the browser, with the estimated text metrics, and `applyStyles()` with the essentials stylesheet SHALL give them their fill and font size as attributes. `@chartist-js/terminal` SHALL draw SVG value labels as text on the character grid, like other labels.

#### Scenario: Server markup

- **WHEN** a bar chart with `valueLabels()` is rendered with `renderToString(toScene(barChartConfig(data, options), { width: 400, height: 300 }))`
- **THEN** the markup has one `text.ct-value-label` per bar, with its value as text

#### Scenario: Terminal output

- **WHEN** the same chart config is rendered by `@chartist-js/terminal`
- **THEN** each bar's value appears as text next to its bar

### Requirement: Value label examples and the 1.x plugins

The examples SHALL include bar labels on a simple and a negative bar chart (`essentials/value-labels-bars`), a stacked horizontal bar chart with text from `meta` (`essentials/value-labels-stacked`), and a line chart with a unit (`essentials/value-labels-line`), in the gallery's "Essentials" section and in the visual tests. `chartist-plugin-pointlabels` and `chartist-plugin-barlabels` SHALL leave the plugins page with their pages and live examples, without a redirect, and every link of the site to their pages, the redirects for the 0.x site's point label anchors included, SHALL point to the value labels guide instead.

#### Scenario: In the gallery

- **WHEN** a visitor opens the examples gallery
- **THEN** the "Essentials" section lists the three value label examples

#### Scenario: The 1.x plugins' pages

- **WHEN** the site is built
- **THEN** it has no page and no redirect page at `/plugins/chartist-plugin-pointlabels/` or `/plugins/chartist-plugin-barlabels/`, and the plugins overview has no tile for either

#### Scenario: The 0.x point label anchor

- **WHEN** the 0.x redirect table is read for the old plugins page's `#point-label-plugin` anchor
- **THEN** its target is `/packages/essentials/value-labels/`
