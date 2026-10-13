# Spec Delta

## ADDED Requirements

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

The comparison with Chart.js, ApexCharts and Highcharts SHALL show measured bundle sizes with the method and date, and feature and license rows with a source link per value. It SHALL include rows where the other libraries offer more.

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
