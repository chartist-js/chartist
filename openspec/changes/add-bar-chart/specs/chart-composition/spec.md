# Spec Delta

## ADDED Requirements

### Requirement: Axis kind and chart-specific normalization

A created axis SHALL report its kind (for example `step`, `autoScale`, `fixedScale`, or the 1.x class it wraps) and, for step axes, whether it is stretched, so layers can position elements per axis kind. Cartesian axes SHALL accept the 1.x normalization options of the chart type: the value dimension (`x` or `y`) for single values, and distributed series.

#### Scenario: Horizontal bars

- **WHEN** a bar chart with `horizontalBars: true` and data `[[1, 2]]` is created
- **THEN** the values are projected on the X axis, the labels on the Y axis, and the output equals 1.5's

#### Scenario: Step axis detection

- **WHEN** a bar chart uses the default label axis, and another one a 1.x `StepAxis` class as label axis
- **THEN** both center their bars on the steps, as 1.5 does for `StepAxis`
