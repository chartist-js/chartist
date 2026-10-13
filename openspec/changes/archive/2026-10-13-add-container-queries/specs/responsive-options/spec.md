# Spec Delta

## MODIFIED Requirements

### Requirement: Container query mode

A responsive entry whose condition is created with `container(query)` SHALL be evaluated as a CSS `@container` condition with `Element.matchContainer()`, against the containers that are ancestors of the chart's content (the chart container or its ancestors with a `container-type`). Container entries SHALL be re-evaluated when the chart container is resized and when the API reports a change.

#### Scenario: Container breakpoint

- **WHEN** a chart has the entry `[container('(width < 400px)'), { showPoint: false }]`, its container has `container-type: inline-size`, and it sits in a 350 px wide sidebar on a 1440 px wide viewport
- **THEN** the chart renders without points

#### Scenario: Container resize crosses breakpoint

- **WHEN** the container of that chart grows from 350 px to 600 px
- **THEN** the chart re-renders with points and emits a `responsive` event

#### Scenario: Unchanged matches

- **WHEN** the container is resized but the set of matching entries stays the same
- **THEN** no responsive re-render and no `responsive` event happen

### Requirement: Mode selection

The kind of each responsive entry SHALL be chosen per entry: a plain string is a window media query (1.x behavior), and a `container()` condition is a container query. Both kinds MAY be mixed; all matching entries SHALL be merged over the base options in declaration order. The 1.x classes SHALL ignore container entries.

#### Scenario: Default stays window mode

- **WHEN** a chart is created with responsive entries that are plain strings
- **THEN** conditions are evaluated as window media queries, as in 1.x

#### Scenario: Mixed entries

- **WHEN** a media entry sets `showArea: true` and a later matching container entry sets `showArea: false`
- **THEN** the chart renders without an area

### Requirement: Invalid container conditions

When `Element.matchContainer()` is not available, container entries SHALL NOT match, and Chartist SHALL warn once per page, naming the API and the `match-container` polyfill. When the API rejects a condition, the error SHALL name the condition. Rendering without a DOM (`toScene()`) SHALL treat container entries as not matching, without a warning.

#### Scenario: Missing API

- **WHEN** a chart with a container entry is created in a browser without `Element.matchContainer()`
- **THEN** the chart renders with the base and media options, and one console warning mentions `matchContainer` and the polyfill

#### Scenario: Unsupported feature

- **WHEN** a container entry uses a feature that `matchContainer()` rejects by throwing
- **THEN** creating the chart throws an error that contains the condition text

## ADDED Requirements

### Requirement: Responsive overrides for chart()

`chart()` SHALL accept `responsive`, created with `responsive(entries)` from a list of `[condition, overrides]` entries with media or container conditions, where `overrides` is a partial chart config. Charts without it SHALL NOT bundle the condition watcher. Matching overrides SHALL be shallow-merged over the config in order, and the chart SHALL re-render when the set of matching entries changes.

#### Scenario: Composed chart in a narrow container

- **WHEN** a composed chart has `responsive: responsive([[container('(width < 400px)'), { labels: 'svg', padding: 5 }]])` and its container is 300 px wide
- **THEN** it renders with SVG text labels and 5 px padding, and with the base config once the container is 600 px wide
