## ADDED Requirements

### Requirement: Documented public API

Every v2 top-level export, and every member of its interfaces and option types, SHALL have a doc comment whose first sentence summarizes it. Every 1.x export SHALL have at least a one-line description. Doc comments SHALL describe the current behavior and the functional API.

#### Scenario: An undocumented option

- **WHEN** a v2 option type gains a property without a doc comment
- **THEN** the docs check fails and names the property
