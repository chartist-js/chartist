## ADDED Requirements

### Requirement: v2 type contract is tested

The v2 types SHALL have type tests that pin node narrowing by role, typed queries and builders, typed events and plugins, and the preset option types, including cases that must not type-check. The 1.x type tests SHALL keep passing unchanged against the local build and against Chartist 1.5.0.

#### Scenario: A type regression

- **WHEN** a change makes `findAll(scene, { role: 'bar' })` return untyped nodes again
- **THEN** the type tests fail
