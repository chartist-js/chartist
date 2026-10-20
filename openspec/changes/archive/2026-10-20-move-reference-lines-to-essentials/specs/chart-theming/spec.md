## ADDED Requirements

### Requirement: Band styles

The default stylesheet SHALL style bands through custom properties with defaults: the band's color and opacity (`--ct-band-color`, `--ct-band-opacity`). By default a band SHALL be a light fill in the text color, so it reads as a reference behind the data. A band with a `ct-series-<letter>` class, or inside a series group, SHALL take that series' color from `--ct-color` instead. The defaults SHALL work in light and dark mode. The default stylesheet SHALL NOT style target lines or trend lines; the essentials stylesheet does.

#### Scenario: Theme with a property

- **WHEN** a page sets `--ct-band-opacity: 0.3`
- **THEN** every band's fill opacity is 0.3

#### Scenario: Dark mode

- **WHEN** the chart's text color changes for dark mode
- **THEN** bands without a series class follow it

## REMOVED Requirements

### Requirement: Target line and band styles

**Reason**: The target line styles move to the essentials stylesheet (`reference-lines`); the band styles stay, as "Band styles".
**Migration**: Load `@chartist-js/essentials/styles.css` for target lines; the custom properties keep their names. The Sass settings `$ct-target-line-*` are gone: set the custom properties instead.

### Requirement: Trend line styles

**Reason**: The trend line styles move to the essentials stylesheet (`reference-lines`).
**Migration**: Load `@chartist-js/essentials/styles.css`; the custom properties keep their names. The Sass settings `$ct-trend-line-*` are gone: set the custom properties instead.
