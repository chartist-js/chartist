## ADDED Requirements

### Requirement: Essentials in the examples gallery

The examples gallery SHALL have an "Essentials" section, after "Live data", with every docs example of the `essentials` type, each with its own page like the other examples, running in the playground with `@chartist-js/essentials` and its stylesheet. Examples that use the package SHALL NOT appear in the other sections. The guides of the essentials docs SHALL show these examples from the gallery, not copies of them.

#### Scenario: The section

- **WHEN** a visitor opens the examples gallery
- **THEN** an "Essentials" section after "Live data" lists the axis title examples, its filter chip shows only them, and each one's page runs it and opens it in the playground
