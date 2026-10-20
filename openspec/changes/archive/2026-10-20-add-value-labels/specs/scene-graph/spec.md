## ADDED Requirements

### Requirement: Bar direction and stacking in the bar context

The context of a `bar` node SHALL say whether the bar is horizontal (`horizontal`, true when the bar layer draws `horizontalBars`) and whether it's a segment of a stack (`stacked`, true when the bar layer stacks with `accumulate` or `accumulate-relative`; false for `overlap`, which draws every bar from zero). The output SHALL NOT change.

#### Scenario: A horizontal stacked bar chart

- **WHEN** a `compose` listener receives the bars of `barChart(container, data, { horizontalBars: true, stackBars: true })`
- **THEN** every bar's context has `horizontal: true` and `stacked: true`

#### Scenario: Overlapping bars

- **WHEN** a bar chart has `stackBars: true` and `stackMode: 'overlap'`
- **THEN** every bar's context has `stacked: false`

#### Scenario: Unchanged output

- **WHEN** a bar chart is rendered before and after these fields existed
- **THEN** both outputs are identical
