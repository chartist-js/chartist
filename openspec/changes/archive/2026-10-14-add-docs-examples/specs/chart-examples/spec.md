## MODIFIED Requirements

### Requirement: Examples are small Vite-style projects

Each example SHALL be a folder laid out like an `npm create vite` vanilla TypeScript starter:

- an `index.html` that loads `/src/main.ts` with `<script type="module">` and provides the chart container;
- a `src/main.ts` that imports from the package `chartist` and uses the functional API;
- for examples that come from 1.x, a `src/main.classic.ts` with the 1.x code that draws the same chart with the classic API;
- optionally a `src/style.css`, imported from the entry.

The example SHALL run unchanged as a Vite app with `chartist` installed. It SHALL contain no test-, fixture- or docs-specific code.

#### Scenario: Running an example as a Vite app

- **WHEN** an example folder is copied into a new Vite project that has `chartist` installed, and the dev server is started
- **THEN** the chart renders without errors

#### Scenario: Example source contains no harness code

- **WHEN** the files of any example are displayed
- **THEN** they contain only code a user would write for that chart

#### Scenario: Functional first

- **WHEN** the `src/main.ts` of any example is displayed
- **THEN** it creates the chart with `lineChart()`, `barChart()`, `pieChart()` or `chart()`, not with a chart class

### Requirement: Example manifest

The examples package SHALL export a typed manifest with one entry per example. Each entry holds a unique id, a title, an optional one-sentence description, the chart type, the example folder, and these flags:

- whether the example is meant for the docs or for tests only;
- whether it has a classic (1.x) entry;
- whether its classic entry needs the v2 compat plugin;
- which viewports it is tested at;
- how its animations settle.

#### Scenario: Listing examples

- **WHEN** a consumer imports the manifest
- **THEN** it receives every example with these fields, and every folder contains `index.html` and `src/main.ts`, plus `src/main.classic.ts` when the classic flag is set
