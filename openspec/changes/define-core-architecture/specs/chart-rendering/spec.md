# Spec Delta

## Purpose

Defines how a chart's scene becomes output through interchangeable renderers, and how renderers and hosts supply the size and text measurements that layout needs.

## ADDED Requirements

### Requirement: DOM SVG renderer is the default

When no renderer is configured and a container element is given, a chart SHALL render its scene as inline SVG into that container using the DOM SVG renderer. A previous Chartist SVG in that container is replaced, as in 1.x.

#### Scenario: Default rendering

- **WHEN** `new LineChart('#chart', data)` is created in a browser
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

Label text SHALL be renderable as SVG `text` with line wrapping computed during layout (one `tspan` per line) within the label's available width. Labels SHALL alternatively be renderable as HTML inside `foreignObject` (DOM renderer only).

#### Scenario: Multi-line label

- **WHEN** a label "Quarterly revenue in thousands" is rendered as SVG text in a 60 px wide slot
- **THEN** the label is split into several `tspan` lines, each no wider than 60 px by the renderer's measurement

### Requirement: Mount after render

The `mount` phase SHALL run after the renderer has produced the output. When the output is DOM, it SHALL give listeners access to the rendered element of each scene node.

#### Scenario: Attaching interactivity

- **WHEN** a `mount` listener asks for the rendered element of a point node
- **THEN** it receives the live SVG element and can attach DOM event listeners to it
