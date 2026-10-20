## ADDED Requirements

### Requirement: Essentials examples

The examples package SHALL have an `essentials` type for the examples that use `@chartist-js/essentials`. They SHALL live in `packages/examples/essentials/<name>`, have the id `essentials/<name>`, have no 1.x code, and import the package and its stylesheet as a reader's project would. The examples package SHALL depend on `@chartist-js/essentials` as a workspace dependency, so its examples type-check against the package's declarations. The examples check SHALL fail for an example outside `essentials/` that imports `@chartist-js/essentials`.

#### Scenario: An axis title example

- **WHEN** a consumer reads the manifest entry `essentials/axis-titles`
- **THEN** its type is `essentials`, its folder is `essentials/axis-titles`, and it has no classic entry

#### Scenario: An essentials example in the wrong folder

- **WHEN** an example `line/with-titles` imports `axisTitle` from `@chartist-js/essentials`
- **THEN** the examples check fails and names the example
