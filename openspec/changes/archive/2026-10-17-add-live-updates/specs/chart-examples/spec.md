## ADDED Requirements

### Requirement: Live data examples

The examples package SHALL have a `live` chart type for examples whose charts update while they run. A live example SHALL draw with `liveDomRenderer()` from `chartist/live`, take its data from a seeded pseudo-random generator, update with timers, and settle at a fixed time for the visual tests, so its screenshot is the same on every run.

#### Scenario: Screenshot of a stream

- **WHEN** the visual tests render the network speed example twice
- **THEN** both screenshots, taken at its settle time after the same timers fired, are identical
