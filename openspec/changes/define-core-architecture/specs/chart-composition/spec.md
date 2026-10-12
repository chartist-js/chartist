# Spec Delta

## Purpose

Defines how a single chart combines several layers and axes, so mixed chart types and multi-axis charts are possible, and how the 1.x chart types are expressed on top of that model.

## ADDED Requirements

### Requirement: Charts are composed of layers

A chart SHALL accept one or more layers. Each layer renders its own series (e.g. line, area, bar, scatter, pie) in a shared chart area and coordinate system. Layers SHALL render in declaration order.

#### Scenario: Bar and line combined

- **WHEN** a chart is configured with a bar layer for revenue and a line layer for margin on the same X axis
- **THEN** bars and the line are rendered in one SVG, aligned to the same X positions, with the line drawn above the bars

### Requirement: Multiple axes

A cartesian chart SHALL support several axes per direction, each placed at a side (top, bottom, left, right). Each layer SHALL be bound to one X and one Y axis by id. Each axis SHALL compute its range from the series bound to it.

#### Scenario: Left and right Y axes

- **WHEN** a bar layer is bound to a left Y axis and a line layer to a right Y axis
- **THEN** the left axis range covers only the bar values, the right axis range covers only the line values, and both axes show labels on their sides

### Requirement: Coordinate systems

A chart SHALL use either a cartesian or a polar coordinate system. Layers SHALL declare which systems they support. Combining a layer with an unsupported system SHALL raise a descriptive error.

#### Scenario: Pie in polar coordinates

- **WHEN** a pie layer is used in a polar chart
- **THEN** slices are laid out around the chart center

#### Scenario: Unsupported combination

- **WHEN** a bar layer is configured in a polar chart
- **THEN** creating the chart throws an error naming the layer and the unsupported coordinate system

### Requirement: 1.x chart types as presets

`LineChart`, `BarChart` and `PieChart` SHALL remain available with their 1.x constructor signatures, options, defaults and methods. Their output SHALL match 1.x for the same input.

#### Scenario: Unchanged 1.x usage

- **WHEN** code written for 1.5, e.g. `new BarChart('#chart', data, { stackBars: true }, responsiveOptions)`, runs on v2
- **THEN** the chart renders the same visual output and class structure as 1.5 did

### Requirement: Tree-shakable composition

Layers, axis types, renderers and the compatibility layer SHALL be importable separately. A bundle that uses only some of them SHALL NOT contain the others.

#### Scenario: Line-only bundle

- **WHEN** an application imports only the composable chart, the line layer and the DOM renderer
- **THEN** its bundle contains no bar, pie, string-renderer or compatibility code
