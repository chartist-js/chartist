# Spec Delta

## ADDED Requirements

### Requirement: Axis factories

Axis types SHALL be created by factory functions (`stepAxis`, `autoScaleAxis`, `fixedScaleAxis`) that return plain axis objects. An axis SHALL compute its range and ticks from the data bound to it and project values into the chart area with the 1.x scale rules (bounds, `scaleMinSpace`, `onlyInteger`, `low`/`high`, `ticks`, `divisor`). Presets SHALL also accept the 1.x axis classes as an axis `type` and treat them as the matching factory.

#### Scenario: Factory and class give the same axis

- **WHEN** one line chart uses `axisY: { type: FixedScaleAxis, ticks: [0, 5, 10] }` and another uses the `fixedScaleAxis` factory with the same ticks
- **THEN** both render the same grid lines and labels

#### Scenario: Auto scale like 1.x

- **WHEN** a line chart with values 1 to 9 uses the default Y axis with `onlyInteger: true`
- **THEN** the Y labels and grid positions are the same as those of 1.5 for the same data, options and size

#### Scenario: Grid and label nodes

- **WHEN** a `compose` listener observes a line chart
- **THEN** it receives grid nodes with role `grid` and label nodes with role `label`, each carrying the axis and tick index in its data context
