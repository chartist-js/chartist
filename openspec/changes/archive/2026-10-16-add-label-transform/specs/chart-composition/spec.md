## ADDED Requirements

### Requirement: Label transform option

Every option that takes a label function SHALL accept it as `labelTransform`: the axis options of the presets, the axes of `cartesianAxes()`, `pieChart` and the `pie()` layer. The function SHALL get the same arguments and its result SHALL be used the same way as `labelInterpolationFnc`'s. When both names are set for the same axis or pie, from options, defaults or responsive overrides, `labelTransform` SHALL be used. `labelInterpolationFnc` SHALL keep working when it's the only one set, and SHALL be marked deprecated in the type declarations, pointing to `labelTransform`. Without either, labels SHALL show the tick's value or the slice's label as before.

#### Scenario: The new name

- **WHEN** `lineChart` gets `axisY: { labelTransform: value => `${value} °C` }`
- **THEN** the Y axis labels read `0 °C`, `5 °C`, and so on

#### Scenario: Both names

- **WHEN** an axis has `labelInterpolationFnc: () => 'old'` and `labelTransform: () => 'new'`
- **THEN** every label of that axis reads `new`

#### Scenario: 1.x code unchanged

- **WHEN** 1.x code passes `labelInterpolationFnc` to `new LineChart(...)` or a preset
- **THEN** the output is the same as before this option existed

#### Scenario: Pie labels

- **WHEN** `pieChart` gets `labelTransform: (label, index) => `${label} (${index})``
- **THEN** the slice labels use it

#### Scenario: Deprecated in the types

- **WHEN** code sets `labelInterpolationFnc` on a preset's axis
- **THEN** the declaration marks it deprecated with a pointer to `labelTransform`, so editors strike it through
