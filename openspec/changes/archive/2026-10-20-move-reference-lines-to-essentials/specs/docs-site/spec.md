## MODIFIED Requirements

### Requirement: Guides and chart type pages

The docs SHALL have pages for each chart type (line, bar, pie and donut, composed) and guides for data and options, sizing, styling with CSS, responsive options, axes and scales, bands, animations, events and plugins, custom layers, server rendering, SSR with hydration, charts in frameworks, live updates, and security and CSP. They SHALL use the functional API, show at least one live example each, and follow the writing guide in `apps/docs/WRITING.md`. Guides and examples SHALL NOT put chart output into a page with `innerHTML`; they SHALL use the DOM renderer or an element output. The one exception is the framework recipes in the charts in frameworks guide: they MAY hand server markup to a framework's own raw-HTML feature (`dangerouslySetInnerHTML`, `v-html`, `{@html}`, a host element's `innerHTML` on the server), which is how frameworks put server-rendered HTML into a page, and they SHALL say that the browser never sets it again. The docs navigation SHALL list the pages from first steps to advanced topics, in the groups Start here, Chart types, Basics (data and options, axes and scales, sizing, styling, responsive options, animations, bands) and Advanced (live updates, events and plugins, custom layers, server rendering, SSR with hydration, charts in frameworks, security and CSP).

#### Scenario: A guide runs as written

- **WHEN** a reader opens a guide and presses Edit on its live example
- **THEN** the example runs against the current build and the chart re-renders as the code changes

#### Scenario: Target lines and bands on a preset

- **WHEN** a reader opens the bands guide at `/docs/bands/` and the essentials pages for target and trend lines
- **THEN** the bands guide shows a band added to a preset with the `layers` option and a band chart with a band and lines on top, importing `band()` from `chartist`, the target lines page shows a target line added to a preset, importing it from `@chartist-js/essentials`, all live, and the bands guide links both pages

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
- **THEN** it states the rule every framework integration follows (render the server markup into the container once and never again, create the chart after the framework's hydration, update it through its handle, destroy it on unmount), shows a recipe each for React, Vue, Angular and Svelte with the trap of that framework's raw-HTML feature, says that the Svelte recipe keeps a constant non-empty placeholder in the browser because an empty `{@html}` value makes Svelte re-mount the app, links the SSR with hydration guide for the markup itself, and lists the community wrappers with the Chartist version each is built for, the npm `overrides` entry that lets a wrapper built for 1.x install next to v2, and that wrappers built for 0.x need Chartist 0.x

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

### Requirement: Experimental features are marked

Docs for experimental or polyfill-dependent features SHALL say so at the start of their section, name what they need or why they may still change, and link the relevant standards discussion where there is one. Stable APIs SHALL NOT carry experimental marks in the guides. The API reference SHALL explain what its experimental badge means: the export may still change in a 2.x minor.

#### Scenario: Container queries

- **WHEN** a reader opens the container queries section
- **THEN** a warning says `container()` is experimental, needs the `match-container` polyfill until browsers ship `Element.matchContainer()`, and links csswg-drafts#6205

#### Scenario: Live updates

- **WHEN** a reader opens the live updates guide
- **THEN** it says that `chartist/live` is experimental: new with 2.0, it may still change in a 2.x minor before it becomes stable

#### Scenario: Stable composition

- **WHEN** a reader opens the composed charts, custom layers or bands guide
- **THEN** none of them says the functional API, the layer contract or the layers are experimental

### Requirement: Plugins the core replaces

A plugin whose use case the core covers SHALL NOT be listed on the plugins page. When its page was published, its URL SHALL redirect to the docs page that covers the use case. A plugin that an official `@chartist-js` package replaces SHALL NOT be listed either, and its page and live example SHALL be removed from the site without a redirect. Every link to such a removed page, within the site, in its tests and in the redirect pages for the 0.x site, SHALL point to the package's docs instead, so no link of the site leads to a removed page.

#### Scenario: The target line plugin

- **WHEN** a visitor opens `/plugins/chartist-plugin-targetline/`
- **THEN** they land on the essentials page for target lines, and the plugins overview has no tile for `chartist-plugin-targetline`

#### Scenario: The tooltip plugins

- **WHEN** the site is built
- **THEN** it has no page and no redirect page at `/plugins/chartist-plugin-tooltips/` or `/plugins/stklcode-chartist-plugin-tooltips/`, and the plugins overview has no tooltip tile

#### Scenario: The 0.x tooltip example

- **WHEN** the 0.x redirect table is read for the old plugins page's `#tooltip-plugin` or `#example-plugin-tooltip` anchor
- **THEN** its target is `/packages/tooltips/`, a page of the built site
