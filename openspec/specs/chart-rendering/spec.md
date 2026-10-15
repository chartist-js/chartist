# chart-rendering Specification

## Purpose

Defines how a chart's scene becomes output through interchangeable renderers, and how renderers and hosts supply the size and text measurements that layout needs.

## Requirements

### Requirement: DOM SVG renderer is the default

When no renderer is configured and a container element is given, a chart SHALL render its scene as inline SVG into that container using the DOM SVG renderer. A previous Chartist SVG in that container is replaced, as in 1.x.

#### Scenario: Default rendering

- **WHEN** `lineChart('#chart', data)` is called in a browser
- **THEN** an `svg` element with the Chartist namespace attribute is rendered inside `#chart`

### Requirement: SVG string rendering

Chartist SHALL render a chart to a standalone SVG markup string without a DOM. Width and height are given explicitly.

#### Scenario: Server-side rendering

- **WHEN** a line chart is rendered to a string in Node.js with width 600 and height 300
- **THEN** the result is valid SVG markup with `width="600"` and `height="300"` that contains the series paths, and no `window` or `document` access happens

### Requirement: No global environment access in the core

Importing Chartist and building scenes SHALL NOT access `window`, `document` or other browser globals. Only the DOM renderer and DOM host do, and only when a chart is attached to an element.

#### Scenario: Import in Node.js

- **WHEN** `chartist` is imported in Node.js or in an SSR framework's server bundle
- **THEN** the import succeeds without errors

### Requirement: Size measurement

Layout SHALL receive the chart size from the host. In the DOM that is the container size, observed for changes. For string rendering it is the explicit width and height. Fixed `width`/`height` options SHALL take precedence as in 1.x.

#### Scenario: Container-driven size

- **WHEN** a chart without fixed size options is attached to a 500 px wide container that later becomes 300 px wide
- **THEN** the chart is laid out at 500 px wide and then again at 300 px wide

### Requirement: Text measurement for layout

Renderers SHALL provide a text measurement capability that layout uses for label wrapping and collision handling. Renderers without exact metrics SHALL provide an estimate.

#### Scenario: Measurement without DOM

- **WHEN** a chart with long axis labels is rendered to a string
- **THEN** labels are wrapped and spaced using estimated text metrics, and rendering does not fail

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

### Requirement: Mount after render

The `mount` phase SHALL run after the renderer has produced the output. When the output is DOM, it SHALL give listeners access to the rendered element of each scene node.

#### Scenario: Attaching interactivity

- **WHEN** a `mount` listener asks for the rendered element of a point node
- **THEN** it receives the live SVG element and can attach DOM event listeners to it

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

### Requirement: Style measurement for layout

Renderers MAY provide a style measurement capability that layout uses for values the stylesheet decides. The DOM renderer SHALL provide it, measuring computed styles in the chart's container. Layout SHALL fall back to its default when a value can't be measured. The pie layer SHALL lay out a donut for the measured stroke width of a donut slice unless `donutWidth` is set.

#### Scenario: Donut width from CSS

- **WHEN** a donut without `donutWidth` is drawn in a container that sets `--ct-donut-width: 20px`
- **THEN** its ring is laid out for 20 px, so it touches the chart's edge

#### Scenario: Donut width without a DOM

- **WHEN** a donut without `donutWidth` is rendered to a string
- **THEN** its ring is laid out for 60 px

### Requirement: Charts in another document

A chart attached to an element of another document (an iframe, or JSDOM in Node without globals) SHALL use that element's document and window to create elements, match media queries, observe its size and listen for resizes. `Svg` SHALL recognize elements of any document.

#### Scenario: JSDOM without globals

- **WHEN** `lineChart()` with the compat plugin and `new LineChart()` draw into a JSDOM element in Node with no DOM globals installed, and `new Svg()` wraps a JSDOM element
- **THEN** all three work without errors, and the 1.x `draw` events fire

#### Scenario: Media queries in an iframe

- **WHEN** a chart in an iframe has responsive options whose query matches the iframe's width but not the top window's
- **THEN** the chart uses the override

### Requirement: Printing

A chart attached to the DOM SHALL fit the box it gets when the page is printed. During printing, its SVG SHALL have a `viewBox` of its layout size, unless the chart's config sets one, and the `viewBox` SHALL be removed afterwards. Detached charts SHALL NOT react.

#### Scenario: Printing a wide chart

- **WHEN** a chart laid out at 1400 px wide is printed into a 795 px wide box
- **THEN** the whole chart is visible in the print, scaled to the box

### Requirement: Preset configs without a container

Chartist SHALL export functions that turn the data and options of the line, bar and pie presets into a chart config, without a container or DOM: the options over the preset defaults, as the presets merge them, without responsive options. Rendering that config SHALL give the same scene as the preset for the same size, apart from the root's size, which the host sets.

#### Scenario: Same scene as the preset

- **WHEN** the line preset config for some data and options is passed to `toScene()` at 600 × 300 px
- **THEN** the scene has the same nodes, attributes and data as the one `lineChart()` renders for that data and those options at that size, apart from the root's size (`width`, `height` and the inline size style), which the host sets

#### Scenario: Horizontal bars

- **WHEN** the bar preset config is made with `horizontalBars: true` and rendered with `renderToString()`
- **THEN** the SVG has horizontal bars and the labels the bar preset places for them

### Requirement: Series colors as data

Chartist SHALL export its default series colors, in series order (`a` first), as hex colors equal to the default `$ct-series-colors` of its Sass settings, so renderers without CSS use the same colors.

#### Scenario: Colors match the styles

- **WHEN** the default `$ct-series-colors` changes
- **THEN** a test fails until the exported series colors match it

### Requirement: Text metrics for SVG text labels

Chartist SHALL export the ascent that SVG text labels are laid out with, as a share of the font size, so a renderer can find where each line of a label is from its baseline.

#### Scenario: Line center

- **WHEN** a renderer reads a label line's `y` (its baseline) and the font size
- **THEN** it finds the line's vertical center at `y - (ascent - 0.5) × fontSize`
