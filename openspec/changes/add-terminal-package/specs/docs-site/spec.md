# Spec Delta

## MODIFIED Requirements

### Requirement: Guides and chart type pages

The docs SHALL have pages for each chart type (line, bar, pie and donut, composed) and guides for data and options, sizing, styling with CSS, responsive options, axes and scales, animations, events and plugins, server rendering, terminal rendering, and updating charts. They SHALL use the functional API, show at least one live example each, and follow the writing guide in `apps/docs/WRITING.md`.

#### Scenario: A guide runs as written

- **WHEN** a reader opens a guide and presses Edit on its live example
- **THEN** the example runs against the current build and the chart re-renders as the code changes

#### Scenario: Terminal chart in the browser

- **WHEN** a reader opens the terminal rendering guide
- **THEN** its live example imports `@chartist-js/terminal`, renders a chart as HTML from the current build, and re-renders as the code changes
