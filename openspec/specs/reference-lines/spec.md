# reference-lines Specification

## Purpose

Defines the target line and trend line layers of `@chartist-js/essentials`: what they draw, their roles and contexts, trend lines on transformed axes, their styles in the essentials stylesheet, and where they're documented.

## Requirements

### Requirement: Target line layer

`@chartist-js/essentials` SHALL export the `targetLine()` layer, which SHALL draw one line across the chart area at a constant value on one axis: an axis id, by default the first Y axis. Several lines SHALL be several layers. On a Y axis the line SHALL be horizontal; on an X axis, vertical. On a step axis the value SHALL be a position by index, as for the axis's ticks. The line SHALL accept an optional label and an optional class. A label SHALL be drawn as SVG text next to the line, inside the chart area, at the line's end by default or at its start. The layer SHALL report its value as its extent, so the axis includes it (an axis's own `low` and `high` still win). A value outside the axis's range SHALL draw nothing. A layer without a value SHALL throw when it's created. The layer SHALL support only `cartesian` coordinates.

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

### Requirement: Trend line layer

`@chartist-js/essentials` SHALL export the `trendLine()` layer, which SHALL fit a least-squares straight line through the values of each series it selects (all by default) and draw it from the series' smallest to its largest X: on a step axis X is the value index, on a scale axis the value's `x`. It SHALL skip holes, draw nothing for a series with fewer than two values, and take `x`, `y`, `align` (as the line layer) and `classNames`. Each line SHALL be a `line.ct-trend-line` with the role `trendLine` inside a series group with the series' classes, so it takes the series' color, and its context SHALL carry the series index, the slope, the intercept and, unless all values are equal, the correlation coefficient r of the values (from -1 to 1; its square is R²). The values at the line's ends SHALL count towards the Y axis's range. The layer SHALL support only `cartesian` coordinates.

#### Scenario: A rising series

- **WHEN** a line chart's series `[1, 2, 4, 3, 5]` gets `trendLine()` as an extra layer
- **THEN** a `line.ct-trend-line` in `g.ct-series-a` runs from the fitted value at index 0 to the fitted value at index 4, and its context has the slope 0.9

#### Scenario: Correlation

- **WHEN** a series' values all lie on a rising line, and another series' values are all equal
- **THEN** the first trend line's context has the correlation 1, and the second's has none

#### Scenario: Ends outside the values

- **WHEN** the fitted line's end lies below the smallest value of the series
- **THEN** the Y axis extends to include it

#### Scenario: Too few values

- **WHEN** a selected series has one value and holes
- **THEN** no trend line is drawn for it

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

### Requirement: Target and trend line roles

The `targetLine()` and `trendLine()` layers SHALL give their nodes the roles `targetLine` (a line), `targetLabel` (a line's label) and `trendLine` (a fitted line), declared by `@chartist-js/essentials` through module augmentation of `chartist`'s `NodeRoles`, with their context types exported from the package: a target line and its label know the axis, the value, the label text and their position in px; a trend line knows its series index, slope, intercept, correlation and ends. Code that imports the package SHALL get these roles narrowed like the core's built-in roles, and `compose` listeners SHALL receive these nodes and be able to change or drop them. `chartist` SHALL NOT declare these roles.

#### Scenario: Finding a target line

- **WHEN** a `scene` listener queries the scene for nodes with role `targetLine`
- **THEN** it gets one node per target line, and each node's context has the line's value and its axis

#### Scenario: Tooltips on a trend line

- **WHEN** TypeScript code imports `trendLine` from `@chartist-js/essentials` and passes `roles: ['trendLine']` to `tooltips()`
- **THEN** `item.context.slope` is typed as a number

### Requirement: Target and trend line styles

The essentials stylesheet SHALL style target lines, their labels and trend lines through custom properties with defaults: the target line's color, width and dash pattern (`--ct-target-line-color`, `--ct-target-line-width`, `--ct-target-line-dasharray`) and the trend line's width and dash pattern (`--ct-trend-line-width`, `--ct-trend-line-dasharray`). By default a target line SHALL be a dashed line 2 px wide in the text color, and a trend line dashed and 2 px wide in its series' color. A target line or label with a `ct-series-<letter>` class, or inside a series group, SHALL take that series' color from `--ct-color` instead. The defaults SHALL work in light and dark mode; apart from the target line's width, 1 px in 2.1, they're those the core stylesheet had in 2.1.

#### Scenario: Both stylesheets

- **WHEN** a page loads `chartist/styles.css` and `@chartist-js/essentials/styles.css` and draws a target line and a trend line
- **THEN** they look as they did in 2.1 with the core stylesheet alone, except that the target line is 2 px wide

#### Scenario: Series color on a target line

- **WHEN** a target line has the class `ct-series-c`
- **THEN** its line and its label are drawn in the third series' color

### Requirement: Where the lines are documented

The `@chartist-js/essentials` docs SHALL have a page for each line, with live examples: target lines at `/packages/essentials/target-lines/` (a labeled goal on a preset, a goal and a minimum, a vertical line on horizontal bars) and trend lines at `/packages/essentials/trend-lines/` (a trend through bars, a regression line through points, how well it fits with its slope and R² read from the scene, and a trend on log axes). Both SHALL import the lines from the package and link the core's bands guide or each other where they meet. The essentials overview SHALL list both pages, and the home page's news row for the package SHALL name some of its layers. The core's former "Target lines and bands" guide becomes the bands guide at `/docs/bands/`; the old URL SHALL NOT be redirected, and the links that pointed to it (the redirect of the `chartist-plugin-targetline` page and the 0.x site's target line anchors) SHALL point to the target lines page. No doc comment, code sample, guide or example SHALL import the lines from `chartist`. The gallery's target line, trend line and scatter regression examples SHALL be in its "Essentials" section.

#### Scenario: The trend lines page

- **WHEN** a reader opens `/packages/essentials/trend-lines/`
- **THEN** its live examples import `trendLine()` from `@chartist-js/essentials`, and one of them shows each line's slope and R²

#### Scenario: The old target line plugin link

- **WHEN** a visitor opens `/plugins/chartist-plugin-targetline/`
- **THEN** they land on the target lines page

#### Scenario: In the gallery

- **WHEN** a visitor opens the examples gallery
- **THEN** the target line, trend line and scatter regression examples are listed in the "Essentials" section
