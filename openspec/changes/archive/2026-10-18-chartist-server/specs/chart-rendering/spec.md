## MODIFIED Requirements

### Requirement: SVG string rendering

Chartist SHALL render a chart to a standalone SVG markup string without a DOM, with `renderToString()` from `chartist/server`. Width and height are given explicitly.

#### Scenario: Server-side rendering

- **WHEN** a line chart is rendered to a string in Node.js with width 600 and height 300, with `toScene()` and `renderToString()` from `chartist/server`
- **THEN** the result is valid SVG markup with `width="600"` and `height="300"` that contains the series paths, and no `window` or `document` access happens
