## MODIFIED Requirements

### Requirement: Layers on a log axis

The core layers and the essentials lines SHALL draw on a log axis without changes:

- lines, points and areas at their log positions; areas SHALL close at the axis start;
- bars SHALL grow from the axis start; a bar for zero or a negative value SHALL have no length;
- `band()` edges at their log positions; `mark` SHALL compare values, not positions;
- `targetLine()` at its value; a target line at zero or below SHALL sit at the axis start;
- `trendLine()` SHALL fit its line in log space (see reference-lines, "Trend lines on transformed axes"), so it's straight on the axis and follows exponential growth on a log Y axis.

#### Scenario: Bars from the axis start

- **WHEN** `barChart` gets the values 10, 1,000 and 0 and `axisY: { type: logAxis(), low: 1 }`
- **THEN** every bar starts at the bottom edge of the chart area, the second bar is three times as long as the first, and the third has no length

#### Scenario: An area

- **WHEN** a line chart with `showArea: true` draws on a log Y axis
- **THEN** each area closes at the bottom edge of the chart area

#### Scenario: Exponential growth

- **WHEN** a line chart on a log Y axis has the values 1, 10, 100 and 1,000 and a `trendLine()` layer
- **THEN** the trend line passes through all four points
