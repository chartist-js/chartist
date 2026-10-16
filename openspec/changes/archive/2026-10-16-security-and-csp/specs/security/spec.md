## Purpose

Defines what Chartist and its packages guarantee to pages with a Content Security Policy or Trusted Types, and how they keep chart data from injecting markup into any output.

## ADDED Requirements

### Requirement: Charts work under a strict style policy

Charts SHALL render completely on a page whose policy allows styles only from the page's own origin (`style-src 'self'`). Chartist SHALL apply every inline style it needs (the chart's size, label sizes, donut widths, measuring probes) through the CSSOM and SHALL NOT set a `style` attribute with `setAttribute`. This holds for the functional API, the presets and the 1.x classes and helpers, including styles a 1.x draw listener sets with `Svg#attr()`. The rendered markup SHALL keep the `style` attributes of the 1.x structure.

#### Scenario: No violations

- **WHEN** a page served with `default-src 'self'; style-src 'self'` draws a line chart, a bar chart, a horizontal bar chart, a pie chart, a donut with `donutWidth`, a chart with SVG labels, a chart with a band and a target line, a chart with responsive options, an updated chart and a 1.x `LineChart`
- **THEN** the page reports no CSP violation

#### Scenario: Labels keep their size

- **WHEN** a line chart is drawn under that policy
- **THEN** its axis labels have the same positions and sizes as without the policy

#### Scenario: Donut width applies

- **WHEN** a donut with `donutWidth: 20` is drawn under that policy
- **THEN** its slices have a stroke width of 20 px

#### Scenario: Same markup

- **WHEN** a line chart is drawn in the DOM
- **THEN** its `svg` and label elements carry the same `style` declarations in their `style` attributes as before this change

#### Scenario: 1.x draw listener

- **WHEN** a 1.x draw listener calls `element.attr({ style: 'opacity: 0.5' })` under that policy
- **THEN** the element's opacity is 0.5 and no violation is reported

### Requirement: Nothing a script policy blocks

The built packages (ESM, CJS, UMD and minified files) SHALL NOT evaluate strings as code (`eval`, `new Function`, string timers) and SHALL NOT add `style` elements or style sheets to the page, so they run under `script-src 'self'` without `'unsafe-eval'` and need no `'unsafe-inline'`.

#### Scenario: Strict script policy

- **WHEN** a page served with `script-src 'self'` loads the ESM build and draws a chart
- **THEN** the chart renders and no violation is reported

### Requirement: DOM rendering without innerHTML

The DOM renderer SHALL create elements and text with DOM methods and SHALL NOT assign HTML strings, so charts render on pages that require Trusted Types (`require-trusted-types-for 'script'`) without a policy. 1.x `Svg#foreignObject()` given a string SHALL keep parsing it as HTML.

#### Scenario: Trusted Types

- **WHEN** a page that requires Trusted Types draws a line chart with HTML labels and a 1.x `LineChart`
- **THEN** both render and no violation is reported

### Requirement: Data is escaped in every output

Data SHALL appear only as text or as escaped attribute values in every output (the DOM, SVG strings, the terminal's HTML and element output and its legend): labels, series names, class names, meta, the results of label functions, target line labels and pie labels. No data value SHALL create an element or an attribute.

#### Scenario: Script in a label

- **WHEN** a chart whose label is `"><img src=x onerror=alert(1)>` is rendered to a string and the string is inserted into a page
- **THEN** the page shows the label as text, no `img` element exists and no script runs

#### Scenario: Every field

- **WHEN** such a payload is put into each data field and the chart is rendered by each output
- **THEN** none of the outputs contains an element or attribute created by the payload

### Requirement: Checked names in string output

SVG string rendering SHALL throw a descriptive error when a node's element name or attribute name is not a valid XML name, as the DOM does, instead of writing it into the markup.

#### Scenario: Element name with markup

- **WHEN** a scene with a node named `img src=x onerror=alert(1)` is rendered to a string
- **THEN** rendering throws an error that names the invalid element name

#### Scenario: Attribute name with markup

- **WHEN** a scene with an attribute named `x onload=alert(1)` is rendered to a string
- **THEN** rendering throws an error that names the invalid attribute name

#### Scenario: Namespaced names

- **WHEN** a scene with `ct:value` and `xmlns:ct` attributes is rendered to a string
- **THEN** the markup contains them as before
