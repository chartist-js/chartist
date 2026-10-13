# Spec Delta

## MODIFIED Requirements

### Requirement: Export surface is recorded

For each entry point, the runtime export names SHALL be compared against a checked-in list. The 1.5 root export names SHALL always be part of the `chartist` list. Adding an export SHALL require updating the list, and removing a 1.5 export SHALL fail the suite. The ESM, CJS and UMD builds SHALL expose the same names. The exported type names of each entry point's declaration files, including type-only exports, SHALL be recorded and checked the same way.

#### Scenario: New export without list update

- **WHEN** a change adds an export to `chartist` without updating the recorded list
- **THEN** the suite fails and names the unlisted export

#### Scenario: UMD global

- **WHEN** the UMD build is loaded with a classic `<script>` tag
- **THEN** the global `Chartist` has the same export names as the ESM root entry

#### Scenario: Removed type-only export

- **WHEN** a change removes an exported type such as `LineChartOptions` from the declaration files
- **THEN** the suite fails and names the missing type

#### Scenario: Published 1.5 names stay listed

- **WHEN** the recorded `chartist` list is compared with the exports of the published `chartist@1.5.0` package
- **THEN** every runtime and type export name of 1.5.0 is in the list

### Requirement: Behavior through the public API

The suite SHALL cover the documented behavior of the public API through its entry points only: chart creation, `update`, `detach`/`destroy`, `on`/`off`, plugins, responsive options, `Svg`/`SvgList`/`SvgPath`, `Interpolation`, the axis classes and the exported helpers. Assertions SHALL check observable results such as output, event payloads and return values, not internals. The 1.x part SHALL be written and passing against the unchanged 1.5 code before core implementation starts.

#### Scenario: 1.x contract before core work

- **WHEN** the first core implementation change starts
- **THEN** the 1.x public API tests already pass on `next` against the 1.5 code, and they must keep passing (with the compat plugin where they use 1.x events or plugins)

#### Scenario: v2 API covered as it is built

- **WHEN** a core change adds a public function such as `chart`, `toScene` or a layer factory
- **THEN** the same change adds public API tests, export list entries and type tests for it

## ADDED Requirements

### Requirement: Tests run against the published 1.5.0 package

The 1.x tests, type tests and export checks SHALL also run against the published `chartist@1.5.0` package and pass there, so they describe 1.5 behavior rather than the current implementation.

#### Scenario: Same tests against published 1.5.0

- **WHEN** the suite is run against the published `chartist@1.5.0` package instead of the local build
- **THEN** every 1.x test, type test and export check passes
