# Spec Delta

## MODIFIED Requirements

### Requirement: Live elements in 1.x draw events

With the compat plugin, 1.x `draw` events SHALL be emitted after the chart is rendered, in the 1.x order (per axis: grid line and label per tick, X axis before Y axis, then the grid background; then per series: points, line, areas), followed by `created`. The `element` and `group` of a `draw` event SHALL be 1.x `Svg` wrappers around elements attached to the document. Every 1.x `Svg` method SHALL work, including `getNode()`, `width()`, `height()`, `querySelector()` and `animate()`. Because all elements exist when the handlers run, an element a handler appends to `data.group` is placed after the group's other elements.

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

1.x plugin functions SHALL run unchanged and produce the same output as on 1.5:

- on the 1.x class API (e.g. `new LineChart(...)`), when the compat plugin is in `plugins`; they receive the chart instance;
- on the functional API, when converted with `fromLegacyPlugin(plugin, options)` from `chartist/compat`; the converted plugin turns on the 1.x events for its chart, and the function receives an object with the 1.x chart fields (`container`, `data`, `options`, `svg`, `eventEmitter`, `on`, `off`, `update`, `detach`).

v2 plugins on the same chart SHALL keep working.

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
