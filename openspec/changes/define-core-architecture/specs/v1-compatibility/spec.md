# Spec Delta

## Purpose

Provides an opt-in compat plugin that restores the 1.x event API, the `Svg` wrapper and 1.x plugins on v2. The core carries no compatibility code, and users who need the plugin but haven't added it get clear guidance.

## ADDED Requirements

### Requirement: Compat plugin is opt-in and separate

The 1.x compatibility SHALL be provided by a plugin that is imported and registered explicitly. Charts without it SHALL NOT contain or load any compatibility code.

#### Scenario: Default bundle has no compat code

- **WHEN** an application uses `LineChart` without the compat plugin
- **THEN** its bundle contains neither the 1.x `Svg` wrapper nor the legacy event emission

#### Scenario: Enabling compat

- **WHEN** the compat plugin is added to a chart's `plugins` option
- **THEN** 1.x events, the `Svg` wrapper and 1.x plugins work on that chart

### Requirement: Warning for 1.x events without compat

When a listener for a 1.x event name (`data`, `optionsChanged`, `draw`, `created`, `animationBegin`, `animationEnd`) is registered on a chart without the compat plugin, Chartist SHALL emit a console warning. The warning names the event and explains how to add the compat plugin. It SHALL be emitted once per event name and page.

#### Scenario: Draw listener without compat

- **WHEN** `chart.on('draw', handler)` is called on a chart without the compat plugin
- **THEN** a warning names the `draw` event, points to the compat plugin and the migration guide, and the handler is not called

### Requirement: Warning for 1.x plugins without compat

A plugin given as a plain function (the 1.x plugin form) on a chart without the compat plugin SHALL NOT be executed. Chartist SHALL emit a console warning explaining that it looks like a 1.x plugin and how to enable the compat plugin.

#### Scenario: 1.x plugin without compat

- **WHEN** a chart is created with `plugins: [legacyPluginFn]` and no compat plugin
- **THEN** the chart renders without the legacy plugin and a warning explains how to enable it

### Requirement: 1.x events with compat

With the compat plugin, charts SHALL emit the 1.x events with the payloads, timing and order of 1.5.

#### Scenario: Draw event payload

- **WHEN** a `draw` listener is registered on a `LineChart` with the compat plugin
- **THEN** it receives one event per grid line, grid background, label, line, area and point, with the same `type` values and payload fields as in 1.5

### Requirement: Live elements in 1.x draw events

With the compat plugin, the `element` and `group` of a 1.x `draw` event SHALL be 1.x `Svg` wrappers around elements already attached to the document. Every 1.x `Svg` method SHALL work, including `getNode()`, `width()`, `height()`, `querySelector()` and `animate()`.

#### Scenario: SMIL animation in a draw handler

- **WHEN** a 1.x draw handler calls `data.element.animate({ d: { begin: 0, dur: 500, from: ..., to: ... } })` on a line
- **THEN** the line animates as in 1.5, and `animationBegin`/`animationEnd` are emitted

#### Scenario: Measuring in a draw handler

- **WHEN** a 1.x draw handler calls `data.element.getNode().getBBox()` on a label
- **THEN** it receives the label's real bounding box

### Requirement: Legacy changes are preserved in output

Changes made by 1.x handlers to live elements SHALL appear in the final output and SHALL NOT be overwritten by v2 rendering.

#### Scenario: Element replaced by a 1.x handler

- **WHEN** a 1.x draw handler calls `data.element.replace(new Svg('circle', {...}))` on a point
- **THEN** the rendered chart shows the circle in place of the point

### Requirement: 1.x plugins run with compat

With the compat plugin, plugin functions written for 1.x SHALL run unchanged and produce the same output as on 1.5. v2 plugins on the same chart SHALL keep working.

#### Scenario: Mixed plugins

- **WHEN** a chart uses the compat plugin, a 1.x plugin that adds elements in `draw`, and a v2 plugin that reserves layout space in `layout`
- **THEN** both plugins take effect in the rendered chart

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
