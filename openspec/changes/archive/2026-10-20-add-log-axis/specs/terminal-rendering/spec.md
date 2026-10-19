## ADDED Requirements

### Requirement: Minor grid lines left out

Grid lines marked as minor (role `grid`, a context with `minor: true`) SHALL NOT be drawn: a cell stands for 16 px of height, so they would fill most rows and hide the major grid lines. The other grid lines and the labels SHALL be drawn as without them.

#### Scenario: A log axis with minor ticks

- **WHEN** a line chart whose Y axis has minor ticks is rendered
- **THEN** the output has grid lines only at the axis's ticks, the same as for that chart without minor ticks
