# responsive-options Specification

## Purpose

Defines how charts switch options at breakpoints, either by window media queries as in 1.x or by the size of the chart's own container.

## Requirements

### Requirement: Window media query mode

By default, responsive options SHALL be pairs of a media query string and an options object. All matching pairs are merged in order over the base options, as in 1.x, and re-evaluated when a query's match state changes.

#### Scenario: 1.x responsive options

- **WHEN** a chart has responsive options `[['screen and (max-width: 640px)', { showPoint: false }]]` and the viewport shrinks below 641 px
- **THEN** the chart re-renders without points, and an options change is reported to listeners

### Requirement: Container query mode

When configured for container mode, responsive conditions SHALL be evaluated against the chart container's size instead of the viewport. At least `min-width`, `max-width`, `min-height`, `max-height`, `aspect-ratio` ranges, `and` and comma-separated lists SHALL be supported.

#### Scenario: Container breakpoint

- **WHEN** a chart in container mode has the condition `(max-width: 400px)` and sits in a 350 px wide sidebar on a 1440 px wide viewport
- **THEN** the options for that condition are applied

#### Scenario: Container resize crosses breakpoint

- **WHEN** the container of that chart grows from 350 px to 600 px
- **THEN** the chart re-renders without those options

### Requirement: Mode selection

The responsive mode SHALL be selectable per chart. The default SHALL be window mode, so 1.x behavior is unchanged.

#### Scenario: Default stays window mode

- **WHEN** a chart is created with responsive options and no mode setting
- **THEN** conditions are evaluated as window media queries

### Requirement: Invalid container conditions

A container-mode condition using an unsupported feature SHALL be reported with a descriptive error that names the condition, and SHALL NOT fail silently.

#### Scenario: Unsupported feature

- **WHEN** a container-mode condition uses `(orientation: portrait)` and that feature is not supported
- **THEN** the chart reports an error naming the condition and the unsupported feature
