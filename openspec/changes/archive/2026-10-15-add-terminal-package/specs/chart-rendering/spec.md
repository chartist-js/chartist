# Spec Delta

## ADDED Requirements

### Requirement: Preset configs without a container

Chartist SHALL export functions that turn the data and options of the line, bar and pie presets into a chart config, without a container or DOM: the options over the preset defaults, as the presets merge them, without responsive options. Rendering that config SHALL give the same scene as the preset for the same size, apart from the root's size, which the host sets.

#### Scenario: Same scene as the preset

- **WHEN** the line preset config for some data and options is passed to `toScene()` at 600 × 300 px
- **THEN** the scene has the same nodes, attributes and data as the one `lineChart()` renders for that data and those options at that size, apart from the root's size (`width`, `height` and the inline size style), which the host sets

#### Scenario: Horizontal bars

- **WHEN** the bar preset config is made with `horizontalBars: true` and rendered with `renderToString()`
- **THEN** the SVG has horizontal bars and the labels the bar preset places for them

### Requirement: Series colors as data

Chartist SHALL export its default series colors, in series order (`a` first), as hex colors equal to the default `$ct-series-colors` of its Sass settings, so renderers without CSS use the same colors.

#### Scenario: Colors match the styles

- **WHEN** the default `$ct-series-colors` changes
- **THEN** a test fails until the exported series colors match it

### Requirement: Text metrics for SVG text labels

Chartist SHALL export the ascent that SVG text labels are laid out with, as a share of the font size, so a renderer can find where each line of a label is from its baseline.

#### Scenario: Line center

- **WHEN** a renderer reads a label line's `y` (its baseline) and the font size
- **THEN** it finds the line's vertical center at `y - (ascent - 0.5) × fontSize`
