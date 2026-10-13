# Spec Delta

## MODIFIED Requirements

### Requirement: Wrapped SVG text labels

Axis labels SHALL be renderable either as SVG `text` or as HTML inside `foreignObject`. SVG text labels SHALL wrap words within the label's available width, measured by the renderer, with one `tspan` per line. They SHALL keep the classes, the box and the data context of the HTML labels, and SHALL be aligned by the layout so that they appear where the default Chartist CSS places HTML labels.

#### Scenario: Multi-line label

- **WHEN** a label "Quarterly revenue in thousands" is rendered as SVG text in a 60 px wide slot
- **THEN** the label is split into several `tspan` lines, each no wider than 60 px by the renderer's measurement

#### Scenario: Long word

- **WHEN** a single word is wider than its label slot
- **THEN** it stays on one line of its own and is not split

#### Scenario: Same place as HTML labels

- **WHEN** a line chart and a bar chart are rendered once with HTML labels and once with SVG text labels in a browser
- **THEN** each SVG label line starts at the side and edge where the default CSS aligns the HTML label (for example centered under the bar for bar charts, right-aligned left of the area for a left Y axis)

## ADDED Requirements

### Requirement: Label mode per renderer

Each rendering path SHALL have a default label mode: the DOM renderer draws HTML labels and `toScene()` draws SVG text labels. A `labels` option (`'html'` or `'svg'`) on the chart config, `toScene()`, the `lineChart` and `barChart` presets and the `axisLabels()` layer SHALL override the default, the layer option taking precedence over the chart option. The scene SHALL contain only the element of the chosen mode. The 1.x classes SHALL always draw HTML labels.

#### Scenario: Browser default

- **WHEN** `lineChart('#chart', data)` renders in a browser
- **THEN** its labels are `foreignObject` elements with the 1.x markup

#### Scenario: String default

- **WHEN** a chart config with `axisLabels()` is rendered with `renderToString(toScene(config, size))`
- **THEN** the output contains `text` labels and no `foreignObject`

#### Scenario: Opting in

- **WHEN** `barChart('#chart', data, { labels: 'svg' })` renders in a browser
- **THEN** its axis labels are SVG `text` elements with the `ct-label` classes

#### Scenario: Layer overrides chart

- **WHEN** a chart config sets `labels: 'svg'` and its `axisLabels({ labels: 'html' })` layer sets HTML
- **THEN** that layer's labels are `foreignObject` elements
