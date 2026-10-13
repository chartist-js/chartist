# Spec Delta

## ADDED Requirements

### Requirement: Chart area minimum

For charts without axes, the layout SHALL use the 1.x minimums: the chart is at least as wide and high as its padding, and the chart area is at least 1 px wide and high.

#### Scenario: Padding larger than the chart

- **WHEN** a chart without axes is 20 × 20 px with a padding of 15 px on each side
- **THEN** the chart area starts at the left and top padding and is 1 × 1 px, as 1.5's `createChartRect` computes it
