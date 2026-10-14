# public-api Specification

## Purpose

Defines a public API test suite that exercises Chartist only through its published entry points, so every API change (1.x surface, v2 functional API, compat) is caught by tests that run against the built package.

## Requirements

### Requirement: Tests use only published entry points

Public API tests SHALL import Chartist only through its package name and subpath exports (`chartist`, `chartist/compat`, …), resolved to the built package. They SHALL NOT import from `src`. The suite SHALL run in the local gate as its own Nx target, after the build.

#### Scenario: Source import rejected

- **WHEN** a public API test imports a module from `packages/chartist/src`
- **THEN** the suite fails with a message that public API tests must use the package entry points

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

### Requirement: Type surface is tested

Public types and signatures (chart functions and classes, option and data types, event payloads, scene node builder, `Svg`) SHALL be covered by type tests compiled against the built declaration files. A breaking type change SHALL fail the type tests.

#### Scenario: 1.x constructor types

- **WHEN** the type tests compile `new LineChart('#chart', data, options, responsiveOptions)` with 1.5-typed arguments against the built declarations
- **THEN** compilation succeeds, and passing an invalid option fails as in 1.5

### Requirement: Behavior through the public API

The suite SHALL cover the documented behavior of the public API through its entry points only: chart creation, `update`, `detach`/`destroy`, `on`/`off`, plugins, responsive options, `Svg`/`SvgList`/`SvgPath`, `Interpolation`, the axis classes and the exported helpers. Assertions SHALL check observable results such as output, event payloads and return values, not internals. The 1.x part SHALL be written and passing against the unchanged 1.5 code before core implementation starts.

#### Scenario: 1.x contract before core work

- **WHEN** the first core implementation change starts
- **THEN** the 1.x public API tests already pass against the 1.5 code, and they must keep passing (with the compat plugin where they use 1.x events or plugins)

#### Scenario: v2 API covered as it is built

- **WHEN** a core change adds a public function such as `chart`, `toScene` or a layer factory
- **THEN** the same change adds public API tests, export list entries and type tests for it

### Requirement: Tests run against the published 1.5.0 package

The 1.x tests, type tests and export checks SHALL also run against the published `chartist@1.5.0` package and pass there, so they describe 1.5 behavior rather than the current implementation.

#### Scenario: Same tests against published 1.5.0

- **WHEN** the suite is run against the published `chartist@1.5.0` package instead of the local build
- **THEN** every 1.x test, type test and export check passes

### Requirement: v2 type contract is tested

The v2 types SHALL have type tests that pin node narrowing by role, typed queries and builders, typed events and plugins, and the preset option types, including cases that must not type-check. The 1.x type tests SHALL keep passing unchanged against the local build and against Chartist 1.5.0.

#### Scenario: A type regression

- **WHEN** a change makes `findAll(scene, { role: 'bar' })` return untyped nodes again
- **THEN** the type tests fail

### Requirement: Documented public API

Every v2 top-level export, and every member of its interfaces and option types, SHALL have a doc comment whose first sentence summarizes it. Every 1.x export SHALL have at least a one-line description. Doc comments SHALL describe the current behavior and the functional API.

#### Scenario: An undocumented option

- **WHEN** a v2 option type gains a property without a doc comment
- **THEN** the docs check fails and names the property
