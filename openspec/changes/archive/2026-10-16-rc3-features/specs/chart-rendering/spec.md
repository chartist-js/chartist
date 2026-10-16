## ADDED Requirements

### Requirement: Line breaks in pie labels

A `\n` in a pie or donut label, as given or as returned by `labelTransform`, SHALL start a new line. The lines SHALL be drawn as `tspan`s of the label's `text`, one line height apart, and the block SHALL stay centered on the label's anchor. A label without a line break SHALL be drawn exactly as before.

#### Scenario: Two lines

- **WHEN** a pie's labels are `Apples\n60%` and `Pears\n40%`
- **THEN** each label is a `text` with two `tspan`s, the second one line below the first, and the two lines together are centered where the one-line label would be

#### Scenario: One line

- **WHEN** a label has no line break
- **THEN** its `text` has no `tspan` and is placed as before
