## MODIFIED Requirements

### Requirement: Guides and chart type pages

The docs SHALL have pages for each chart type (line, bar, pie and donut, composed) and guides for data and options, sizing, styling with CSS, responsive options, axes and scales, target lines and bands, animations, events and plugins, custom layers, server rendering, SSR with hydration, charts in frameworks, live updates, and security and CSP. They SHALL use the functional API, show at least one live example each, and follow the writing guide in `apps/docs/WRITING.md`. Guides and examples SHALL NOT put chart output into a page with `innerHTML`; they SHALL use the DOM renderer or an element output. The one exception is the framework recipes in the charts in frameworks guide: they MAY hand server markup to a framework's own raw-HTML feature (`dangerouslySetInnerHTML`, `v-html`, `{@html}`, a host element's `innerHTML` on the server), which is how frameworks put server-rendered HTML into a page, and they SHALL say that the browser never sets it again. The docs navigation SHALL list the pages from first steps to advanced topics, in the groups Start here, Chart types, Basics (data and options, axes and scales, sizing, styling, responsive options, animations, target lines and bands) and Advanced (live updates, events and plugins, custom layers, server rendering, SSR with hydration, charts in frameworks, security and CSP).

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

#### Scenario: Two outputs in the server rendering guide

- **WHEN** a reader opens the server rendering guide
- **THEN** it explains the two outputs, the self-contained SVG image from `toScene()` and `renderToString()` with its inline styles, and the hydration markup from `renderForHydration()` without them, and links the SSR with hydration guide for the second

#### Scenario: SSR with hydration

- **WHEN** a reader opens the SSR with hydration guide
- **THEN** it says in a warning box that only `liveDomRenderer()` keeps the server's elements, while the default renderer, `adopt: false`, the 1.x classes and converted 1.x plugins draw a new chart over them; and it explains `renderForHydration()`, the cause `hydrate` and `hydration.repaired` with examples of what causes repairs and what can't be repaired, how the server's size compared with the container's changes what readers see at the takeover, why the server can't know a reader's width and what that leaves (one common size, client hints or a cookie per request), that the container needs a height or an `aspect-ratio`, that the markup needs Chartist's stylesheet and passes a strict style policy, and the warning when markup is replaced; with a live example whose page holds server markup that the chart takes over, and that shows what each render changed and how many of the server's elements are still in the chart

#### Scenario: Charts in frameworks

- **WHEN** a reader opens the charts in frameworks guide
- **THEN** it states the rule every framework integration follows (render the server markup into the container once and never again, create the chart after the framework's hydration, update it through its handle, destroy it on unmount), shows a recipe each for React, Vue, Angular and Svelte with the trap of that framework's raw-HTML feature, says that the Svelte recipe keeps a constant non-empty placeholder in the browser because an empty `{@html}` value makes Svelte re-mount the app, and links the SSR with hydration guide for the markup itself

#### Scenario: Terminal examples

- **WHEN** a reader opens a terminal example
- **THEN** its code adds the text art with `format: 'element'`, not with `innerHTML`

#### Scenario: Live updates

- **WHEN** a reader opens the live updates guide
- **THEN** its first live example is a chart drawn with `liveDomRenderer({ key: 'label', animations: smilAnimations() })`, fed with a new value every second, that shows below it how many elements each update added, updated and removed; further live examples show animated bars, an animated pie and gauge, a stream of several updates per second, and one update that changes the data and the layers together; and it explains importing `chartist/live` (with a bundler and from a CDN), identity and the `key` option, the changes and `cause` in `mount`, cleanup functions, the default animation timing, and what live updates add to the bundle

#### Scenario: Cleanup in the plugins guide

- **WHEN** a reader opens the events and plugins guide
- **THEN** it shows a plugin that returns a cleanup function from `install`, and a `mount` listener that acts on added elements or returns a cleanup function

#### Scenario: Plugins for live updates

- **WHEN** a reader opens the events and plugins guide
- **THEN** a section on plugins for live updates covers keys for a plugin's own nodes, acting on `add` changes, cleanup, plugin keyframes and the animation timing in `mount`, with a live example of a small v2 tooltip plugin that keeps working while its chart gets new values every second

## ADDED Requirements

### Requirement: Server markup in examples

An example whose page holds server markup for a chart to take over SHALL get that markup from `renderForHydration()` of the example's own config, written into its HTML by a script. A check SHALL fail when the markup in the HTML differs from what the current build renders, so the example can't drift from the library.

#### Scenario: A stale example

- **WHEN** a change to the library changes the markup of the hydration example's chart, and the example's HTML isn't regenerated
- **THEN** the docs check fails and names the example

### Requirement: Server-rendered hero chart

The landing page's hero chart SHALL be in the page's HTML as hydration markup, rendered with `renderForHydration()` when the site is built, at the size the hero's board has on a desktop. In the browser, the chart SHALL take that markup over with `liveDomRenderer()`, keeping its elements, so the hero shows its chart without JavaScript and its draw-in animation runs from the first paint without starting again.

#### Scenario: The hero without JavaScript

- **WHEN** the landing page is loaded without JavaScript
- **THEN** the hero's board shows the line chart

#### Scenario: The hero taken over

- **WHEN** the landing page loads
- **THEN** the hero's chart keeps the svg from the page's HTML, the `data-ct-hydrate` marker is gone, and Chartist logs nothing
