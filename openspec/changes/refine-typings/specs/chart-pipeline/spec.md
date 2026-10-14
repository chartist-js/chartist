## ADDED Requirements

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
