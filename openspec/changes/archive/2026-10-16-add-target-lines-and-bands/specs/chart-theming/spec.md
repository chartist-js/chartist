## ADDED Requirements

### Requirement: Target line and band styles

The default stylesheet SHALL style target lines, their labels and bands through custom properties with defaults: the target line's color, width and dash pattern (`--ct-target-line-color`, `--ct-target-line-width`, `--ct-target-line-dasharray`), and the band's color and opacity (`--ct-band-color`, `--ct-band-opacity`). By default a target line SHALL be a dashed line in the text color, and a band a light fill in the same color, so both read as references behind the data. A target line, label or band with a `ct-series-<letter>` class, or inside a series group, SHALL take that series' color from `--ct-color` instead. The defaults SHALL work in light and dark mode.

#### Scenario: Theme with a property

- **WHEN** a page sets `--ct-band-opacity: 0.3`
- **THEN** every band's fill opacity is 0.3

#### Scenario: Series color on a target line

- **WHEN** a target line has the class `ct-series-c`
- **THEN** its line and its label are drawn in the third series' color

#### Scenario: Dark mode

- **WHEN** the chart's text color changes for dark mode
- **THEN** target lines and bands without a series class follow it
