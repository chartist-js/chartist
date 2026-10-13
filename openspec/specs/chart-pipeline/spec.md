# chart-pipeline Specification

## Purpose

Defines the staged lifecycle every Chartist chart runs through, and how plugins and user code observe and transform each stage before anything is rendered.

## Requirements

### Requirement: Ordered pipeline phases

Every chart render SHALL run the phases `resolve`, `prepare`, `layout`, `compose`, `scene`, `render` and `mount` in this order. Only `render` and `mount` SHALL produce or touch output (DOM, string or other renderer targets).

#### Scenario: Phase order on initial render

- **WHEN** a chart is created and rendered
- **THEN** listeners observe the phase events in the order `resolve`, `prepare`, `layout`, `compose`, `scene`, `render`, `mount`

#### Scenario: No output before render

- **WHEN** listeners of `resolve`, `prepare`, `layout`, `compose` or `scene` run
- **THEN** the chart has not created or modified any element in the output target

### Requirement: Phase events transform by returning values

Phase event payloads SHALL be read-only. A listener SHALL transform a phase by returning a new payload value, and SHALL leave it unchanged by returning `undefined`. Transformable payloads are options in `resolve`, normalized data in `prepare`, axes, scales and chart area in `layout`, individual scene nodes in `compose` and the whole scene in `scene`. Later phases SHALL use the transformed values. Return values of `render` and `mount` listeners SHALL be ignored.

#### Scenario: Data transformation

- **WHEN** a `prepare` listener returns the normalized data with an appended derived series
- **THEN** the derived series is laid out and rendered like any other series

#### Scenario: Observing without changes

- **WHEN** a `prepare` listener reads the data and returns nothing
- **THEN** the next phase receives the identical payload object, not a copy

#### Scenario: Payload is not mutated

- **WHEN** a listener returns a transformed payload
- **THEN** the payload object it received is unchanged

#### Scenario: Reserving layout space

- **WHEN** a `layout` listener returns a layout that reserves 40 px at the bottom of the chart for a legend
- **THEN** the chart area, axes and series are laid out within the reduced area and the reserved space stays empty for the listener to fill

### Requirement: Per-node compose events

The `compose` phase SHALL emit one event per semantic scene node it creates (grid line, label, point, line, area, bar, slice, …). Each event SHALL carry the node, its role, and its data context (series index, value index, value, meta, axes, chart area).

#### Scenario: Point event context

- **WHEN** a line layer composes the third point of the second series
- **THEN** a compose event is emitted with role `point`, series index 1, value index 2, the point's value and meta, and the scene node

### Requirement: Synchronous, deterministic listeners

Phase listeners SHALL run synchronously in registration order. Given the same data, options, size and listeners, the pipeline SHALL produce the same scene.

#### Scenario: Registration order

- **WHEN** two listeners are registered for the same phase
- **THEN** the first registered listener runs first and the second receives the value the first returned

### Requirement: Pure scene construction

The phases `resolve` through `scene` SHALL be side-effect free: given a config, a size and a text measurement function, `toScene` SHALL return the scene without touching the DOM, timers or globals. Charts with a host and renderer SHALL produce the same scene for the same inputs.

#### Scenario: Scene without a host

- **WHEN** `toScene(config, { width: 400, height: 300 })` is called in Node.js
- **THEN** it returns the scene synchronously, and calling it again with the same inputs returns an equal scene

### Requirement: Re-running the pipeline

Data updates, option updates, responsive option changes and size changes SHALL re-run the pipeline from the earliest affected phase and emit the phase events again.

#### Scenario: Container resize

- **WHEN** the chart's container size changes
- **THEN** the pipeline re-runs from `layout`, and `resolve` re-runs too if responsive options depend on size

### Requirement: Plugin registration

A v2 plugin SHALL be an object with a `name` and an `install(chart, options)` function, passed in the chart's `plugins` option. `install` runs before the first render and can register listeners for any phase event. The explicit shape lets v2 plugins be told apart from 1.x plugin functions.

#### Scenario: Plugin hooks before first render

- **WHEN** a chart is created with a v2 plugin in its options
- **THEN** the plugin's `install` runs once and its listeners receive the events of the first render

#### Scenario: Plugin with options

- **WHEN** a plugin is passed as `[plugin, { position: 'bottom' }]`
- **THEN** `install` receives the chart and `{ position: 'bottom' }`

### Requirement: Custom events from plugins

A v2 plugin SHALL be able to declare event names it provides and emit them through the chart handle. Listeners for those names receive the emitted payloads. Phase names SHALL NOT be emitted this way. A listener registered for a 1.x event name (`data`, `optionsChanged`, `draw`, `created`, `animationBegin`, `animationEnd`) on a chart where no plugin provides that name SHALL log a one-time warning that names the event and the compat plugin.

#### Scenario: Plugin event

- **WHEN** a plugin that provides `legend:click` emits it with a payload
- **THEN** listeners registered with `on('legend:click', ...)` receive that payload

#### Scenario: Emitting a phase name

- **WHEN** a plugin emits `scene` through the handle
- **THEN** an error explains that phase events can't be emitted by plugins

### Requirement: The functional API accepts only v2 plugins

`chart()` and the preset functions SHALL accept only v2 plugin objects (or `[plugin, options]` pairs) in `plugins`. A function in `plugins` SHALL throw an error that explains that 1.x plugins must be converted with `fromLegacyPlugin` from `chartist/compat`.

#### Scenario: 1.x plugin function given to lineChart

- **WHEN** `lineChart('#chart', data, { plugins: [legacyPluginFn] })` is called
- **THEN** it throws an error that names `fromLegacyPlugin` and `chartist/compat`, and nothing is rendered

### Requirement: Chart area minimum

For charts without axes, the layout SHALL use the 1.x minimums: the chart is at least as wide and high as its padding, and the chart area is at least 1 px wide and high.

#### Scenario: Padding larger than the chart

- **WHEN** a chart without axes is 20 × 20 px with a padding of 15 px on each side
- **THEN** the chart area starts at the left and top padding and is 1 × 1 px, as 1.5's `createChartRect` computes it
