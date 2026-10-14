## ADDED Requirements

### Requirement: Both entries match one baseline

For examples with a classic entry, the harness SHALL render the functional entry and the classic entry of the local build, and compare both with the same baseline image. Runs against published 1.5.0 SHALL render the classic entry. An entry MAY have its own baseline image only through an explicit, commented override in the manifest.

#### Scenario: A conversion changes the drawing

- **WHEN** an example's functional entry draws a pixel differently from its classic entry beyond the tolerance
- **THEN** the visual tests fail for the functional entry and name the example
