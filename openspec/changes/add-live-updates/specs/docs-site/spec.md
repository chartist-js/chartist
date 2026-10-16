## MODIFIED Requirements

### Requirement: Guides and chart type pages

The docs SHALL have pages for each chart type (line, bar, pie and donut, composed) and guides for data and options, sizing, styling with CSS, responsive options, axes and scales, target lines and bands, animations, events and plugins, custom layers, server rendering, live updates, and security and CSP. They SHALL use the functional API, show at least one live example each, and follow the writing guide in `apps/docs/WRITING.md`. Guides and examples SHALL NOT put chart output into a page with `innerHTML`; they SHALL use the DOM renderer or an element output.

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

#### Scenario: Live updates

- **WHEN** a reader opens the live updates guide
- **THEN** it shows a chart drawn with `liveDomRenderer({ key: 'label' })` and fed with new values every second, and a chart whose updates animate with `smilAnimations()` and `--ct-update-duration`, both live, and it explains importing `chartist/live` (with a bundler and from a CDN), identity and the `key` option, the changes and `cause` in `mount`, cleanup functions, and what live updates add to the bundle

#### Scenario: Cleanup in the plugins guide

- **WHEN** a reader opens the events and plugins guide
- **THEN** it shows a plugin that returns a cleanup function from `install`, and a `mount` listener that acts on added elements or returns a cleanup function

#### Scenario: Plugins for live updates

- **WHEN** a reader opens the events and plugins guide
- **THEN** a section on plugins for live updates covers keys for a plugin's own nodes, acting on `add` changes, cleanup, plugin keyframes and the animation timing in `mount`, with a live example of a small v2 tooltip plugin that keeps working while its chart gets new values every second

## ADDED Requirements

### Requirement: Converted plugins and live updates

The plugins page SHALL say that a 1.x plugin converted with `fromLegacyPlugin` makes its chart draw a new SVG on every render, even with `liveDomRenderer()`, and SHALL link the plugin section of the events and plugins guide for writing v2 plugins.

#### Scenario: The note

- **WHEN** a visitor reads the plugins page
- **THEN** it says that charts with converted 1.x plugins draw a new SVG on every render, even with `liveDomRenderer()`, and links the guide's section on plugins for live updates

### Requirement: The updating charts guide moved

The guide published at `/docs/updating-charts/` SHALL be at `/docs/live-updates/`, and the old path SHALL redirect there.

#### Scenario: Old link

- **WHEN** a reader opens `/docs/updating-charts/`
- **THEN** the page sends them to `/docs/live-updates/`
