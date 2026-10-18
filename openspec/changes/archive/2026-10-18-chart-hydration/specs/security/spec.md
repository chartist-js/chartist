## ADDED Requirements

### Requirement: Hydration markup under a strict style policy

The markup `renderForHydration()` returns SHALL contain no `style` attributes and no `style` elements, so a page whose policy allows styles only from the page's own origin (`style-src 'self'`) reports no violation for it, before and after the chart takes it over. With Chartist's stylesheet, the markup SHALL look under such a policy as it does without it. The chart that took it over SHALL apply its inline styles through the CSSOM, as every chart does. The self-contained SVG markup from `renderToString()` keeps its `style` attributes; the security docs SHALL say which of the two outputs to put into pages with such a policy.

#### Scenario: No violations

- **WHEN** a page served with `default-src 'self'; style-src 'self'` contains the hydration markup of a line chart with HTML labels and of a donut with `donutWidth: 20`, and takes both over with `lineChart()`, `pieChart()` and `liveDomRenderer()`
- **THEN** the page reports no CSP violation, before or after the takeover

#### Scenario: Labels and donut width under the policy

- **WHEN** that page is shown without JavaScript, and again after the takeover
- **THEN** the labels have the positions and sizes they have without the policy, and the slices have a stroke width of 20 px, both times
