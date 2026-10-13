# Spec Delta

## ADDED Requirements

### Requirement: Custom layers

A layer SHALL be a plain object with a type name, the coordinate systems it supports, and a compose function. The compose function receives the prepared data, the chart area and its layer index, and returns scene nodes. Layers written outside Chartist SHALL work exactly like built-in layers: their nodes go through the per-node `compose` events and appear in the scene and the output in declaration order.

#### Scenario: A user-defined layer

- **WHEN** a chart is created with a custom layer whose compose function returns one `circle` node with role `point` per value
- **THEN** the output contains those circles, and a `compose` listener receives each of them with its role and data context

#### Scenario: Layer order

- **WHEN** a chart has two custom layers
- **THEN** the nodes of the first layer come before the nodes of the second layer in the scene and the output

#### Scenario: Unsupported coordinate system

- **WHEN** a custom layer that supports only `cartesian` is used in a `polar` chart
- **THEN** creating the chart throws an error naming the layer type and the coordinate system

#### Scenario: Keys for layer nodes

- **WHEN** a custom layer returns nodes without keys for series and values
- **THEN** each data node gets a key derived from the layer index, series index and value index
