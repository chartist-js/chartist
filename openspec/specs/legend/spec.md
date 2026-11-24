# legend Specification

## Purpose

Defines `legend()` in `@chartist-js/essentials`: a layer that names a chart's series on one side of the chart, each next to a marker in its series' color, with its names and colors taken from the chart so they stay in step with updates and the stylesheet (#1532, #1410).

## Requirements

### Requirement: Legend layer

`legend(options)` SHALL return a layer for cartesian and polar charts that draws a `g` with the classes `ct-legend`, `ct-horizontal` (top and bottom) or `ct-vertical` (left and right), and `ct-start` (top and left) or `ct-end` (bottom and right). The group SHALL hold one entry per listed series, in the order of the chart's data: a `g` with the class `ct-legend-item` and the series' class as the chart's layers give it (`ct-series-a`, `ct-series-b`, …, or the series' `className`), holding a `circle` with the class `ct-legend-marker` and an SVG `text` with the class `ct-legend-label` and the series' name. The `classNames` option SHALL replace `legend`, `item`, `marker` and `label`. Each entry SHALL have the role `legendItem`, declared for TypeScript in the essentials package, and a context with the series' index, the series as given (for pie data, the value), the name and the legend's side; its key SHALL follow the scene's keys for series nodes, with the legend layer's index. The layer SHALL draw no series and SHALL NOT change any axis's range. Names SHALL be escaped like other text in the output. An unknown `side` or `align`, or a `gap` that isn't a finite number of 0 or more, SHALL throw an error naming the layer and the option.

#### Scenario: A legend on a line chart

- **WHEN** `lineChart('#chart', { labels, series: [{ name: 'Tea', data }, { name: 'Coffee', data }] }, { layers: { above: [legend()] } })` renders
- **THEN** the svg contains a `g.ct-legend` with `g.ct-legend-item.ct-series-a` reading `Tea` and `g.ct-legend-item.ct-series-b` reading `Coffee`, each with a `circle.ct-legend-marker`, and a `compose` listener receives the entries with the role `legendItem`

#### Scenario: A series with its own class

- **WHEN** a series has `className: 'sales'` and a name
- **THEN** its entry has the classes `ct-legend-item sales`, like the series group the chart draws for it

#### Scenario: An unknown side

- **WHEN** `legend({ side: 'center' })` is created
- **THEN** it throws an error that names the layer `legend` and the option `side`

### Requirement: What the legend lists

The legend SHALL read the names from the chart's data on every render, so `update()` and responsive options change it like the rest of the chart. It SHALL list every series with a `name`; series without one SHALL be left out and keep their color. For pie data, whose series are values, it SHALL list the values, each named by its own `name` or else by its label, with the value's index and `className` deciding its class. The `series` option SHALL choose the series by index or name, as a layer's series selection does, in the chart's order. In composed charts, it SHALL list the series of every layer, whichever axis they're drawn on, without changing any axis.

#### Scenario: New names

- **WHEN** a chart with a legend is updated with a third named series and a renamed first one
- **THEN** the legend lists the new name first and the third series last, with the class `ct-series-c`

#### Scenario: Unnamed series

- **WHEN** a line chart's series are an array, a series named `Named` and a series object without a name
- **THEN** the legend has one entry, `Named`, with the class `ct-series-b`

#### Scenario: No names

- **WHEN** no series has a name
- **THEN** the legend draws nothing and the chart lays out as without it

#### Scenario: A pie chart

- **WHEN** a pie chart has the labels `Search`, `Direct` and `Social` and a legend
- **THEN** the legend lists `Search`, `Direct` and `Social` with the classes `ct-series-a` to `ct-series-c`, the classes of their slices

#### Scenario: Two axes

- **WHEN** a composed chart draws a series `EUR` as bars on a left axis and `USD` as a line on a right axis, and has a legend
- **THEN** the legend lists `EUR` and `USD`, and both axes have the ticks they have without the legend

### Requirement: The legend reserves its room

The legend SHALL reserve room on its `side` (`top` by default) with the layer `inset` method, measured with the renderer's text measuring and the name's class, plus `gap` px between the legend and the chart (8 px when not set). On the top and bottom, the entries SHALL wrap into rows as wide as the drawing area, and the room SHALL be one line per row; on the left and right, the entries SHALL stand in a column, and the room SHALL be as wide as the widest entry. The drawing area SHALL shrink by the room, so the legend never overlaps the axis labels or the area, whatever the font size the stylesheet gives the names. When other layers narrow the area after the room was reserved, the legend SHALL keep to the rows it reserved. Legends and other layers that reserve room on the same side SHALL stack outward in the order of `layers`.

#### Scenario: Room on top

- **WHEN** a line chart gets a legend whose names measure 16 px high and fit in one row
- **THEN** the area's top edge is 24 px lower than without the legend, and the legend's row is between the top padding and the area

#### Scenario: A narrow chart

- **WHEN** a chart with six named series is 200 px wide
- **THEN** the legend's entries wrap into several rows, none wider than the area, and the room is one line per row plus the gap

#### Scenario: A legend on the right

- **WHEN** a chart has `legend({ side: 'right' })`
- **THEN** the entries stand in a column right of the Y axis labels, `gap` px from the area's right edge, and the area shrinks by the widest entry and the gap

#### Scenario: With an axis title

- **WHEN** a chart's `layers` list an X axis title and then a legend at the bottom
- **THEN** the legend is below the title

### Requirement: Legend placement

Along its side, the legend SHALL be placed in the extent of the drawing area: in the middle by default, or at the start or end with `align: 'start'` or `'end'`, the start being the left on the top and bottom and the top on the left and right. On the top and bottom, each row SHALL be aligned on its own. Each entry SHALL be its marker, a circle 0.8 em across, then 0.4 em of space and its name, anchored at its start, both centered on the entry's line; entries in a row SHALL be 1.25 em apart, the em being the name's measured font size.

#### Scenario: Centered on top

- **WHEN** a chart's area runs from x 50 to 450 and its legend's row is 120 px wide
- **THEN** the row starts at x 190

#### Scenario: At the top of a column

- **WHEN** a legend on the left has `align: 'start'`
- **THEN** its first entry's line starts at the top of the area

### Requirement: Legend styles

`@chartist-js/essentials/styles.css` SHALL style `.ct-legend-label` with `--ct-legend-label-color` and `--ct-legend-label-size`, falling back to `--ct-label-color` and `--ct-label-size`, and then to Chartist's label defaults, the dark default included, and `.ct-legend-marker` with the fill `--ct-color`, which the series' class sets. Setting `--ct-legend-label-color: var(--ct-color)` SHALL write each name in its series' color. The layer SHALL write no `style` attributes and no colors.

#### Scenario: Marker colors

- **WHEN** `applyStyles()` gets both stylesheets for a line chart with two named series and a legend
- **THEN** each marker's fill is its series' line color, and each name has the fill and font size of the axis labels

#### Scenario: Names in their colors

- **WHEN** a page sets `.ct-legend-label { --ct-legend-label-color: var(--ct-color); }`
- **THEN** each name is drawn in its series' color

### Requirement: Legends outside the browser

Legends SHALL be drawn by `toScene()`, `renderToString()` and `renderForHydration()`, with the room measured by the text estimate unless a `measureText` is given; server markup SHALL hydrate with `repaired: 0`. With `liveDomRenderer()`, an entry SHALL be identified like its series, so an update keeps the elements of the series that stay. `@chartist-js/terminal` SHALL draw the names as text and each marker in its series' color.

#### Scenario: Hydration

- **WHEN** a page hydrates server markup of a line chart with a legend at the bottom, with the same data and options
- **THEN** the `hydrate` mount reports `repaired: 0`

#### Scenario: A renamed series in a live chart

- **WHEN** a live chart's first series is renamed by an update
- **THEN** its entry is the same element, with the new name

#### Scenario: Terminal

- **WHEN** a line chart with two named series and a legend is rendered by `@chartist-js/terminal`
- **THEN** a row above the chart has both names, each after a marker cell in its series' color

### Requirement: Legend examples

The examples SHALL include a line chart preset with a legend on top (`essentials/legend`) and a donut with a legend on the right (`essentials/legend-pie`). Both SHALL be in the docs gallery's "Essentials" section and in the visual tests.

#### Scenario: In the gallery

- **WHEN** a visitor opens the examples gallery
- **THEN** the "Essentials" section lists both legend examples
