## MODIFIED Requirements

### Requirement: Detaching a chart

The chart handle SHALL provide `detach()`, which stops reacting to container size changes and media queries but keeps the rendered output and the listeners. `destroy()` SHALL additionally run the pending cleanup functions of `mount` listeners, remove the output, run the cleanup functions plugins returned from `install`, and remove the listeners. A `detach()` during the first render SHALL take effect like one after it, for `chart()`, the presets and the 1.x classes.

#### Scenario: Detached chart stays visible

- **WHEN** `detach()` is called and the container is resized afterwards
- **THEN** the chart output stays in the container and is not rendered again

#### Scenario: Detach during the first render

- **WHEN** a listener of the first render calls `detach()` (a `mount` listener on `chart()`, a converted 1.x plugin's `created` listener on a preset, a `created` listener on a 1.x class), and the window and the container are resized afterwards
- **THEN** nothing throws, and the chart isn't rendered again

#### Scenario: Destroy cleans up

- **WHEN** a chart whose plugin returned a cleanup from `install` and whose `mount` listener returned one is destroyed
- **THEN** the `mount` cleanup runs, then the SVG is removed, then the plugin's cleanup runs, and a second `destroy()` runs none of them again

## ADDED Requirements

### Requirement: Presets take a renderer

`lineChart()`, `barChart()` and `pieChart()` SHALL take a `renderer` option, as `chart()` does, used for every render of the chart. It SHALL NOT be changeable with `setOptions()` or responsive options.

#### Scenario: A live preset

- **WHEN** `barChart('#chart', data, { renderer: liveDomRenderer() })` is updated
- **THEN** the bars are patched by the live renderer

#### Scenario: Default

- **WHEN** a preset is created without `renderer`
- **THEN** it renders with `domRenderer()`, as before
