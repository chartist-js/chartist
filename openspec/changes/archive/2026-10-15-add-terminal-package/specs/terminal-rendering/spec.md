# Spec Delta

## Purpose

Defines how `@chartist-js/terminal` turns a Chartist scene into text for terminals (with ANSI colors) or into HTML, and the chart functions and helpers CLI tools use to show Chartist charts.

## ADDED Requirements

### Requirement: Cell geometry

A terminal cell SHALL stand for 8 × 16 px of the scene. A layout size for `columns` × `rows` cells SHALL measure text as one cell per character, so labels are laid out on the character grid. The output SHALL have at most `rows` lines of at most `columns` characters, without trailing spaces or trailing empty lines.

#### Scenario: Output fits the size

- **WHEN** a line chart is rendered for 60 columns and 15 rows
- **THEN** the output has at most 15 lines, and no line is longer than 60 characters (escape codes not counted)

#### Scenario: Labels measured in cells

- **WHEN** the layout size measures the label `Tue`
- **THEN** it is 24 px wide and 16 px high

### Requirement: Lines, points and areas in braille

Lines, points and areas SHALL be drawn in Unicode braille patterns, 2 × 4 dots per cell, so a dot stands for 4 × 4 px and circles stay round. Curved paths SHALL follow the curve. Areas SHALL be shaded with a dot pattern and drawn below the grid.

#### Scenario: A line chart

- **WHEN** a line chart with one series is rendered
- **THEN** its line and points appear as braille characters along the values

#### Scenario: Area behind the grid

- **WHEN** a line chart with `showArea` is rendered
- **THEN** the area is shaded with braille dots and the grid lines stay visible across it

### Requirement: Bars in block characters

Bars SHALL be drawn one cell thick in block characters, with eighth blocks where a bar ends inside a cell, vertically and horizontally. Where two stacked bars meet inside one cell, the cell SHALL show both: the upper bar's part in its color, the rest in the color of the bar below.

#### Scenario: Partial bar end

- **WHEN** a bar ends three eighths of the way into a cell
- **THEN** that cell shows `▃` (vertical bars) or `▍` (horizontal bars)

#### Scenario: Stacked bars meet in a cell

- **WHEN** two stacked bars meet in the middle of a cell, with colors enabled
- **THEN** the cell shows `▀` in the upper series' color on the lower series' color

### Requirement: Slices filled by angle

Pie slices SHALL be filled with braille dots by angle and distance from the pie's center; donut slices SHALL fill only their ring, with the ring width the scene gives or else the default `--ct-donut-width`.

#### Scenario: Donut

- **WHEN** a donut with one series is rendered
- **THEN** the middle of the donut is empty and the ring is filled

### Requirement: Grid in box-drawing characters

Grid lines SHALL be drawn in dim box-drawing characters, with a crossing character where horizontal and vertical grid lines meet. A line, point, bar or slice drawn over a grid cell SHALL replace it.

#### Scenario: Grid crossing

- **WHEN** a line chart with grid lines on both axes is rendered
- **THEN** the cells where the grid lines cross show `┼`

### Requirement: Labels on the character grid

Axis and slice labels SHALL be written as text in the row of their line's vertical center, aligned as the scene anchors them (start, middle or end). A label over a colored cell SHALL take that color as its background, with black or white text, whichever reads better.

#### Scenario: Value labels on their grid lines

- **WHEN** a line chart is rendered with the terminal defaults
- **THEN** each Y axis label is in the same row as its grid line

#### Scenario: Slice label

- **WHEN** a pie chart with labels is rendered with colors
- **THEN** each slice's label appears on its slice, on the slice's color

### Requirement: Series colors

Series SHALL be colored by their series letter (`ct-series-a` the first color, and so on), from Chartist's default series colors unless a palette of hex colors is given.

#### Scenario: Custom palette

- **WHEN** a bar chart with two series is rendered with the palette `['#000000', '#ffffff']`
- **THEN** the second series' bars are white

### Requirement: Color modes

Text output SHALL support four color modes: 24-bit, 256 colors, 16 colors (each color mapped to the nearest), and none. With none, the output SHALL contain no escape codes.

#### Scenario: Plain text

- **WHEN** a chart is rendered with the color mode none
- **THEN** the output contains no escape sequences and still shows the chart, its grid and labels

#### Scenario: 256 colors

- **WHEN** a chart is rendered with 256 colors
- **THEN** its colors are written as `38;5;n` escape codes

### Requirement: Nodes without a built-in role

Nodes that plugins add SHALL be drawn by their element: `line` and `path` as lines, `circle` as a point, `text` as a label. Other elements without a role SHALL be skipped, and their children drawn. A node a plugin replaced while keeping its role, whose element differs from the one Chartist draws for that role (a `circle` with the role `point`), SHALL be drawn by its element too. A node in a series group, or with a `ct-series-x` class, SHALL take that series' color.

#### Scenario: A plugin's line

- **WHEN** a scene gets a plain `line` element across the chart
- **THEN** the output shows it as a braille line

#### Scenario: A point replaced by a circle

- **WHEN** a plugin replaces each point with a `circle` and keeps its role, context and key
- **THEN** the output shows each circle as a point in its series' color

### Requirement: HTML output

A scene SHALL also render as HTML: a `pre` element with one line per row, where colored cells are spans with classes (`ct-series-a`, `ct-grid`, `ct-label`, `ct-area`, and a background class where a cell has one). The markup SHALL contain no `style` attributes, and text SHALL be escaped.

#### Scenario: Classes instead of colors

- **WHEN** a bar chart is rendered as HTML
- **THEN** its bars are in spans with the class `ct-series-a`, and the markup has no `style` attribute and no escape codes

#### Scenario: Escaped label

- **WHEN** a chart with the label `<b>` is rendered as HTML
- **THEN** the markup contains `&lt;b&gt;`

#### Scenario: Columns in any font

- **WHEN** HTML output with the stylesheet is shown on a system whose fonts have no braille or box-drawing characters
- **THEN** every character still sits on a grid of cells 0.6 em wide and 1 em high, the braille dots, grid lines and bars come from the stylesheet's own font and fill their cells, and the grid lines run unbroken through all rows

### Requirement: Stylesheet for HTML output

The package SHALL ship a stylesheet that colors HTML output with Chartist's custom properties (`--ct-series-a` to `--ct-series-o`, `--ct-grid-color`, `--ct-label-color`), falling back to the default colors, so themes that set them apply to HTML output too.

#### Scenario: A theme's series color

- **WHEN** a page with the stylesheet sets `--ct-series-a: green` on the chart's container
- **THEN** the first series in the HTML output is green

### Requirement: Cell font for HTML output

The stylesheet SHALL embed a font with the characters the renderer draws besides text (the braille patterns, the grid's box-drawing characters, the block characters and the legend marker), each glyph filling a cell of 0.6 × 1 em, so HTML output looks the same whatever fonts the reader's system has. The stylesheet SHALL need no other file.

#### Scenario: Every graphic character

- **WHEN** the font embedded in the built stylesheet is read
- **THEN** it has a glyph 0.6 em wide for each of the 256 braille patterns, `┈`, `┊`, `┼`, the block characters and `■`, and its ascent and descent add up to 1 em

### Requirement: Chart functions for CLI tools

The package SHALL provide line, bar and pie chart functions that take the data and options of the 1.x presets, plus a size in columns and rows, a color mode, a palette and an output format (text or HTML), and return the rendered chart as a string. Their defaults SHALL fit the character grid; given options SHALL override them.

#### Scenario: Line chart in one call

- **WHEN** a CLI tool calls the line chart function with labels, two series, `showArea: true` and 60 × 15 cells
- **THEN** it receives the chart as text with ANSI colors, with X labels in the row below the axis

#### Scenario: 1.x options apply

- **WHEN** the bar chart function gets `horizontalBars: true` and `stackBars: true`
- **THEN** the bars are horizontal and stacked, as the bar preset draws them

### Requirement: Legend

The package SHALL provide a legend for a chart's data: each named series as a colored marker and its name, in the chart's color mode, within a given width.

#### Scenario: Named series

- **WHEN** the legend is made for series named `Visitors` and `Sign-ups` without colors
- **THEN** it reads `■ Visitors  ■ Sign-ups`

### Requirement: Color detection

The package SHALL provide a function that picks a color mode from an output stream and environment variables given to it: none when `NO_COLOR` is set, `TERM` is `dumb` or the stream is not a terminal; `FORCE_COLOR` (0 to 3) over that; otherwise 24-bit when `COLORTERM` is `truecolor` or `24bit`, else 256 colors.

#### Scenario: Piped output

- **WHEN** the stream is not a terminal and `FORCE_COLOR` is not set
- **THEN** the color mode is none

#### Scenario: Forced colors

- **WHEN** the stream is not a terminal and `FORCE_COLOR` is `2`
- **THEN** the color mode is 256 colors

### Requirement: Runs outside Node.js

The renderer and chart functions SHALL NOT import Node.js modules or read global state such as `process`, so they run in browsers and other JavaScript runtimes.

#### Scenario: HTML in the browser

- **WHEN** a web page bundles the package and renders a chart as HTML
- **THEN** it works without Node.js polyfills
