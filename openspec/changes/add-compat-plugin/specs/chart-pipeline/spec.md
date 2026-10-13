# Spec Delta

## ADDED Requirements

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
