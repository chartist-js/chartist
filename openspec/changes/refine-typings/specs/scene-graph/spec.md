## MODIFIED Requirements

### Requirement: Semantic roles and data context

Every node created by a chart layer or axis SHALL carry its role (e.g. `point`, `line`, `area`, `bar`, `slice`, `grid`, `label`, `series`) and its data context. Neither SHALL appear in the output unless explicitly rendered as attributes. Each built-in role SHALL have a defined context type, and series-level nodes of every chart type, pies included, SHALL carry their series index (and values their value index).

#### Scenario: Querying nodes by role

- **WHEN** a `scene` listener queries the scene for nodes with role `bar` in series 0
- **THEN** it receives exactly the bar nodes of the first series

#### Scenario: Querying pie slices by series

- **WHEN** a `scene` listener queries a pie chart's scene for nodes in series 2
- **THEN** it receives the third slice and its label

## ADDED Requirements

### Requirement: Role-discriminated node types

The scene node type SHALL be discriminated by role: checking a node's role against a built-in role SHALL narrow its context and attributes to that role's types, and querying by a built-in role SHALL return nodes of that role's type. Builder methods SHALL preserve the node's type. Plugins SHALL be able to declare additional roles with their context types.

#### Scenario: Narrowing a point

- **WHEN** a compose listener checks `node.role === 'point'`
- **THEN** `node.ctx.x`, `node.ctx.y` and `node.ctx.valueIndex` type-check as numbers without a cast

#### Scenario: A wrong field

- **WHEN** code reads `ctx.path` on a node narrowed to role `point`
- **THEN** it does not type-check
