## ADDED Requirements

### Requirement: Target line and band roles

The target line and band layers SHALL give their nodes the built-in roles `targetLine` (a line), `targetLabel` (a line's label) and `band` (a band's filled path). Each role SHALL have a defined context type: a target line and its label know the axis, the value, the label text and their position in px; a band knows the edges it was drawn from and its path. Checking a node's role against one of them SHALL narrow its context and attributes like the other built-in roles, and `compose` listeners SHALL receive these nodes and be able to change or drop them.

#### Scenario: Finding a target line

- **WHEN** a `scene` listener queries the scene for nodes with role `targetLine`
- **THEN** it gets one node per target line, and each node's context has the line's value and its axis

#### Scenario: Dropping a band

- **WHEN** a `compose` listener returns `null` for nodes with role `band`
- **THEN** the output has no band paths, and the rest of the chart is unchanged
