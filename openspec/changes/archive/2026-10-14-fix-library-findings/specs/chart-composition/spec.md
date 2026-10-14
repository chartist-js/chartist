## ADDED Requirements

### Requirement: Layers widen their axes

A layer SHALL be able to report the value extent it needs on an axis, and axes SHALL include it. A bar layer that stacks SHALL report its stacked extent, positive and negative stacks apart for `accumulate-relative`.

#### Scenario: Stacked bars in chart()

- **WHEN** a `bar()` layer stacks series `[5, 5]` and `[4, 4]` on an auto scale axis
- **THEN** the axis reaches 9 and no bar is drawn past its end

### Requirement: Preset handles change options

The handles of `lineChart`, `barChart` and `pieChart` SHALL change the chart's options after creation, extending the current options or, when asked, the defaults, and SHALL keep data given to `update()` across responsive changes. The presets SHALL take phase listeners in their options, registered before the first render.

#### Scenario: Showing the area later

- **WHEN** a line chart created without areas gets `setOptions({ showArea: true })`
- **THEN** it redraws with areas

#### Scenario: Data across a breakpoint

- **WHEN** a preset chart gets new data through `update()` and a responsive breakpoint changes afterwards
- **THEN** the redraw shows the new data

### Requirement: Composed chart defaults

`chart()` SHALL give its SVG a chart type class from its layers when no `className` is given; `stepAxis()` without ticks SHALL use the data's labels; `cartesianAxes()` SHALL use the same defaults in its object and list forms.

#### Scenario: A composed chart's class

- **WHEN** `chart()` draws a bar layer and a line layer without `className`
- **THEN** its SVG has the class `ct-chart-bar`
