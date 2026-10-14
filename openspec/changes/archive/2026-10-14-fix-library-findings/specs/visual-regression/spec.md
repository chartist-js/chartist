## ADDED Requirements

### Requirement: Intended changes get their own baseline

An example whose output changes on purpose compared to 1.5.0 SHALL get a baseline of its own, recorded from the local build, with the reason (the issue) in the examples manifest, and committed separately so each image can be reviewed. All other examples SHALL keep comparing against the 1.5.0 baseline.

#### Scenario: A 1.x behavior fixed in v2

- **WHEN** a fix changes how an example draws compared to 1.5.0
- **THEN** that example compares against its own reviewed baseline, and the manifest names the issue
