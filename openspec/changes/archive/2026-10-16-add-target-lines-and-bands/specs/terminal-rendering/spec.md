## ADDED Requirements

### Requirement: Target lines and bands

Bands SHALL be shaded with a braille dot pattern below the grid, like areas. Target lines SHALL be drawn as braille lines, and their labels on the character grid like other labels. A band or target line with a series color SHALL take it; others SHALL use the terminal's default color.

#### Scenario: A band chart

- **WHEN** a chart with a band between two series and a line on top is rendered
- **THEN** the band is shaded with braille dots between its edges, the grid lines stay visible across it, and the line is drawn over it

#### Scenario: A labeled target line

- **WHEN** a chart with `targetLine({ value: 1000, label: 'target' })` is rendered
- **THEN** the output has a horizontal braille line at 1000 and the text "target" next to it
