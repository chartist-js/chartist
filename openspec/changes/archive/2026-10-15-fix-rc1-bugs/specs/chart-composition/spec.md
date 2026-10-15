## MODIFIED Requirements

### Requirement: 1.x classes as wrappers

`LineChart`, `BarChart` and `PieChart` SHALL remain available with their 1.x constructor signatures, defaults and methods (`update`, `detach`, `on`, `off`). They SHALL delegate to the preset functions and contain no chart logic. They SHALL keep the 1.x deferred first render, so listeners registered right after construction receive the first render's events. A constructor that throws SHALL leave nothing scheduled.

#### Scenario: Unchanged 1.x usage

- **WHEN** code written for 1.5, e.g. `new BarChart('#chart', data, { stackBars: true }, responsiveOptions)`, runs on v2
- **THEN** the chart renders the same visual output and class structure as 1.5 did

#### Scenario: Listener after construction

- **WHEN** `new LineChart('#chart', data).on('mount', fn)` runs
- **THEN** `fn` is called for the first render

#### Scenario: Missing target leaves nothing behind

- **WHEN** `new LineChart('#missing', data)` throws because no element matches
- **THEN** no first render is scheduled

### Requirement: Detaching a chart

The chart handle SHALL provide `detach()`, which stops reacting to container size changes and media queries but keeps the rendered output and the listeners. `destroy()` SHALL additionally remove the output and the listeners. A `detach()` during the first render SHALL take effect like one after it, for `chart()`, the presets and the 1.x classes.

#### Scenario: Detached chart stays visible

- **WHEN** `detach()` is called and the container is resized afterwards
- **THEN** the chart output stays in the container and is not rendered again

#### Scenario: Detach during the first render

- **WHEN** a listener of the first render calls `detach()` (a `mount` listener on `chart()`, a converted 1.x plugin's `created` listener on a preset, a `created` listener on a 1.x class), and the window and the container are resized afterwards
- **THEN** nothing throws, and the chart isn't rendered again

### Requirement: Preset handles change options

The handles of `lineChart`, `barChart` and `pieChart` SHALL change the chart's options after creation, extending the current options or, when asked, the defaults, and SHALL keep data given to `update()` across responsive changes. The presets SHALL take phase listeners in their options, registered before the first render. Merging an object option over a numeric one, or a numeric one over an object, SHALL replace it.

#### Scenario: Showing the area later

- **WHEN** a line chart created without areas gets `setOptions({ showArea: true })`
- **THEN** it redraws with areas

#### Scenario: Data across a breakpoint

- **WHEN** a preset chart gets new data through `update()` and a responsive breakpoint changes afterwards
- **THEN** the redraw shows the new data

#### Scenario: Object padding on a pie

- **WHEN** a pie chart is created with `chartPadding: { top: 20 }`, with the class and the function
- **THEN** it renders with 20 px at the top and the pie's default 5 px on the other sides

#### Scenario: Object padding at a breakpoint

- **WHEN** a line chart with `chartPadding: 10` has a responsive override `{ chartPadding: { top: 3 } }` that matches
- **THEN** it renders with the override, without an error
