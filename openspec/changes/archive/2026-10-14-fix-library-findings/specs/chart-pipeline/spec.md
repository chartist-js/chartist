## ADDED Requirements

### Requirement: Removing listeners leaves plugins alone

`off(name)` without a listener SHALL remove the listeners added through the chart's config and handle for that event, and SHALL NOT remove listeners that plugins added. `off(name, listener)` SHALL remove that listener.

#### Scenario: Removing your listeners

- **WHEN** a chart has a plugin listening to `mount` and code calls `off('mount')`
- **THEN** the plugin's listener still runs on the next render
