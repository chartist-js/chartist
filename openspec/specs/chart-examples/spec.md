# chart-examples Specification

## Purpose

Provides one shared set of Chartist examples, written as small HTML + TypeScript + CSS projects, that the docs site, the live playground and the visual regression tests all use.

## Requirements

### Requirement: Examples are small Vite-style projects

Each example SHALL be a folder laid out like an `npm create vite` vanilla TypeScript starter:

- an `index.html` that loads `/src/main.ts` with `<script type="module">` and provides the chart container;
- a `src/main.ts` that imports from the package `chartist`;
- optionally a `src/style.css`, imported from `src/main.ts`.

The example SHALL run unchanged as a Vite app with `chartist` installed. It SHALL contain no test-, fixture- or docs-specific code.

#### Scenario: Running an example as a Vite app

- **WHEN** an example folder is copied into a new Vite project that has `chartist` installed, and the dev server is started
- **THEN** the chart renders without errors

#### Scenario: Example source contains no harness code

- **WHEN** the files of any example are displayed
- **THEN** they contain only code a user would write for that chart

### Requirement: Examples are type-checked

Every example's TypeScript SHALL type-check in strict mode against the type declarations of the `chartist` package. A type error in any example SHALL fail the examples' type-check task.

#### Scenario: Wrong option name

- **WHEN** an example passes `{ showAreas: true }` to `LineChart`
- **THEN** the type check fails and names the example file

### Requirement: Example manifest

The examples package SHALL export a typed manifest with one entry per example. Each entry holds a unique id, a title, the chart type, the example folder, and these flags:

- whether the example is meant for the docs or for tests only;
- whether it needs the v2 compat plugin;
- which viewports it is tested at;
- how its animations settle.

#### Scenario: Listing examples

- **WHEN** a consumer imports the manifest
- **THEN** it receives every example with these fields, and every folder contains `index.html` and `src/main.ts`

### Requirement: Coverage of 1.x examples

The package SHALL contain an example for every 1.x CodeSandbox example and for every 1.x Storybook story case, including each story's extra viewports. Story cases identical to a sandbox in data, options and event handlers SHALL be merged into that example. Other story cases SHALL be marked as test-only.

#### Scenario: No story case lost

- **WHEN** the 1.x stories are compared with the manifest
- **THEN** every story maps to an example id, and every story viewport appears in that example's viewports

### Requirement: Deterministic rendering

Rendering an example twice with the same Chartist build, viewport and settle time SHALL produce identical output. Examples that show random data SHALL use a seeded pseudo-random generator.

#### Scenario: Random scatter example

- **WHEN** the scatter example renders twice in a fresh page
- **THEN** both renders show the same points

### Requirement: Compat marking

Every example that registers a 1.x event listener (`data`, `optionsChanged`, `draw`, `created`, `animationBegin`, `animationEnd`) or uses the 1.x `Svg` API SHALL be marked as needing the compat plugin in v2.

#### Scenario: Draw-event example

- **WHEN** an example calls `chart.on('draw', ...)`
- **THEN** its manifest entry is marked as needing compat

### Requirement: History-preserving migration

The 1.x sandbox sources SHALL move into the examples package in commits that contain only renames. Content changes SHALL follow in separate commits, so that `git log --follow` on an example file reaches its 1.x history.

#### Scenario: Following history

- **WHEN** `git log --follow` is run on a migrated `src/main.ts`
- **THEN** the log includes commits from before the move
