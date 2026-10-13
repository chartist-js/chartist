# Spec Delta

## ADDED Requirements

### Requirement: Static site built with Nx

The documentation site SHALL be a static Astro app in `apps/docs`, built through Nx (`pnpm nx build docs`) against the workspace build of `chartist`, so the site always uses the current library.

#### Scenario: Build

- **WHEN** `pnpm nx build docs` runs in a clean checkout
- **THEN** `chartist` is built first and the site is written as static files

### Requirement: Brand design system

The site SHALL implement the design tokens and components of `docs/visual-design` (palette, semantic tokens for light and dark, typography, spacing, radii, shadows, motion). Fonts SHALL be self-hosted; pages SHALL make no requests to third-party hosts.

#### Scenario: No third-party requests

- **WHEN** any page of the built site loads
- **THEN** every request goes to the site's own origin

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
