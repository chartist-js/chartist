## MODIFIED Requirements

### Requirement: Guides and chart type pages

The docs SHALL have pages for each chart type (line, bar, pie and donut, composed) and guides for data and options, sizing, styling with CSS, responsive options, axes and scales, target lines and bands, animations, events and plugins, custom layers, server rendering, updating charts, and security and CSP. They SHALL use the functional API, show at least one live example each, and follow the writing guide in `apps/docs/WRITING.md`. Guides and examples SHALL NOT put chart output into a page with `innerHTML`; they SHALL use the DOM renderer or an element output.

#### Scenario: A guide runs as written

- **WHEN** a reader opens a guide and presses Edit on its live example
- **THEN** the example runs against the current build and the chart re-renders as the code changes

#### Scenario: Target lines and bands on a preset

- **WHEN** a reader opens the target lines and bands guide
- **THEN** it shows a target line added to a preset with the `layers` option and a band chart with a band and lines on top, both live

#### Scenario: Security and CSP

- **WHEN** a reader opens the security and CSP guide
- **THEN** it states the policy Chartist needs (nothing beyond `'self'` for the library, `font-src data:` for the terminal stylesheet), that data is escaped in every output, that `Svg#foreignObject()` strings are raw HTML, that plugins run as the page's own code, and how to render without `innerHTML`, with a live example

#### Scenario: Browser rendering in the server rendering guide

- **WHEN** a reader opens the server rendering guide
- **THEN** its browser example draws the chart with `chart()` or the DOM renderer, not with `renderToString()` and `innerHTML`

#### Scenario: Terminal examples

- **WHEN** a reader opens a terminal example
- **THEN** its code adds the text art with `format: 'element'`, not with `innerHTML`
