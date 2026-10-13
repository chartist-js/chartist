# Spec Delta

## Purpose

Defines how a single chart combines several layers and axes, so mixed chart types and multi-axis charts are possible, and how the 1.x chart types are expressed on top of that model.

## ADDED Requirements

### Requirement: Functional chart API

`chart(target, config)` SHALL create a chart from data, axes, layers, plugins and listeners, render it synchronously and return a handle with `update`, `destroy`, `on` and `off`. Layers, axes, renderers and plugins SHALL be created by factory functions. Listeners and plugins passed in `config` SHALL receive the events of the first render.

#### Scenario: Synchronous first render

- **WHEN** `chart('#el', { data, layers: [line()], on: { mount: fn } })` returns
- **THEN** the chart is rendered in `#el` and `fn` has been called once

#### Scenario: Updating and destroying

- **WHEN** `update({ data })` and then `destroy()` are called on the handle
- **THEN** the chart re-renders with the new data, and after `destroy` its output, resize observation and listeners are removed

### Requirement: Charts are composed of layers

A chart SHALL accept one or more layers. Each layer renders its own series (e.g. line, area, bar, scatter, pie) in a shared chart area and coordinate system. Layers SHALL render in declaration order.

#### Scenario: Bar and line combined

- **WHEN** a chart is configured with a bar layer for revenue and a line layer for margin on the same X axis
- **THEN** bars and the line are rendered in one SVG, aligned to the same X positions, with the line drawn above the bars

### Requirement: Multiple axes

A cartesian chart SHALL support several axes per direction, each placed at a side (top, bottom, left, right). Each layer SHALL be bound to one X and one Y axis by id. Each axis SHALL compute its range from the series bound to it.

#### Scenario: Left and r### Requirement: 1.x chart types as presets

`lineChart`, `barChart` and `pieChart` SHALL be preset functions over `chart` that take the 1.x arguments (target, data, options, responsive options) with the 1.x defaults. Their output SHALL match 1.x for the same input.

#### Scenario: Preset function

- **WHEN** `barChart('#chart', data, { stackBars: true })` is called
- **THEN** it returns a chart handle, and the output matches `new Chartist.BarChart('#chart', data, { stackBars: true })` in 1.5

### Requirement: 1.x classes as wrappers

`LineChart`, `BarChart` and `PieChart` SHALL remain available with their 1.x constructor signatures, defaults and methods (`update`, `detach`, `on`, `off`). They SHALL delegate to the preset functions and contain no chart logic. They SHALL keep the 1.x deferred first render, so listeners registered right after construction receive the first render's events.

#### Scenario: Unchanged 1.x usage

- **WHEN** code written for 1.5, e.g. `new BarChart('#chart', data, { stackBars: true }, responsiveOptions)`, runs on v2
- **THEN** the chart renders the same visual output and class structure as 1.5 did

#### Scenario: Listener after construction

- **WHEN** `new LineChart('#chart', data).on('mount', fn)` runs
- **THEN** `fn` is called for the first render

ive error.

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

- **WHEN** an application imports only `chart`, the line layer and the DOM renderer
- **THEN** its bundle contains no bar, pie, string-renderer, class-wrapper or compatibility code
