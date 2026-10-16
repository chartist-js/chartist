## ADDED Requirements

### Requirement: Element output

A scene SHALL also render as a DOM element: a `pre` element with the same structure, classes and text as the HTML output, built with DOM methods in a given document (the global one by default), so a page can add text art without `innerHTML` or a Trusted Types policy. Rendering a scene as an element SHALL be the only place the package reads the global `document`, and only when no document is given.

#### Scenario: Same markup as HTML

- **WHEN** a bar chart is rendered as an element and as HTML
- **THEN** the element's `outerHTML` equals the HTML output

#### Scenario: Under Trusted Types

- **WHEN** a page that requires Trusted Types appends a line chart rendered as an element
- **THEN** the chart shows and no violation is reported

#### Scenario: Escaped by construction

- **WHEN** a chart with the label `<b>` is rendered as an element
- **THEN** the element contains the text `<b>` and no `b` element

## MODIFIED Requirements

### Requirement: Chart functions for CLI tools

The package SHALL provide line, bar and pie chart functions that take the data and options of the 1.x presets, plus a size in columns and rows, a color mode, a palette and an output format (text, HTML or element), and return the rendered chart as a string, or as a `pre` element for the element format. Their defaults SHALL fit the character grid; given options SHALL override them.

#### Scenario: Line chart in one call

- **WHEN** a CLI tool calls the line chart function with labels, two series, `showArea: true` and 60 × 15 cells
- **THEN** it receives the chart as text with ANSI colors, with X labels in the row below the axis

#### Scenario: 1.x options apply

- **WHEN** the bar chart function gets `horizontalBars: true` and `stackBars: true`
- **THEN** the bars are horizontal and stacked, as the bar preset draws them

#### Scenario: Element format

- **WHEN** a page calls the pie chart function with `format: 'element'`
- **THEN** it receives a `pre` element it can append, typed as an element

### Requirement: Legend

The package SHALL provide a legend for a chart's data: each named series as a colored marker and its name, in the chart's color mode, within a given width. It SHALL come as text, as HTML or as an element, like the chart functions.

#### Scenario: Named series

- **WHEN** the legend is made for series named `Visitors` and `Sign-ups` without colors
- **THEN** it reads `■ Visitors  ■ Sign-ups`

#### Scenario: Legend as an element

- **WHEN** the legend is made with `format: 'element'` for a series named `<b>`
- **THEN** it is a `pre` element whose text contains `<b>`, with no `b` element
