# Spec Delta

## Purpose

Defines what the published `chartist` npm package contains and how it can be consumed: with a bundler, in Node, or directly in a browser without any build step, including styles, Sass sources, types and size budgets.

## ADDED Requirements

### Requirement: Bundler ESM build

The package SHALL ship an unminified ES module build at `dist/index.js` that exposes every public export of the library, has no runtime dependencies and is marked side-effect free so bundlers can tree-shake unused charts.

#### Scenario: Named import in a bundler

- **WHEN** a bundled application imports `{ LineChart }` from `chartist`
- **THEN** the import resolves to `dist/index.js` and the bundle does not contain the bar or pie chart code

### Requirement: Browser ESM build

The package SHALL ship a minified, self-contained ES module at `dist/index.min.js` that a browser can load directly with `<script type="module">` or `import` from a CDN, without a bundler, import map or other files.

#### Scenario: Module script from a CDN

- **WHEN** an HTML page without a build step runs `import { LineChart } from 'https://cdn.jsdelivr.net/npm/chartist/dist/index.min.js'` and creates a chart on a container
- **THEN** the chart renders as SVG in the container

### Requirement: UMD build with global

The package SHALL ship a minified UMD build at `dist/index.umd.js` that defines the global `Chartist` with all public exports when loaded by a classic `<script>` tag. The same build SHALL also be published at `dist/chartist.min.js`.

#### Scenario: Classic script tag

- **WHEN** an HTML page loads `dist/index.umd.js` with a classic `<script>` tag and calls `new Chartist.BarChart(...)`
- **THEN** the chart renders as SVG

#### Scenario: 0.x file name

- **WHEN** a page loads `dist/chartist.min.js` with a classic `<script>` tag
- **THEN** the global `Chartist` is defined with the same exports as `dist/index.umd.js`

### Requirement: CommonJS build

The package SHALL ship a CommonJS build at `dist/index.cjs` that `require('chartist')` resolves to and that can be loaded in Node without a DOM.

#### Scenario: Require in Node

- **WHEN** a CommonJS module in Node calls `require('chartist')`
- **THEN** it receives an object with the public exports, including `LineChart`, `BarChart`, `PieChart` and `Interpolation`

### Requirement: Type declarations

The package SHALL ship TypeScript declarations for both module systems: `dist/index.d.ts` for `import` and `dist/index.d.cts` for `require`, wired through the `types` conditions of the `exports` map. Every public type SHALL be importable from the package root.

#### Scenario: Types for ESM and CJS consumers

- **WHEN** a TypeScript project with `moduleResolution` `node16`, `nodenext` or `bundler` imports or requires `chartist`
- **THEN** TypeScript resolves the declarations for that module system without falling back to `any`

### Requirement: Compiled CSS

The package SHALL ship the compiled default styles as readable CSS at `dist/index.css` and as minified CSS at `dist/index.min.css`. The minified CSS SHALL also be published at `dist/chartist.min.css`.

#### Scenario: Stylesheet link without a build step

- **WHEN** an HTML page links `dist/index.css` or `dist/index.min.css` from a CDN
- **THEN** the chart elements get the default Chartist styles

### Requirement: Sass sources

The package SHALL ship the Sass sources in `dist/scss/` (entry `index.scss`, variables in `_settings.scss`) so users can override `!default` variables and compile their own styles. The 1.x entry points `dist/index.scss` and `dist/_settings.scss` SHALL keep working.

#### Scenario: Custom variables with the package importer

- **WHEN** a Sass file sets `$ct-series-colors` and then loads `pkg:chartist` (or `chartist/scss/index`) with Sass's Node package importer
- **THEN** the compiled CSS uses the custom series colors

#### Scenario: 1.x Sass path

- **WHEN** a Sass file imports `chartist/dist/index` with `node_modules` on the load path
- **THEN** it compiles to the same CSS rules as the `dist/scss/index.scss` entry

### Requirement: Self-contained source maps

Every published source map SHALL embed the content of its sources and SHALL NOT require files that are not part of the published package.

#### Scenario: Source map loader in a bundler

- **WHEN** a bundler with a source-map loader processes `dist/index.css` or any JS build
- **THEN** it does not report missing source files

### Requirement: Exports map

The package SHALL define an `exports` map with: the root entry (`types`, `import`, `require`, plus `style` and `sass` conditions for style-aware resolvers), `./styles.css` (readable CSS), `./scss/*` (Sass sources), `./package.json` and `./dist/*` (every file in `dist`). Paths not listed SHALL NOT be importable.

#### Scenario: Stylesheet subpath

- **WHEN** an application imports `chartist/styles.css`
- **THEN** it resolves to `dist/index.css`

#### Scenario: CSS import through the style condition

- **WHEN** a CSS tool that resolves with the `style` condition processes `@import "chartist"`
- **THEN** it resolves to `dist/index.css`

### Requirement: 1.x import paths stay valid

Every import path and package field that worked with the published 1.x package SHALL keep resolving to a file with the same format: `chartist` (import and require), `chartist/dist/*` (including `index.js`, `index.cjs`, `index.umd.js`, `index.css`, `index.scss`, `_settings.scss`, `index.d.ts`) and the `main`, `module`, `types`, `style`, `unpkg` and `jsdelivr` fields.

#### Scenario: 1.x CSS path

- **WHEN** an application imports `chartist/dist/index.css`
- **THEN** it resolves to the compiled CSS

#### Scenario: 1.x deep JS paths

- **WHEN** an application imports `chartist/dist/index.js` or requires `chartist/dist/index.cjs`
- **THEN** it receives the ESM or CJS build respectively

### Requirement: Bare CDN URLs serve the UMD build

The `unpkg` and `jsdelivr` package fields SHALL point to the minified UMD build so that `https://cdn.jsdelivr.net/npm/chartist` and `https://unpkg.com/chartist` keep working in a classic `<script>` tag, as in 1.x.

#### Scenario: Bare jsDelivr URL

- **WHEN** a page loads `https://cdn.jsdelivr.net/npm/chartist` with a classic `<script>` tag
- **THEN** the CDN serves `dist/index.umd.js` and the global `Chartist` is defined

### Requirement: Size budgets

The build SHALL be checked against gzip size budgets for at least: the browser ESM build, the UMD build, a tree-shaken import of each chart type (`LineChart`, `BarChart`, `PieChart`) and the minified CSS. The check SHALL fail when a file exceeds its budget.

#### Scenario: Budget exceeded

- **WHEN** a change makes `dist/index.min.js` larger than its gzip budget
- **THEN** the size check target fails and reports the file and the overshoot

### Requirement: No-bundler smoke test

The package SHALL have an automated test that opens plain HTML pages (no bundler, no import map) in a real browser, loads the UMD build and the browser ESM build the way the published standalone examples do, and asserts that charts render.

#### Scenario: Standalone examples render

- **WHEN** the smoke test opens the UMD and ESM standalone example pages against the freshly built `dist`
- **THEN** each page renders its charts as SVG with the expected series elements and no page errors
