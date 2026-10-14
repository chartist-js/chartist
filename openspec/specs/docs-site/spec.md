# docs-site Specification

## Purpose

Defines the Chartist documentation website: how it is built, its design system and themes, live charts, the docs layout and content pipeline, and its accessibility.

## Requirements

### Requirement: Static site built with Nx

The documentation site SHALL be a static Astro app in `apps/docs`, built through Nx (`pnpm nx build docs`) against the workspace build of `chartist`, so the site always uses the current library.

#### Scenario: Build

- **WHEN** `pnpm nx build docs` runs in a clean checkout
- **THEN** `chartist` is built first and the site is written as static files

### Requirement: Brand design system

The site SHALL implement the design tokens and components of `docs/visual-design` (palette, semantic tokens for light and dark, typography, spacing, radii, shadows, motion). The tokens SHALL be defined once as CSS custom properties and exposed as the Tailwind theme, and components SHALL be styled with Tailwind utilities from that theme. Animations, scroll timelines, the chart theme (`--ct-*`) and styles for generated HTML (MDX prose, code highlighting, the editor) SHALL stay plain CSS. Fonts SHALL be self-hosted; pages SHALL make no requests to third-party hosts.

#### Scenario: No third-party requests

- **WHEN** any page of the built site loads
- **THEN** every request goes to the site's own origin

#### Scenario: One source for colors

- **WHEN** a token in `tokens.css` changes
- **THEN** every utility class that uses it changes with it, in light and dark mode, without editing components

### Requirement: Light and dark mode

The site SHALL use the light theme by default, regardless of the OS color scheme, and offer a toggle whose choice persists across pages and visits. The saved theme SHALL apply before the first paint, and the page SHALL declare the matching `color-scheme`.

#### Scenario: Light by default

- **WHEN** a first-time visitor whose OS uses dark mode opens the site
- **THEN** the site renders in the light theme

#### Scenario: Toggle persists

- **WHEN** a visitor switches to dark mode and opens another page
- **THEN** that page renders dark from the first paint, with `color-scheme: dark`

### Requirement: Live Chartist charts

Every chart on the site SHALL be rendered by Chartist with the functional API and themed only through the library's `--ct-*` custom properties, in a box whose size is reserved before the chart renders.

#### Scenario: Chart in dark mode

- **WHEN** a page with a chart is shown in dark mode
- **THEN** the chart's labels and grid use the dark tokens, without re-rendering the chart

#### Scenario: No layout shift

- **WHEN** a page with charts loads
- **THEN** the charts render into their reserved boxes without moving other content

### Requirement: Docs layout and content

Docs pages SHALL come from an MDX content collection and render in a layout with a sidebar built from the collection, an on-page table of contents, previous and next links, an "Edit this page on GitHub" link, a mobile menu, and a version switcher linking to the v1 and v0 docs.

#### Scenario: Navigation from content

- **WHEN** a new MDX page with a group and order is added to the collection
- **THEN** it appears in the sidebar at that place and in the previous and next links of its neighbors

### Requirement: Getting started without a bundler

The Getting started page SHALL first show a no-bundler setup (a `<script type="module">` importing Chartist from a CDN and the stylesheet link), then npm, using the functional API and the package's real paths, with a live chart.

#### Scenario: Copied snippet works

- **WHEN** the page's HTML snippet is saved as a file and opened in a browser
- **THEN** it renders the chart shown on the page

### Requirement: Accessible pages

Every page SHALL pass automated WCAG AA checks, be fully usable with the keyboard with visible focus, and replace motion with a calm alternative when `prefers-reduced-motion` is set.

#### Scenario: Automated checks

- **WHEN** the e2e suite runs axe on every page in light and dark mode
- **THEN** it reports no violations

### Requirement: Not found page

Unknown paths SHALL show a 404 page with the mascot and links back to the docs and the home page.

#### Scenario: Unknown path

- **WHEN** a visitor opens a path that doesn't exist
- **THEN** the 404 page with the `lost` mascot is shown

### Requirement: Landing page

The home page SHALL present Chartist as in the approved design: hero with the mascot and a live chart, numbers, a scroll story whose easel chart changes per chapter, features with live demos, the rendering pipeline with a plugin demo, a gallery, an inline live editor, responsive and animation showcases, the comparison, the ecosystem, community and sponsor, and a finale. All charts on it SHALL be rendered by Chartist, and all code samples SHALL use the v2 API as it exists.

#### Scenario: Story chapters

- **WHEN** a visitor scrolls the story so that the "Bars" chapter is in view
- **THEN** the mascot's board shows a bar chart rendered by Chartist and the chapter navigation marks the story section as current

#### Scenario: Code samples run

- **WHEN** a code sample from the landing page is run against the current build
- **THEN** it executes without errors and draws the chart it describes

### Requirement: Sourced facts

Numbers and comparison values on the site SHALL come from a committed, dated snapshot produced by a script from their sources (npm, GitHub, measurements, the libraries' documentation), never typed into pages. The page SHALL show the snapshot date, and the build SHALL fail if a value is missing.

#### Scenario: No placeholders

- **WHEN** the site is built
- **THEN** no page contains a placeholder such as `[N]`, `[MEASURED]` or `[DATE]`, and the shown numbers equal those in the snapshot

### Requirement: Used by

The landing page SHALL show a "Used by" list mirroring GitHub's public dependents of the Chartist repository, filtered to organizations, where every entry links to the public repository that depends on Chartist. Entries SHALL be removable through an exclude list.

#### Scenario: Entry with evidence

- **WHEN** the "Used by" list is rendered
- **THEN** each entry shows the organization's name and links to a public repository whose dependency on Chartist GitHub reports

### Requirement: Fair comparison

The comparison with Chart.js, ApexCharts and Highcharts SHALL show measured bundle sizes with the method and date, and feature and license rows whose sources are listed once per library, linked. It SHALL include rows where the other libraries offer more.

#### Scenario: Reproducible sizes

- **WHEN** the facts script runs twice with the same pinned versions
- **THEN** it reports the same bundle sizes

### Requirement: Inline live example

Docs pages and the landing page SHALL be able to embed a live example: an editor next to a live chart that re-renders as the code changes, running in the page without third-party services, with copy and reset actions.

#### Scenario: Editing redraws

- **WHEN** a visitor changes a number in the live example's data
- **THEN** the chart re-renders with the new value without a page reload

### Requirement: Motion with calm alternatives

Scroll-driven and decorative motion on the site SHALL use CSS where possible and SHALL have a static alternative under `prefers-reduced-motion: reduce` that keeps all content and controls available.

#### Scenario: Reduced motion

- **WHEN** the landing page is opened with reduced motion
- **THEN** no animation runs, charts are shown fully drawn, and the SMIL showcase is replaced by a static chart

### Requirement: Site screenshot comparison

The site SHALL have a target that captures the landing sections, the first live example in edit mode, Getting started and the 404 page at a desktop and a phone width, in light and dark mode, with motion settled, and compares them with a baseline taken on demand, reporting each differing screenshot with before, after and diff images.

#### Scenario: A style change shows up

- **WHEN** a change alters how a section looks and the comparison runs against the baseline from before the change
- **THEN** the report lists that section's screenshots with their differences, and unchanged sections are not listed

### Requirement: Guides and chart type pages

The docs SHALL have pages for each chart type (line, bar, pie and donut, composed) and guides for data and options, sizing, styling with CSS, responsive options, axes and scales, animations, events and plugins, server rendering, and updating charts. They SHALL use the functional API, show at least one live example each, and follow the writing guide in `apps/docs/WRITING.md`.

#### Scenario: A guide runs as written

- **WHEN** a reader opens a guide and presses Edit on its live example
- **THEN** the example runs against the current build and the chart re-renders as the code changes

### Requirement: Migration guide

The docs SHALL have a guide for 1.x users that says what keeps working unchanged, how to move to the functional API, how to keep 1.x events (`compat`) and 1.x plugins (`fromLegacyPlugin`), that UMD ships for backwards compatibility only, and what was removed.

#### Scenario: Class code is shown only here

- **WHEN** the docs pages are searched for `new LineChart`, `new BarChart` or `new PieChart`
- **THEN** they appear only on the migration guide

### Requirement: Experimental features are marked

Docs for experimental or polyfill-dependent features SHALL say so at the start of their section, name what they need, and link the relevant standards discussion.

#### Scenario: Container queries

- **WHEN** a reader opens the container queries section
- **THEN** a warning says `container()` is experimental, needs the `match-container` polyfill until browsers ship `Element.matchContainer()`, and links csswg-drafts#6205

### Requirement: Checked code samples

TypeScript code blocks in docs pages SHALL be type-checked against Chartist's published types as part of the docs check, unless explicitly marked as not checked, and every live example SHALL render without console errors in the end-to-end tests.

#### Scenario: A sample drifts from the API

- **WHEN** a docs page uses an option or function that Chartist's types don't have, in a checked code block
- **THEN** the docs check fails and names the page and block

### Requirement: Examples gallery

The site SHALL have a gallery of every docs example in the examples package, grouped by chart type and filterable by it, with a live thumbnail and the title of each example, linking to the example's page.

#### Scenario: Filtering

- **WHEN** a visitor picks a chart type on the gallery
- **THEN** only that type's examples are shown, and the choice can be undone

### Requirement: Example pages

Each docs example SHALL have a page with its title, description, an editable live example of its functional entry, its classic entry (when it has one) for comparison, a link to the full-screen playground, and links to the previous and next example of its type.

#### Scenario: Comparing with 1.x

- **WHEN** a visitor opens an example that comes from 1.x
- **THEN** they can see the classic code that draws the same chart next to the functional code

### Requirement: Full-screen playground

The site SHALL have a full-screen playground with the editor, the live preview, errors and console output, reset, and an export to StackBlitz. It SHALL open an example by id, or any set of files encoded in the address, from the URL fragment. After the code is edited, the address SHALL follow the edits, and a share action SHALL copy it. Live examples SHALL open in this playground with their current files.

#### Scenario: Opening an example

- **WHEN** a visitor follows an example's "Open in playground" link
- **THEN** the playground opens with that example's files and renders it

#### Scenario: Sharing edited code

- **WHEN** a visitor edits the code, presses Share, and someone else opens the copied address
- **THEN** the playground opens with the edited files and renders them

#### Scenario: A broken address

- **WHEN** the code in the address can't be decoded
- **THEN** the playground says so and opens a blank chart

### Requirement: Typed live examples

The site SHALL serve the type declarations of the Chartist build its live examples run, from its own origin, and its live examples, example pages and full-screen playground SHALL use them for type-aware editing.

#### Scenario: Editing a live example

- **WHEN** a reader edits a live example and starts typing the name of a Chartist function it imports
- **THEN** the editor completes it and shows its signature, and no request leaves the site's origin

### Requirement: API reference

The site SHALL have an API reference generated from the library's TypeScript source and doc comments at build time, grouped into pages by area, in the site's own design. Each entry SHALL show its signature, description, parameters, return value, properties, examples and related links, and SHALL mark experimental, deprecated and 1.x exports.

#### Scenario: Looking up an option

- **WHEN** a reader opens the line chart's options in the reference
- **THEN** each option shows its type, its default and what it does, and `axisX` lists the axis options with theirs

### Requirement: Linked types and code defaults

Type names in signatures and property tables SHALL link to their entries. Option properties of the presets SHALL show their defaults, taken from the library's defaults rather than written by hand.

#### Scenario: Following a type

- **WHEN** a reader clicks `ChartPlugin` in the signature of `withOptions`
- **THEN** the page shows the `ChartPlugin` entry

#### Scenario: A 1.x class

- **WHEN** a reader looks up `LineChart`
- **THEN** a short entry describes it as the 1.x class and links to `lineChart`

### Requirement: The reference is complete

Every export of `chartist` and `chartist/compat` SHALL appear on exactly one reference page. The docs check SHALL fail when an export has no entry or more than one, or when a reference link points nowhere.

#### Scenario: A new export

- **WHEN** the library exports a new function and the docs are checked
- **THEN** the check fails until the function has an entry
