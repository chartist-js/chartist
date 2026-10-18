## MODIFIED Requirements

### Requirement: DOM SVG renderer is the default

When no renderer is configured and a container element is given, a chart SHALL render its scene as inline SVG into that container using the DOM SVG renderer. A previous Chartist SVG in that container is replaced, as in 1.x. That SHALL include a Chartist SVG the browser parsed from HTML, such as server-rendered markup, where the HTML parser leaves the `xmlns:ct` declaration as a plain attribute.

#### Scenario: Default rendering

- **WHEN** `lineChart('#chart', data)` is called in a browser
- **THEN** an `svg` element with the Chartist namespace attribute is rendered inside `#chart`

#### Scenario: Replacing server-rendered markup

- **WHEN** a container holds the `renderToString()` markup of a chart, parsed as HTML, and `lineChart()` draws into it with the DOM renderer
- **THEN** the container holds one svg, the new chart

## ADDED Requirements

### Requirement: Closed HTML elements in string output

`renderToString()` SHALL write HTML elements inside a `foreignObject` with an explicit end tag, also when they're empty, so the markup parses to the same elements as XML and as HTML. SVG elements without content MAY stay self-closing.

#### Scenario: An empty label in an HTML page

- **WHEN** a line chart with the labels `Mon`, an empty string and `Wed` is rendered with `renderToString()` and HTML labels, and placed in a page before a paragraph
- **THEN** the page parses with the paragraph after the chart's container, not inside a label

#### Scenario: XML stays the same

- **WHEN** that markup is parsed as XML
- **THEN** it has the same elements and attributes as before this change

### Requirement: Renderers may adopt markup

A renderer MAY provide `adopt(container, replay)`: it takes over server markup in the container, instead of rendering, builds the scene for the layout the markup records with the chart's `replay`, and returns its output, or nothing when there's no markup or it doesn't match the scene. The output SHALL tell how many differences it repaired. A chart SHALL use it only to take over server markup, as the hydration capability defines. Renderers without it SHALL keep working unchanged.

#### Scenario: A custom renderer without adopt

- **WHEN** a chart with a custom renderer that has no `adopt` draws into a container with hydration markup
- **THEN** the renderer's `render()` is called as on a first render, with no previous render

#### Scenario: A renderer that declines

- **WHEN** a renderer's `adopt` returns nothing for the server's svg
- **THEN** the chart renders with the renderer's `render()` as on a first render
