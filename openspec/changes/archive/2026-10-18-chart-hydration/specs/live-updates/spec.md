## ADDED Requirements

### Requirement: The live renderer adopts server markup

`liveDomRenderer()` SHALL be able to take server markup over (see the hydration capability), by default. `liveDomRenderer({ adopt: false })` SHALL NOT adopt: a chart with it draws a new svg over hydration markup and removes the server's svg, and patches its own svg on later renders as usual. A chart that took markup over SHALL be patched on later renders like one whose svg the renderer drew.

#### Scenario: Adopting by default

- **WHEN** `lineChart(container, data, { renderer: liveDomRenderer() })` is called on a container with hydration markup
- **THEN** the chart keeps the server's svg, and a later `update()` patches it

#### Scenario: Opting out

- **WHEN** `lineChart(container, data, { renderer: liveDomRenderer({ adopt: false }) })` is called on a container with hydration markup
- **THEN** the container holds one new svg, and a later `update()` patches that svg
