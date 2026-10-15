## MODIFIED Requirements

### Requirement: Themable default styles

The default stylesheet SHALL read every themable value from a `--ct-*` custom property with the 1.x value as fallback: the series colors (`--ct-series-a` to `--ct-series-z`) and the label, grid, line, point, area, bar and donut styles. Without any of them set, charts SHALL render exactly as with the 1.x stylesheet, except that series p to z, which 1.x left uncoloured, are coloured. Properties SHALL apply in any scope (page, container, chart).

#### Scenario: Property names

- **WHEN** the stylesheet is inspected
- **THEN** it reads `--ct-series-a` to `--ct-series-z`, `--ct-label-color`, `--ct-label-size`, `--ct-grid-color`, `--ct-grid-width`, `--ct-grid-dasharray`, `--ct-grid-background-fill`, `--ct-line-width`, `--ct-line-dasharray`, `--ct-point-size`, `--ct-point-shape`, `--ct-area-opacity`, `--ct-bar-width` and `--ct-donut-width`

#### Scenario: Unchanged defaults

- **WHEN** every example is rendered with the v2 stylesheet and no custom properties set
- **THEN** the screenshots equal the 1.5 baselines

#### Scenario: Scoped override

- **WHEN** a container sets `--ct-series-a: #0544d3` and `--ct-grid-dasharray: none`
- **THEN** the first series of the chart inside is drawn in `#0544d3` and its grid lines are solid, and charts outside the container keep the defaults

### Requirement: Per-series color

Each series group with a `ct-series-<letter>` class SHALL set `--ct-color` from its series property, and points, lines, bars, areas and slices SHALL take their color from `--ct-color`. The selectors SHALL keep the 1.x specificity, so 1.x CSS overrides keep working. When there are more series names than colours, the colours SHALL repeat in order, and a series whose colour repeats SHALL fall back to the property of the series it repeats.

#### Scenario: One property per series

- **WHEN** a page sets `--ct-series-b: green`
- **THEN** the second series' line, points and area are green in line charts, and its bars or slice in bar and pie charts

#### Scenario: 1.x override still wins

- **WHEN** a page has the 1.x override `.ct-series-a .ct-line { stroke: blue; }`
- **THEN** the first series' line is blue

#### Scenario: The sixteenth series

- **WHEN** a donut draws 16 slices with the default stylesheet, and a page then sets `--ct-series-a: green`
- **THEN** the 16th slice first has the first series' default colour, then turns green, unless `--ct-series-p` is set

### Requirement: Sass variables remain defaults

The Sass variables (`$ct-series-colors`, `$ct-grid-color`, …) SHALL provide the fallback values of the custom properties, so Sass users who override them get their values as defaults, and custom properties still override those. A `$ct-series-names` list longer than `$ct-series-colors` SHALL cycle the colours instead of failing.

#### Scenario: Sass default with a property override

- **WHEN** Sass sets `$ct-line-width: 2px` and a page sets `--ct-line-width: 6px` on one chart
- **THEN** that chart's lines are 6 px wide and other charts' lines 2 px

#### Scenario: Fewer colours than names

- **WHEN** Sass compiles with three series names and two colours
- **THEN** it succeeds, and the third series gets the first colour
