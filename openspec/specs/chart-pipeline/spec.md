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

Phase event payloads SHALL be read-only. A listener SHALL transform a phase by returning a new payload value, and SHALL leave it unchanged by returning `undefined`. Transformable payloads are options in `resolve`, normalized data in `prepare`, axes, scales and chart area in `layout`, individual scene nodes in `compose` and the whole scene in `scene`. Later phases SHALL use the transformed values. Return values of `render` listeners SHALL be ignored. A `mount` listener MAY return a cleanup function (see "Cleanup after mount"); other return values of `mount` listeners SHALL be ignored.

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

The `compose` phase SHALL emit one event per semantic scene node it creates (grid line, label, point, line, area, bar, slice, …). Each event SHALL carry the node, its role, and its data context (series index, value index, value, meta, axes, chart area). The events SHALL fire after every layer has composed its nodes and the refining layers have refined them, so a listener receives the refined node. They SHALL keep their order: layer by layer in the order of `layers`, and within a layer children before their parents.

#### Scenario: Point event context

- **WHEN** a line layer composes the third point of the second series
- **THEN** a compose event is emitted with role `point`, series index 1, value index 2, the point's value and meta, and the scene node

#### Scenario: Listeners see refined nodes

- **WHEN** a band with `mark: true` and a line layer are composed, and a `compose` listener reads the classes of each point
- **THEN** every point it receives already has `ct-in-band` or `ct-out-band`, and the listener can still change or drop it

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

Data updates, option updates, responsive option changes, size changes and loaded web fonts SHALL re-run the pipeline from the earliest affected phase and emit the phase events again. The phases `resolve` to `scene` SHALL compute their whole result on every run, independent of earlier runs; only the renderer and the `render` and `mount` events SHALL see the previous run.

#### Scenario: Container resize

- **WHEN** the chart's container size changes
- **THEN** the pipeline re-runs from `layout`, and `resolve` re-runs too if responsive options depend on size

#### Scenario: Same scene with or without history

- **WHEN** a chart is updated from data A to data B, and another chart of the same size is created with data B
- **THEN** both charts' `scene` phases produce equal scenes

### Requirement: Plugin registration

A v2 plugin SHALL be an object with a `name` and an `install(chart, options)` function, passed in the chart's `plugins` option. `install` runs before the first render and can register listeners for any phase event. The explicit shape lets v2 plugins be told apart from 1.x plugin functions. `install` MAY return a cleanup function, which `destroy()` SHALL call once, after the chart's output is removed, in the reverse order of installation.

#### Scenario: Plugin hooks before first render

- **WHEN** a chart is created with a v2 plugin in its options
- **THEN** the plugin's `install` runs once and its listeners receive the events of the first render

#### Scenario: Plugin with options

- **WHEN** a plugin is passed as `[plugin, { position: 'bottom' }]`
- **THEN** `install` receives the chart and `{ position: 'bottom' }`

#### Scenario: Plugin cleanup

- **WHEN** a plugin's `install` adds a `keydown` listener to the document and returns a function that removes it, and the chart is destroyed
- **THEN** the function runs once and the document has no listener from the plugin

#### Scenario: Detach keeps plugins

- **WHEN** a chart with that plugin is detached
- **THEN** the cleanup function doesn't run, and the chart's output and the plugin's listeners stay

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

### Requirement: Typed events and plugins

Listener registration, removal and emission SHALL be typed by event name: phase events with their payloads and return types, and custom events with the payloads their plugins declare. An event name that is neither a phase nor declared SHALL NOT type-check. A plugin given with its options through `withOptions()` SHALL be checked against the plugin's options type, and the presets SHALL accept only v2 plugin entries.

#### Scenario: A typo in an event name

- **WHEN** code registers `on('compsoe', listener)`
- **THEN** it does not type-check

#### Scenario: A declared custom event

- **WHEN** a plugin declares that it provides `legend:click` with a `{ series: number }` payload and code registers `on('legend:click', event => event.series)`
- **THEN** it type-checks and `event.series` is a number

#### Scenario: Wrong plugin options

- **WHEN** code passes `withOptions(threshold, { limt: 7 })` where the plugin's options are `{ limit: number }`
- **THEN** it does not type-check

### Requirement: Removing listeners leaves plugins alone

`off(name)` without a listener SHALL remove the listeners added through the chart's config and handle for that event, and SHALL NOT remove listeners that plugins added. `off(name, listener)` SHALL remove that listener.

#### Scenario: Removing your listeners

- **WHEN** a chart has a plugin listening to `mount` and code calls `off('mount')`
- **THEN** the plugin's listener still runs on the next render

### Requirement: Changes and cause in render and mount

The `render` and `mount` events SHALL carry:

- `cause`: why the chart rendered: `create` (the first render), `update` (`update()` and the preset handles' option changes), `resize`, `responsive` or `fonts`;
- `previous`: the previous render's scene, absent on the first render;
- `changes`: what the render did to the output, in document order, each entry `add`, `update` (with the `previous` node) or `remove`. When the renderer returned its changes (it patched), they SHALL be those. Otherwise they SHALL describe a replacement: `remove` for every node of the previous scene and `add` for every node of the new one.

In `mount`, each entry's element SHALL be available: for `add` and `update` the element in the page, for `remove` the element just taken out of it.

#### Scenario: First render

- **WHEN** a chart renders for the first time
- **THEN** `render` and `mount` get `cause: 'create'`, no `previous`, and an `add` entry for every node

#### Scenario: An update with the DOM renderer

- **WHEN** a chart drawn with `domRenderer()` updates
- **THEN** `mount` gets `cause: 'update'`, a `remove` entry for every previous node and an `add` entry for every new one

#### Scenario: Resize

- **WHEN** the container is resized
- **THEN** `render` and `mount` get `cause: 'resize'`

### Requirement: Cleanup after mount

A function returned by a `mount` listener SHALL be called once: before the next render changes the output, or on `destroy()` before the output is removed, whichever comes first. Cleanup functions SHALL run in the order their listeners were registered. A listener's cleanup SHALL run before the same listener runs again.

#### Scenario: Removing what a render added

- **WHEN** a `mount` listener appends an `animate` element to every point and returns a function that removes them, and the chart updates with a renderer that keeps its elements
- **THEN** the earlier `animate` elements are gone before the update's `mount` listeners run, so each point has the animations of the latest render only

#### Scenario: Cleanup on destroy

- **WHEN** a `mount` listener adds a listener to the window and returns a function that removes it, and the chart is destroyed
- **THEN** the window listener is removed

#### Scenario: No cleanup returned

- **WHEN** a `mount` listener returns nothing
- **THEN** nothing is called for it on the next render or on destroy

### Requirement: Keyframes from layers and plugins

A layer and a v2 plugin SHALL be able to give the keyframes of an updated node: given the previous node, the new node (and, for a layer, its context) and a list of progress points, they return one set of attributes per point, or nothing. Progress 0 is the previous shape and 1 the new one; points MAY lie below 0 or above 1 when the easing overshoots. The renderer SHALL receive a lookup that asks the plugins first, in the order of `plugins`, then the layer that drew the node; the first answer wins. Nodes that a plugin or listener added, which belong to no layer, SHALL get keyframes only from plugins. Keyframes SHALL be computed only when a renderer asks for them.

#### Scenario: A plugin's own node

- **WHEN** a plugin adds a gauge needle path in a `scene` listener and gives keyframes that turn it around its center, and the chart's value changes with update animations on
- **THEN** the needle is drawn turning to its new angle

#### Scenario: Changing how a layer's nodes animate

- **WHEN** a plugin gives keyframes for nodes with role `slice` that grow each slice from the pie's center
- **THEN** the slices animate with the plugin's keyframes, not the built-in ones

#### Scenario: Plugin without an answer

- **WHEN** a plugin's keyframes return nothing for a point node
- **THEN** the point animates as it would without the plugin

### Requirement: Animation timing for plugins

The `mount` event SHALL carry the render's update animation timing when the renderer animated the render: its duration in milliseconds and its easing as a CSS easing string, as the renderer returned them. It SHALL be absent when the render doesn't animate. Plugins use it to animate what they draw themselves in step with the chart.

#### Scenario: A legend fading in step

- **WHEN** a chart with update animations, `--ct-update-duration: 300ms` and `--ct-update-easing: ease-out` updates, and a plugin animates its HTML legend with the Web Animations API using the `mount` timing
- **THEN** the legend's animation runs 300 ms with `ease-out`, like the chart's

#### Scenario: No timing without animation

- **WHEN** the same chart is resized, or updates while `prefers-reduced-motion: reduce` matches, or draws with `domRenderer()`
- **THEN** `mount` has no animation timing

### Requirement: The render lifecycle

The `render` event SHALL fire once the renderer has applied a scene, whether it created, patched or replaced the output. The `mount` event SHALL follow when the output is in the page; it is where listeners touch elements. Both SHALL fire for every run of the pipeline, with the same changes and cause. A chart without a container (`toScene()`) SHALL fire neither.

#### Scenario: Patched render

- **WHEN** a chart drawn with `liveDomRenderer()` updates
- **THEN** `render` fires after the elements were changed, then `mount`, and both receive the same changes and `cause: 'update'`
