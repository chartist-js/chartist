## ADDED Requirements

### Requirement: Band role

The band layer SHALL give its nodes the built-in role `band` (a band's filled path), with a defined context type: the edges it was drawn from and its path. Checking a node's role against it SHALL narrow its context and attributes like the other built-in roles, and `compose` listeners SHALL receive these nodes and be able to change or drop them.

#### Scenario: Dropping a band

- **WHEN** a `compose` listener returns `null` for nodes with role `band`
- **THEN** the output has no band paths, and the rest of the chart is unchanged

## REMOVED Requirements

### Requirement: Target line and band roles

**Reason**: The `targetLine` and `targetLabel` roles move with their layer to `@chartist-js/essentials` (`reference-lines`); the `band` role stays, as "Band role".
**Migration**: Import from `@chartist-js/essentials` to get the `targetLine`, `targetLabel` and `trendLine` roles and their context types.
