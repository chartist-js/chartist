## MODIFIED Requirements

### Requirement: Per-node compose events

The `compose` phase SHALL emit one event per semantic scene node it creates (grid line, label, point, line, area, bar, slice, …). Each event SHALL carry the node, its role, and its data context (series index, value index, value, meta, axes, chart area). The events SHALL fire after every layer has composed its nodes and the refining layers have refined them, so a listener receives the refined node. They SHALL keep their order: layer by layer in the order of `layers`, and within a layer children before their parents.

#### Scenario: Point event context

- **WHEN** a line layer composes the third point of the second series
- **THEN** a compose event is emitted with role `point`, series index 1, value index 2, the point's value and meta, and the scene node

#### Scenario: Listeners see refined nodes

- **WHEN** a band with `mark: true` and a line layer are composed, and a `compose` listener reads the classes of each point
- **THEN** every point it receives already has `ct-in-band` or `ct-out-band`, and the listener can still change or drop it
