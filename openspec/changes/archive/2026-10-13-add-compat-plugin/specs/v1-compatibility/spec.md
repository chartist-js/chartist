# Spec Delta

## MODIFIED Requirements

### Requirement: Live elements in 1.x draw events

With the compat plugin, 1.x `draw` events SHALL be emitted after the chart is rendered, in the 1.x order, followed by `created`. Their `element` and `group` SHALL be 1.x `Svg` wrappers around elements attached to the document, and every 1.x `Svg` method SHALL work. An element a handler appends to `data.group` is placed after the group's other elements.

#### Scenario: 1.x order

- **WHEN** a line chart with the compat plugin renders
- **THEN** `draw` events come per axis (X, then Y) as grid line and label per tick, then the grid background, then per series the points, the line and the areas, followed by `created`

#### Scenario: SMIL animation in a draw handler

- **WHEN** a 1.x draw handler calls `data.element.animate({ d: { begin: 0, dur: 500, from: ..., to: ... } })` on a line
- **THEN** the line animates as in 1.5, and `animationBegin`/`animationEnd` are emitted when the chart's event emitter is passed to `animate`, as in 1.5

#### Scenario: Measuring in a draw handler

- **WHEN** a 1.x draw handler calls `data.element.getNode().getBBox()` on a label
- **THEN** it receives the label's real bounding box

#### Scenario: Same sequence as 1.5

- **WHEN** a line chart with the compat plugin and a 1.5 line chart render the same data and options
- **THEN** both emit the same sequence of `draw` event types and indexes, with the same payload fields, followed by `created`

### Requirement: 1.x plugins run with compat

1.x plugin functions SHALL run unchanged and produce the same output as on 1.5: on the 1.x class API with the compat plugin in `plugins`, receiving the chart instance; on the functional API when converted with `fromLegacyPlugin` from `chartist/compat`, receiving an object with the 1.x chart fields. v2 plugins on the same chart SHALL keep working.

#### Scenario: Chart object of converted plugins

- **WHEN** a plugin converted with `fromLegacyPlugin` runs on `lineChart()`
- **THEN** its `chart` argument has `container`, `data`, `options`, `svg`, `eventEmitter`, `on`, `off`, `update` and `detach`, and turning on the 1.x events needs no separate `compat` entry

#### Scenario: Mixed plugins

- **WHEN** a chart uses the compat plugin, a 1.x plugin that adds elements in `draw`, and a v2 plugin that reserves layout space in `layout`
- **THEN** both plugins take effect in the rendered chart

#### Scenario: Plugin using the container on the class API

- **WHEN** a 1.x plugin given to `new LineChart(el, data, { plugins: [compat, tooltip] })` appends a tooltip element to `chart.container`
- **THEN** the element is appended to the chart's container, and `chart` is the `LineChart` instance

#### Scenario: Converted plugin on the functional API

- **WHEN** `lineChart(el, data, { plugins: [fromLegacyPlugin(tooltip)] })` is called, without listing `compat`
- **THEN** the tooltip plugin receives `draw` events and `chart.container` is `el`

### Requirement: Warning for 1.x plugins without compat

On the 1.x class API, a plugin given as a plain function (the 1.x plugin form) on a chart without the compat plugin SHALL NOT be executed. Chartist SHALL emit a one-time console warning explaining that it looks like a 1.x plugin and how to enable the compat plugin. (The functional API rejects plugin functions with an error; see `chart-pipeline`.)

#### Scenario: 1.x plugin without compat

- **WHEN** a `LineChart` is created with `plugins: [legacyPluginFn]` and no compat plugin
- **THEN** the chart renders without the legacy plugin and a warning explains how to enable it
