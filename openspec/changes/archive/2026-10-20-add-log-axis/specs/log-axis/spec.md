## Purpose

Defines `logAxis()` in `@chartist-js/essentials`: a logarithmic scale axis for data that spans several orders of magnitude, with ticks at the powers of its base, optional minor grid lines, and defined behavior for zero and negative values and for the layers drawn on it.

## ADDED Requirements

### Requirement: Log axis factory

`@chartist-js/essentials` SHALL export `logAxis(options?)`, which returns an axis factory of kind `log` for the `type` of the presets' `axisX` and `axisY` and of the axes of `cartesianAxes()`, as an X or a Y axis. Its options SHALL be `base` (a finite number greater than 1, default 10) and `minorTicks` (default `false`). The shared axis options (`low`, `high`, `ticks`, `scaleMinSpace`, `labelTransform`, `offset`, `showGrid`, `showLabel`, …) SHALL be read from the axis definition, as for the core's axis types. `logAxis()` with a `base` that isn't a finite number greater than 1 SHALL throw an error naming `logAxis` and `base`.

#### Scenario: A log Y axis on a line chart

- **WHEN** `lineChart('#chart', data, { axisY: { type: logAxis() } })` is called
- **THEN** the chart renders, and its Y axis has the kind `log`

#### Scenario: In a composed chart

- **WHEN** `cartesianAxes([{ id: 'x', side: 'bottom', type: logAxis() }, { id: 'y', side: 'left', type: logAxis() }])` is used with a line layer on `{ x, y }` values
- **THEN** both axes place values on a log scale (a log-log chart)

#### Scenario: Invalid base

- **WHEN** `logAxis({ base: 1 })` or `logAxis({ base: -10 })` is called
- **THEN** it throws an error naming `logAxis` and `base`

### Requirement: Range in whole powers

Without `low` and `high`, the axis range SHALL run from the largest power of the base at or below the smallest positive value to the smallest power at or above the largest value, over the values of the series bound to the axis and the extents its layers report. When both round to the same power, the range SHALL run from one power below it to one power above it. Without positive values, the range SHALL run from 1 to the base. A `low` or `high` set on the axis SHALL be used exactly, without rounding; a `low` or `high` of zero or below SHALL throw an error naming `logAxis`. A `high` at or below `low` SHALL make the range run from `low` to `low` times the base. The axis's `range` SHALL report the bounds as values, not as exponents.

#### Scenario: Decades from the data

- **WHEN** a log axis with base 10 is bound to values from 120 to 850,000
- **THEN** its range is 100 to 1,000,000

#### Scenario: Equal spacing of decades (#1176)

- **WHEN** that axis is 400 px long
- **THEN** 100, 1,000, 10,000, 100,000 and 1,000,000 are placed 100 px apart

#### Scenario: One value

- **WHEN** every value bound to a base 10 log axis is 100
- **THEN** its range is 10 to 1,000

#### Scenario: Explicit bounds

- **WHEN** a log axis has `low: 50` and `high: 5000`
- **THEN** its range is exactly 50 to 5,000

#### Scenario: A low of zero

- **WHEN** a log axis has `low: 0`
- **THEN** creating the chart throws an error naming `logAxis` and `low`

#### Scenario: Base 2

- **WHEN** a log axis with `base: 2` is bound to values from 3 to 100
- **THEN** its range is 2 to 128

### Requirement: Log projection

The axis SHALL place a positive value at `length × (log(value) − log(min)) / (log(max) − log(min))` px from its start, where `min` and `max` are its range. Values outside the range SHALL be placed outside the axis, as on the core's scale axes. Values of zero or below SHALL be placed at the axis start (0 px), and SHALL NOT count towards the range. Holes SHALL stay holes.

#### Scenario: Positions

- **WHEN** a log axis from 1 to 1,000 is 300 px long
- **THEN** 1 is at 0 px, 10 at 100 px, 100 at 200 px and about 31.62 at 150 px

#### Scenario: Zero and negative values

- **WHEN** a line chart on a log Y axis has the values 0, −5, 10 and 1,000
- **THEN** the range is 10 to 1,000, and the points for 0 and −5 lie on the bottom edge of the chart area

### Requirement: Ticks at powers

The axis's ticks SHALL be the powers of the base within its range, as exact as the decimal power (`0.001`, not `0.0010000000000000002`). When the distance between two powers is less than `scaleMinSpace` px (default 20), the ticks SHALL be every nth power, with n the smallest whole number that makes them at least `scaleMinSpace` apart, at the exponents divisible by n. When the range holds fewer than two powers, the ticks SHALL be the whole multiples of the powers (2, 3, … for base 10) within the range, thinned the same way. A `ticks` axis option SHALL replace the computed ticks; ticks of zero or below SHALL be left out.

#### Scenario: Every decade

- **WHEN** a log axis from 1 to 10,000 is 400 px long
- **THEN** its ticks are 1, 10, 100, 1,000 and 10,000

#### Scenario: Decades too close

- **WHEN** a log axis from 1 to 100,000,000 is 100 px long with the default `scaleMinSpace`
- **THEN** its ticks are 1, 100, 10,000, 1,000,000 and 100,000,000

#### Scenario: Less than a decade

- **WHEN** a log axis has `low: 20` and `high: 80` and is 300 px long
- **THEN** its ticks are 20, 30, 40, 50, 60, 70 and 80

#### Scenario: Ticks by hand

- **WHEN** a log axis has `ticks: [10, 16, 25, 40, 63, 100]`
- **THEN** grid lines and labels are drawn at exactly those values, at their log positions

#### Scenario: Small values

- **WHEN** a log axis is bound to values from 0.002 to 0.5
- **THEN** its ticks are 0.001, 0.01, 0.1 and 1, and their default labels read `0.001`, `0.01`, `0.1` and `1`

### Requirement: Minor ticks

With `minorTicks: true`, the axis SHALL report minor ticks: the whole multiples 2 to base − 1 of each power within the range (20, 30, … 90 between 10 and 100 for base 10), or, when its ticks are every nth power, the powers left out. Minor ticks SHALL be drawn as minor grid lines, without labels. Without `minorTicks`, the axis SHALL report none.

#### Scenario: Minor grid lines

- **WHEN** a log Y axis from 1 to 100 has `minorTicks: true` and the chart has a grid
- **THEN** the output has major grid lines at 1, 10 and 100 and minor grid lines (`line.ct-grid.ct-grid-minor`) at 2 to 9 and 20 to 90, and labels only at 1, 10 and 100

#### Scenario: Thinned decades

- **WHEN** an axis with `minorTicks: true` shows every second decade from 1 to 10,000
- **THEN** its minor ticks are 10 and 1,000

#### Scenario: Base 2

- **WHEN** a log axis with `base: 2` has `minorTicks: true` and ticks at every power
- **THEN** it reports no minor ticks

### Requirement: Labels on a log axis

Labels SHALL show the tick value as a number by default. `labelTransform` SHALL receive the tick value and its index, as on the other axes, and its result SHALL be used the same way.

#### Scenario: Formatted labels

- **WHEN** a log Y axis has `labelTransform: value => value.toLocaleString('en-US')`
- **THEN** its labels read `100`, `1,000`, `10,000`, and so on

### Requirement: Layers on a log axis

The core layers SHALL draw on a log axis without changes:

- lines, points and areas at their log positions; areas SHALL close at the axis start;
- bars SHALL grow from the axis start; a bar for zero or a negative value SHALL have no length;
- `band()` edges at their log positions; `mark` SHALL compare values, not positions;
- `targetLine()` at its value; a target line at zero or below SHALL sit at the axis start;
- `trendLine()` SHALL fit its line in log space (see chart-composition, "Trend lines on transformed axes"), so it's straight on the axis and follows exponential growth on a log Y axis.

#### Scenario: Bars from the axis start

- **WHEN** `barChart` gets the values 10, 1,000 and 0 and `axisY: { type: logAxis(), low: 1 }`
- **THEN** every bar starts at the bottom edge of the chart area, the second bar is three times as long as the first, and the third has no length

#### Scenario: An area

- **WHEN** a line chart with `showArea: true` draws on a log Y axis
- **THEN** each area closes at the bottom edge of the chart area

#### Scenario: Exponential growth

- **WHEN** a line chart on a log Y axis has the values 1, 10, 100 and 1,000 and a `trendLine()` layer
- **THEN** the trend line passes through all four points

### Requirement: Log axes with other axes

A log axis SHALL work as any axis of a composed chart: on any side, bound to some layers by id, next to linear axes, with its range computed only from the series and extents bound to it.

#### Scenario: Linear and log Y axes

- **WHEN** a bar layer is bound to a left `autoScaleAxis()` and a line layer to a right `logAxis()`
- **THEN** the left axis is linear over the bar values, the right axis is logarithmic over the line values, and each has its own labels

### Requirement: Log axes on the server and in the terminal

A chart with a log axis SHALL produce its scene with `toScene()` in Node.js without a DOM, the same scene for the same inputs, so it renders with `renderToString()`, hydrates, and draws with `@chartist-js/terminal`.

#### Scenario: Server rendering

- **WHEN** `toScene()` is called twice in Node.js with a log axis config
- **THEN** both scenes are equal, and `renderToString()` of the scene has a grid line per tick

#### Scenario: Terminal

- **WHEN** `@chartist-js/terminal` renders a line chart with a log Y axis and `minorTicks: true`
- **THEN** the output has a grid line and a label for each tick, and no minor grid lines

### Requirement: Log axis docs and examples

The `@chartist-js/essentials` docs SHALL have a log axis guide with live examples: decades, bases, minor grid lines, labels, zero and negative values, bars, trend lines and multiple axes. The "Axes and scales" guide SHALL mention the log axis next to the core's axis types and link the guide. The examples SHALL include a line chart on a log Y axis (`essentials/log-axis`), a public dataset that's unreadable on a linear scale with minor grid lines on its Y axis and a button that switches that axis between linear and log (`essentials/moores-law`), and a log-log chart with minor grid lines and a trend line (`essentials/log-log`), all in the gallery's "Essentials" section and screenshotted by the visual tests.

#### Scenario: In the gallery

- **WHEN** a visitor opens the examples gallery
- **THEN** the "Essentials" section lists the three log axis examples

#### Scenario: From the axes guide

- **WHEN** a reader opens the "Axes and scales" guide
- **THEN** it names the log axis from `@chartist-js/essentials` and links its guide
