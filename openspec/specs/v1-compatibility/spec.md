# v1-compatibility Specification

## Purpose

Provides an opt-in compat plugin that restores the 1.x event API, the `Svg` wrapper and 1.x plugins on v2. The core carries no compatibility code, and users who need the plugin but haven't added it get clear guidance.

## Requirements

### Requirement: Compat plugin is opt-in and separate

The 1.x compatibility SHALL be provided by a plugin that is imported and registered explicitly. Charts without it SHALL NOT contain or load any compatibility code.

#### Scenario: Default bundle has no compat code

- **WHEN** an application uses `LineChart` without the compat plugin
- **THEN** its bundle contains neither the 1.x `Svg` wrapper nor the legacy event emission, unless the application imports `Svg` itself

#### Scenario: Enabling compat

- **WHEN** the compat plugin is added to a chart's `plugins` option
- **THEN** 1.x events, the `Svg` wrapper and 1.x plugins work on that chart

### Requirement: 1.x exports remain available

Every export of the 1.5 package root SHALL remain exported from `chartist` under the same name, and from the UMD global `Chartist`, with its 1.5 behavior. This includes `Svg`, `SvgList`, `SvgPath`, `easings`, `Interpolation`, the axis classes, `EventEmitter` and the helper functions. These exports SHALL work without the compat plugin. Bundles that don't import them SHALL NOT contain them. Throughout 2.x, this holds for the deprecated names too.

#### Scenario: Standalone Svg usage

- **WHEN** code imports `Svg` from `chartist` and builds its own SVG with `new Svg('svg').elem('circle', { r: 5 }).animate(...)`, without any chart or compat plugin
- **THEN** it works as in 1.5

#### Scenario: Export surface check

- **WHEN** the package is built
- **THEN** a test confirms that every 1.5 root export name exists in the ESM, CJS and UMD builds

#### Scenario: Shared Svg in draw handlers

- **WHEN** a 1.x draw handler with the compat plugin calls `data.element.replace(new Svg('circle', {...}))` using `Svg` imported from `chartist`
- **THEN** the replacement works and `data.element instanceof Svg` is true

### Requirement: Warning for 1.x events without compat

When a listener for a 1.x event name (`data`, `optionsChanged`, `draw`, `created`, `animationBegin`, `animationEnd`) is registered on a chart without the compat plugin, Chartist SHALL emit a console warning. The warning names the event and explains how to add the compat plugin. It SHALL be emitted once per event name and page.

#### Scenario: Draw listener without compat

- **WHEN** `chart.on('draw', handler)` is called on a chart without the compat plugin
- **THEN** a warning names the `draw` event, points to the compat plugin and the migration guide, and the handler is not called

### Requirement: Warning for 1.x plugins without compat

On the 1.x class API, a plugin given as a plain function (the 1.x plugin form) on a chart without the compat plugin SHALL NOT be executed. Chartist SHALL emit a one-time console warning explaining that it looks like a 1.x plugin and how to enable the compat plugin. (The functional API rejects plugin functions with an error; see `chart-pipeline`.)

#### Scenario: 1.x plugin without compat

- **WHEN** a `LineChart` is created with `plugins: [legacyPluginFn]` and no compat plugin
- **THEN** the chart renders without the legacy plugin and a warning explains how to enable it

### Requirement: 1.x events with compat

With the compat plugin, charts SHALL emit the 1.x events with the payloads, timing and order of 1.5.

#### Scenario: Draw event payload

- **WHEN** a `draw` listener is registered on a `LineChart` with the compat plugin
- **THEN** it receives one event per grid line, grid background, label, line, area and point, with the same `type` values and payload fields as in 1.5

### Requirement: 1.x mutation semantics with compat

With the compat plugin, 1.x `data` and `optionsChanged` handlers SHALL receive mutable payloads, as in 1.5. Their changes SHALL take effect as the transformed value of the corresponding v2 phase, without mutating the read-only v2 payload.

#### Scenario: Mutating data in a 1.x data handler

- **WHEN** a 1.x `data` handler pushes a value onto `data.data.series[0]`
- **THEN** the rendered chart includes the value, and the `prepare` payload received by v2 listeners registered before compat is unchanged

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

### Requirement: Legacy changes are preserved in output

Changes made by 1.x handlers to live elements SHALL appear in the final output and SHALL NOT be overwritten by v2 rendering.

#### Scenario: Element replaced by a 1.x handler

- **WHEN** a 1.x draw handler calls `data.element.replace(new Svg('circle', {...}))` on a point
- **THEN** the rendered chart shows the circle in place of the point

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

### Requirement: Compat constrains the renderer

While the compat plugin is active, the chart SHALL render with the DOM SVG renderer. Configuring another renderer at the same time SHALL raise a descriptive error.

#### Scenario: String renderer with compat

- **WHEN** a chart with the compat plugin is configured to render to a string
- **THEN** an error explains that the compat plugin requires the DOM renderer

### Requirement: Compatibility contract suites

The 1.x unit test suite SHALL pass against the v2 presets with the compat plugin. The visual regression baseline recorded from 1.5 SHALL pass against the v2 presets: with the compat plugin for examples that use 1.x events, without it for all others. Any intended difference SHALL be listed as a breaking change.

#### Scenario: Contract suites in CI

- **WHEN** a change to the core is proposed
- **THEN** CI runs the 1.x unit tests and the visual baseline comparison, and fails on any unlisted difference

### Requirement: 1.x behaviors v2 corrects

v2 SHALL correct these 1.x behaviors in both APIs, and the migration guide SHALL list them: an axis's own `low` and `high` win over a bar chart's reference value; a fixed scale axis with `divisor` has a tick at `high`; rounding to 0 digits rounds to integers; donut widths come from CSS unless `donutWidth` is set; `accumulate-relative` stacks negative values below zero with an axis that fits them.

#### Scenario: A bar chart's axis low

- **WHEN** a bar chart is created with `axisY: { low: 10 }` and values from 12 to 18
- **THEN** its value axis starts at 10

### Requirement: Animation events with compat

With the compat plugin, animations started on an element of a 1.x `draw` event SHALL emit `animationBegin` and `animationEnd` on the chart.

#### Scenario: Listening to an animation

- **WHEN** a `draw` listener calls `data.element.animate(…)` on a chart with compat
- **THEN** the chart's `animationBegin` and `animationEnd` listeners run

### Requirement: 0.x global surface for plugin scripts

Importing `chartist/compat` in a browser, from any of its builds (ES module, CommonJS, or the UMD build as a script), SHALL set up the global `Chartist` for plugin scripts: the library, compat, a `plugins` object to register on, `Line`, `Bar` and `Pie` as the 1.x `LineChart`, `BarChart` and `PieChart` classes, and the 0.x helper `getDataArray(data, reverse)`. It SHALL only add names the global lacks. Outside a browser it SHALL do nothing.

#### Scenario: A 0.x plugin script after a module import

- **WHEN** a page imports `chartist/compat` as a module, then a deferred plugin script sets `Chartist.plugins.ctPointLabels`
- **THEN** the script runs without errors, and a chart of that module's `lineChart` with the converted plugin draws its labels

#### Scenario: With the UMD build

- **WHEN** a page loads `index.umd.js`, then `compat.umd.js`, then a plugin script
- **THEN** the plugin registers on the same global `Chartist` and runs

#### Scenario: Registered plugins stay

- **WHEN** `Chartist.plugins` already has entries when compat is imported
- **THEN** they are kept

### Requirement: The global names stay off the exports

The names compat adds to the global SHALL NOT be exports of `chartist` or `chartist/compat`. The package SHALL declare the compat files, and only those besides stylesheets, as having side effects, so bundlers keep an import of `chartist/compat` and can still drop unused parts of the core.

#### Scenario: Not in the module exports

- **WHEN** code imports `chartist` or `chartist/compat` as modules
- **THEN** neither has `Line`, `Bar`, `Pie`, `plugins` or `getDataArray` exports

#### Scenario: Side effects declared

- **WHEN** a bundler reads the package's `sideEffects`
- **THEN** it lists the stylesheets and the compat files, and nothing else

### Requirement: One copy of Chartist on the global

When the global `Chartist` belongs to another copy of Chartist than the imported `chartist/compat` (for example the UMD build next to the modules), compat SHALL leave the global unchanged and SHALL warn in the console, since mixing copies breaks the plugins' type checks.

#### Scenario: UMD core and compat modules

- **WHEN** a page loads `index.umd.js` and then imports `chartist/compat` as a module
- **THEN** the global keeps only the UMD build's names, and the console shows a warning about another copy of Chartist

### Requirement: Converted plugins see their chart type

The chart object that a plugin converted with `fromLegacyPlugin` receives SHALL be an instance of the 1.x class for its chart type (`LineChart`, `BarChart` or `PieChart`), so a 0.x-style check such as `chart instanceof Chartist.Line` holds for a line chart when the 0.x names are loaded. For a `chart()` composition, which has no 1.x class, it SHALL be a plain object.

#### Scenario: Type check passes

- **WHEN** a plugin converted with `fromLegacyPlugin` checks `chart instanceof Chartist.Line` on `lineChart()`
- **THEN** the check is true, and false for `Chartist.Bar`

### Requirement: Converted plugins get the 1.x chart fields

The chart object of a converted plugin SHALL have `data` and `options` when the plugin installs, `options` resolved with the chart type's 1.x defaults (such as `classNames`), and `optionsProvider.getCurrentOptions()` returning the options in effect. On the functional API and on the 1.x classes, `chart.svg` SHALL be the chart's root element with the 1.x `Svg` API (such as `querySelectorAll`), set before the first `draw` event.

#### Scenario: Fields at install time

- **WHEN** a converted plugin reads `chart.data.series` and `chart.options.classNames.series` in its install function
- **THEN** both have the chart's values

#### Scenario: Svg helpers in draw

- **WHEN** a plugin calls `chart.svg.querySelectorAll('.ct-series')` in a `draw` or `created` listener, on either API
- **THEN** it gets the series groups of the chart

### Requirement: 0.x fields in the created payload

With compat, the payload of the `created` event SHALL also carry `bounds`, the value axis bounds (`min`, `max`, `range`, `step`, `values` as 0.x had them), next to the 1.x fields `chartRect`, `axisX`, `axisY`, `svg` and `options`.

#### Scenario: Target line from bounds

- **WHEN** a plugin draws a line at `chartRect.y1 - chartRect.height() / bounds.max * value` in a `created` listener
- **THEN** the line is drawn at that value of the Y axis

### Requirement: Community plugin contract test

A browser test SHALL run every plugin listed on the docs site's plugins page on v2, both converted with `fromLegacyPlugin` on the functional API and on the 1.x classes with compat, and SHALL check that each draws what it adds (labels, titles, legends, tooltips on hover) without errors. A plugin that can't run on v2 for a reason in its own code SHALL be listed with that reason, and SHALL NOT appear on the plugins page.

#### Scenario: All listed plugins run

- **WHEN** the contract test runs
- **THEN** every listed plugin draws its additions on both APIs without errors

### Requirement: Deprecated 1.x names

The declarations of `chartist` SHALL mark each 1.x-only export as deprecated, with a message naming the functional replacement and saying it's removed in 3.0. 1.x-only means the functional API neither uses the name in its signatures nor documents it for plugins, custom layers or data. The deprecation SHALL NOT change runtime behavior or log anything.

#### Scenario: Editor hint

- **WHEN** code imports `LineChart` and `LineChartOptions` from `chartist`
- **THEN** the TypeScript language service reports both as deprecated, the hover of `LineChart` names `lineChart()`, and the hover of `LineChartOptions` names `LineChartPresetOptions`

#### Scenario: Shared names stay unmarked

- **WHEN** functional code imports `lineChart`, `LineChartData`, `Interpolation`, `Svg`, `easings` or `getMultiValue` from `chartist`
- **THEN** the language service reports no deprecation

#### Scenario: Functional types built from 1.x types

- **WHEN** functional code uses `LineChartPresetOptions`, which is built from the 1.x `LineChartOptions`
- **THEN** the language service reports no deprecation for it or its properties

#### Scenario: Runtime unchanged

- **WHEN** 1.x code using the deprecated names runs
- **THEN** it behaves as before and logs nothing about the deprecation

### Requirement: Deprecated names stay through 2.x

The names deprecated on `chartist` SHALL stay exported from `chartist` and the UMD global throughout 2.x. 3.0 SHALL remove them from `chartist`.

#### Scenario: A 2.x minor release

- **WHEN** a 2.x release is prepared
- **THEN** the export surface test still finds every deprecated name in the ESM, CJS and UMD builds

### Requirement: 1.x event and plugin types from compat

`chartist/compat` SHALL export the types of the 1.x events and plugins it turns on (the draw, created, data and options-changed event payloads and `Plugin`), not marked deprecated, so code using the 1.x events on the functional API imports them from where it turns them on.

#### Scenario: Typing a 1.x draw listener

- **WHEN** functional code with the compat plugin imports `PointDrawEvent` from `chartist/compat` and types a `draw` listener with it
- **THEN** it compiles without a deprecation hint
