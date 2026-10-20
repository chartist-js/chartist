# axis-titles Specification

## Purpose

Defines `axisTitle()` in `@chartist-js/essentials`: a layer that names an axis, with the room for the title reserved next to the axis, on any side and with any number of axes.

## Requirements

### Requirement: Axis title layer

`axisTitle(options)` SHALL return a layer for cartesian charts that draws one title for the axis whose id is `axis`, with the text `text`. It SHALL draw a single SVG `text` node with the classes `ct-axis-title`, `ct-horizontal` (top and bottom axes) or `ct-vertical` (left and right axes), and `ct-start` (top and left) or `ct-end` (bottom and right), plus `className` when given; `classNames.title` SHALL replace `ct-axis-title`. The node SHALL have the role `axisTitle` and a context with the axis, the side, the text and the anchor's position. The layer SHALL draw no series and SHALL NOT change any axis's range. Title text SHALL be escaped like other text in the output.

#### Scenario: A title on a line chart

- **WHEN** `lineChart('#chart', data, { layers: { above: [axisTitle({ axis: 'y', text: 'Visits' })] } })` renders
- **THEN** the svg contains one `text.ct-axis-title.ct-vertical.ct-start` with the text `Visits`, and a `compose` listener receives it with the role `axisTitle`

#### Scenario: Unknown axis

- **WHEN** an `axisTitle({ axis: 'eur', text: 'EUR' })` layer is in a chart without an axis `eur`
- **THEN** creating the chart throws an error that names the axis id and the layer

#### Scenario: A pie chart

- **WHEN** an `axisTitle()` layer is used in a polar chart
- **THEN** creating the chart throws the error for a layer that doesn't support polar coordinates

#### Scenario: No text

- **WHEN** `text` is an empty string
- **THEN** the layer reserves no room and draws nothing

### Requirement: Axis titles reserve their room

An axis title SHALL reserve room on its axis's side with the layer `inset` method: the height of one line of its text, measured with the renderer's text measuring and the title's classes, plus `gap` px between the title and the axis band (4 px when not set). The drawing area SHALL shrink by that room, so the title never overlaps the axis labels or the area, whatever the font size the stylesheet gives the title.

#### Scenario: Room at the bottom

- **WHEN** a line chart gets an X axis title whose text measures 16 px high, with the default gap
- **THEN** the area is 20 px lower than without the title, and the title lies below the X axis labels, inside the chart

#### Scenario: A larger font

- **WHEN** a page sets `--ct-axis-title-size: 1.25rem` and the chart is drawn in the browser
- **THEN** the reserved room grows with the measured text, and the title still doesn't overlap the labels

### Requirement: Axis title placement

Along its axis, the title SHALL be placed in the extent of the drawing area: centered by default, or at the axis's start or end with `align: 'start'` or `'end'`, the start being the left for X axes and the bottom for Y axes; the text SHALL be anchored to match (`text-anchor` `middle`, `start` or `end`). Across the axis, the title's line SHALL sit in its reserved box, `gap` px away from the axis band. Titles of left and right axes SHALL be rotated a quarter turn to read from bottom to top; `flip: true` SHALL make them read from top to bottom. `flip` SHALL NOT change titles of top and bottom axes.

#### Scenario: Centered under the X axis

- **WHEN** a chart's area runs from x 50 to 450 and its X axis is at the bottom
- **THEN** the X axis title is anchored at x 250 with `text-anchor="middle"`

#### Scenario: Aligned to the end

- **WHEN** a Y axis title has `align: 'end'`
- **THEN** it is anchored at the top of the area and reads from bottom to top, ending there

#### Scenario: Flipped on the right

- **WHEN** a Y axis on the right has a title with `flip: true`
- **THEN** the title reads from top to bottom, right of the axis labels

### Requirement: Axis titles on every side and axis

Axis titles SHALL work on axes on any side, with several axes per side and several titles per chart. Titles on the same side SHALL stack outward in the order of `layers`; listing the titles of a side in the order of its axes keeps each title on the same rank as its axis. Titles SHALL work on the presets through `layers: { below, above }`, with the presets' axis ids `x` and `y`, including horizontal bars and axes moved with `position`, and responsive options SHALL be able to change them like other extra layers.

#### Scenario: Two Y axes and an X axis

- **WHEN** a composed chart has axes `month` (bottom), `eur` (left) and `usd` (right), with a title for each
- **THEN** the chart shows a title below the month labels, one left of the EUR labels and one right of the USD labels, and none of them overlaps an axis label or the area

#### Scenario: Two axes on one side

- **WHEN** a chart has the Y axes `eur` and `usd` both on the left, in that order, and the layers list the title of `eur` before the title of `usd`
- **THEN** the title of `eur` is closer to the axes than the title of `usd`

#### Scenario: Horizontal bars

- **WHEN** `barChart` with `horizontalBars: true` gets `axisTitle({ axis: 'x', text: 'Revenue' })`
- **THEN** the title is below the value axis at the bottom

#### Scenario: Responsive title

- **WHEN** a responsive override for narrow screens gives `layers.above` with a shorter title
- **THEN** the chart shows the shorter title at narrow widths and the longer one otherwise

### Requirement: Axis title styles

`@chartist-js/essentials/styles.css` SHALL style `.ct-axis-title` with `--ct-axis-title-color` and `--ct-axis-title-size`, falling back to `--ct-label-color` and `--ct-label-size`, and then to Chartist's label defaults, the dark default included. Other looks (weight, letter spacing, font) SHALL be left to the page's CSS.

#### Scenario: Labels and titles together

- **WHEN** a page sets `--ct-label-color: #555` and no title property
- **THEN** the axis titles are #555 like the labels

### Requirement: Axis titles outside the browser

Axis titles SHALL be drawn by `toScene()`, `renderToString()` and `renderForHydration()`, with the room measured by the text estimate unless a `measureText` is given, and by `@chartist-js/terminal`, which measures in cells and draws vertical titles in a column.

#### Scenario: Terminal

- **WHEN** a bar chart with an X axis title and a Y axis title is rendered by `@chartist-js/terminal`
- **THEN** the X title is a row below the X labels and the Y title a column left of the Y labels, and neither overlaps the chart

### Requirement: Axis title examples

The examples SHALL include a line chart preset with an X and a Y axis title (`essentials/axis-titles`), and a composed chart with two Y axes on the left and right and a title for each axis, one of them aligned and one flipped (`essentials/axis-titles-composed`). Both SHALL be in the docs gallery's "Essentials" section and in the visual tests.

#### Scenario: Visual coverage

- **WHEN** the visual tests run
- **THEN** both examples are screenshot and compared with their baselines

#### Scenario: In the gallery

- **WHEN** a visitor opens the examples gallery
- **THEN** the "Essentials" section lists both axis title examples
