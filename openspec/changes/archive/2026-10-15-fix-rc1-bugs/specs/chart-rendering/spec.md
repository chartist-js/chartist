## ADDED Requirements

### Requirement: Style measurement for layout

Renderers MAY provide a style measurement capability that layout uses for values the stylesheet decides. The DOM renderer SHALL provide it, measuring computed styles in the chart's container. Layout SHALL fall back to its default when a value can't be measured. The pie layer SHALL lay out a donut for the measured stroke width of a donut slice unless `donutWidth` is set.

#### Scenario: Donut width from CSS

- **WHEN** a donut without `donutWidth` is drawn in a container that sets `--ct-donut-width: 20px`
- **THEN** its ring is laid out for 20 px, so it touches the chart's edge

#### Scenario: Donut width without a DOM

- **WHEN** a donut without `donutWidth` is rendered to a string
- **THEN** its ring is laid out for 60 px

### Requirement: Charts in another document

A chart attached to an element of another document (an iframe, or JSDOM in Node without globals) SHALL use that element's document and window to create elements, match media queries, observe its size and listen for resizes. `Svg` SHALL recognize elements of any document.

#### Scenario: JSDOM without globals

- **WHEN** `lineChart()` with the compat plugin and `new LineChart()` draw into a JSDOM element in Node with no DOM globals installed, and `new Svg()` wraps a JSDOM element
- **THEN** all three work without errors, and the 1.x `draw` events fire

#### Scenario: Media queries in an iframe

- **WHEN** a chart in an iframe has responsive options whose query matches the iframe's width but not the top window's
- **THEN** the chart uses the override

### Requirement: Printing

A chart attached to the DOM SHALL fit the box it gets when the page is printed. During printing, its SVG SHALL have a `viewBox` of its layout size, unless the chart's config sets one, and the `viewBox` SHALL be removed afterwards. Detached charts SHALL NOT react.

#### Scenario: Printing a wide chart

- **WHEN** a chart laid out at 1400 px wide is printed into a 795 px wide box
- **THEN** the whole chart is visible in the print, scaled to the box
