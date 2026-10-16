## ADDED Requirements

### Requirement: 1.x code gets a new SVG on every render

The 1.x chart classes, and charts created with the compat plugin, SHALL replace their SVG with a new one on every render, as 1.x does, whatever their renderer, so 1.x `draw` listeners and plugins that append elements, start SMIL animations or keep element references get new elements each time. Their renderer SHALL NOT receive the previous render, and their `render` and `mount` events SHALL describe each render as a replacement.

#### Scenario: Animations in a draw listener

- **WHEN** a 1.x `LineChart` whose `draw` listener appends a SMIL animation to each point is updated twice
- **THEN** each point has exactly one `animate` element after each update, as in 1.5

#### Scenario: Compat with the live renderer

- **WHEN** `lineChart()` with the compat plugin and `renderer: liveDomRenderer()` updates
- **THEN** its `svg` is a new element, and `draw` events carry the new elements

### Requirement: Easings that overshoot

`Svg#animate()` SHALL take as `easing`, besides the names of `easings` and four numbers, any CSS easing string `sampleEasing()` accepts (`ease-out`, `cubic-bezier()`, `linear()`, `steps()`), so plugins can pass on the timing the chart gives them. It SHALL run animations whose easing goes below 0 or above 1, such as the exported `easeInBack`, `easeOutBack` and `easeInOutBack`, in every browser. Browsers ignore a SMIL animation whose `keySplines` lie outside 0 to 1, so such an easing SHALL be drawn with sampled keyframes instead. Easings within 0 to 1 SHALL keep their `keySplines`, as in 1.x. In 1.x the three back easings didn't animate at all.

#### Scenario: Back easing

- **WHEN** a point is animated with `animate({ y1: { dur: 600, from: 0, to: 100, easing: 'easeOutBack' } })`
- **THEN** it moves from 0 past 100 and settles at 100, in Chromium, Firefox and WebKit

#### Scenario: CSS easing strings

- **WHEN** a point is animated with `easing: 'ease-out'` or `easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'`
- **THEN** it animates with that CSS timing function, the second one overshooting its target before it settles

#### Scenario: In-range easing

- **WHEN** a point is animated with `easing: 'easeOutQuart'`
- **THEN** its `animate` element has `calcMode="spline"` and the curve's `keySplines`, as in 1.x
