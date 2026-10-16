## ADDED Requirements

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
