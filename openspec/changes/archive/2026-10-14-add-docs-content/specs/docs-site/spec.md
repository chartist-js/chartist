## ADDED Requirements

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
