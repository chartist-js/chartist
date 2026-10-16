# chart-theming Specification

## Purpose

Defines how charts are themed with CSS: the custom properties of the default styles, per-series colors, and the opt-in themes shipped with the package.

## Requirements

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

### Requirement: Accessible theme

The package SHALL ship an opt-in theme `chartist/themes/accessible.css` that sets a color-blind-safe palette for eight series on elements with the class `ct-theme-accessible` and their descendants. It SHALL choose light or dark values by the element's `color-scheme`, without depending on a site's class names.

#### Scenario: Opting in

- **WHEN** a page imports the theme and wraps a chart in `<div class="ct-theme-accessible">`
- **THEN** the chart's first eight series use the accessible palette, and charts outside keep the classic palette

#### Scenario: Dark color scheme

- **WHEN** the wrapper (or the page) sets `color-scheme: dark`
- **THEN** the chart uses the dark values of the accessible palette

### Requirement: Target line and band styles

The default stylesheet SHALL style target lines, their labels and bands through custom properties with defaults: the target line's color, width and dash pattern (`--ct-target-line-color`, `--ct-target-line-width`, `--ct-target-line-dasharray`), and the band's color and opacity (`--ct-band-color`, `--ct-band-opacity`). By default a target line SHALL be a dashed line in the text color, and a band a light fill in the same color, so both read as references behind the data. A target line, label or band with a `ct-series-<letter>` class, or inside a series group, SHALL take that series' color from `--ct-color` instead. The defaults SHALL work in light and dark mode.

#### Scenario: Theme with a property

- **WHEN** a page sets `--ct-band-opacity: 0.3`
- **THEN** every band's fill opacity is 0.3

#### Scenario: Series color on a target line

- **WHEN** a target line has the class `ct-series-c`
- **THEN** its line and its label are drawn in the third series' color

#### Scenario: Dark mode

- **WHEN** the chart's text color changes for dark mode
- **THEN** target lines and bands without a series class follow it

### Requirement: Defaults for a dark color scheme

The default stylesheet SHALL give labels and grid lines light defaults where the chart's `color-scheme` is dark, in browsers that support `light-dark()`: light text for labels and light, translucent grid lines. Where the color scheme is light or not set, and in browsers without `light-dark()`, the defaults SHALL stay the 1.x values. `--ct-label-color` and `--ct-grid-color` SHALL win over these defaults, and a Sass setting SHALL turn the dark defaults off.

#### Scenario: A dark page

- **WHEN** a page sets `color-scheme: dark` and draws a chart with the default stylesheet
- **THEN** the labels and grid lines are light enough to read on a dark background

#### Scenario: A light page

- **WHEN** a page sets no `color-scheme`
- **THEN** labels and grid lines have exactly the 1.x colors

#### Scenario: The custom property wins

- **WHEN** a dark page sets `--ct-label-color: orange`
- **THEN** the labels are orange

### Requirement: Trend line styles

The default stylesheet SHALL draw trend lines dashed, in their series' color, with their width and dash pattern as custom properties (`--ct-trend-line-width`, `--ct-trend-line-dasharray`).

#### Scenario: Series color

- **WHEN** a trend line is drawn for the second series
- **THEN** it has the second series' color and the default dash pattern
