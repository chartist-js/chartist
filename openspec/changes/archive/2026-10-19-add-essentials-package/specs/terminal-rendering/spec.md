## ADDED Requirements

### Requirement: Vertical text

A `text` node whose `transform` rotates it by a quarter turn (`rotate(-90 …)` or `rotate(90 …)`, about its anchor) SHALL be drawn vertically, one character per row, in the column of its anchor: bottom to top for −90, top to bottom for 90, aligned along the column as its `text-anchor` says (start, middle or end). Text with any other transform SHALL be drawn as before.

#### Scenario: A vertical axis title

- **WHEN** a line chart with `axisTitle({ axis: 'y', text: 'Visits' })` from `@chartist-js/essentials` is rendered to the terminal
- **THEN** the letters of `Visits` stand in one column left of the Y axis labels, centered on the chart's height, reading from bottom to top

#### Scenario: Unrotated text

- **WHEN** a scene has a `text` node without a `transform`
- **THEN** it is drawn in one row, as before
