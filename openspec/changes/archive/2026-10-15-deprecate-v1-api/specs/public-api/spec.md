## ADDED Requirements

### Requirement: Deprecations are recorded

The names marked deprecated in each entry's declaration files SHALL be compared against a checked-in list, the same way as the export surface. Marking or unmarking a name SHALL require updating the list.

#### Scenario: Deprecation without list update

- **WHEN** a change marks a new root export as deprecated without updating the recorded list
- **THEN** the suite fails and names the export

#### Scenario: Deprecation lost in the build

- **WHEN** the declaration build drops the deprecation tag of `LineChart` in `index.d.ts` or `index.d.cts`
- **THEN** the suite fails and names `LineChart` and the file

#### Scenario: Compat types unmarked

- **WHEN** a 1.x event or plugin type is marked deprecated in `compat.d.ts` or `compat.d.cts`
- **THEN** the suite fails and names it
