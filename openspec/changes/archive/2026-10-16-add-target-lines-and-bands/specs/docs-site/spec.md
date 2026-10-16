## MODIFIED Requirements

### Requirement: Guides and chart type pages

The docs SHALL have pages for each chart type (line, bar, pie and donut, composed) and guides for data and options, sizing, styling with CSS, responsive options, axes and scales, target lines and bands, animations, events and plugins, server rendering, and updating charts. They SHALL use the functional API, show at least one live example each, and follow the writing guide in `apps/docs/WRITING.md`.

#### Scenario: A guide runs as written

- **WHEN** a reader opens a guide and presses Edit on its live example
- **THEN** the example runs against the current build and the chart re-renders as the code changes

#### Scenario: Target lines and bands on a preset

- **WHEN** a reader opens the target lines and bands guide
- **THEN** it shows a target line added to a preset with the `layers` option and a band chart with a band and lines on top, both live

## ADDED Requirements

### Requirement: Plugins the core replaces

A plugin whose use case the core covers SHALL NOT be listed on the plugins page. When its page was published, its URL SHALL redirect to the docs page that covers the use case.

#### Scenario: The target line plugin

- **WHEN** a visitor opens `/plugins/chartist-plugin-targetline/`
- **THEN** they land on the target lines and bands guide, and the plugins overview has no tile for `chartist-plugin-targetline`
