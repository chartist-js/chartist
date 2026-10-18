## ADDED Requirements

### Requirement: Server markup under a strict style policy

A chart that takes server markup over on a page whose policy allows styles only from the page's own origin (`style-src 'self'`) SHALL end up with every inline style applied, as a chart drawn in that page does, and the page SHALL report no violation caused by Chartist's scripts. The `style` attributes in the server markup stay blocked by such a policy until the chart takes it over; until then, without JavaScript, labels MAY be misplaced. The server rendering docs SHALL say so.

#### Scenario: Labels after the takeover

- **WHEN** a page served with `default-src 'self'; style-src 'self'` contains the hydration markup of a line chart with HTML labels, and draws it with `lineChart()` and `liveDomRenderer()` at the server's size
- **THEN** the labels have the positions and sizes they have without the policy, and no violation is reported for Chartist's styles

#### Scenario: Donut width after the takeover

- **WHEN** such a page contains the hydration markup of a donut with `donutWidth: 20`, and draws it with `pieChart()` and `liveDomRenderer()`
- **THEN** its slices have a stroke width of 20 px
