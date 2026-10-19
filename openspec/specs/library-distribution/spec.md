# library-distribution Specification

## Purpose

Defines what the published `chartist` npm package contains and how it can be consumed: with a bundler, in Node, or directly in a browser without any build step, including styles, Sass sources, types and size budgets.

## Requirements

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

The package SHALL define an `exports` map with: the root entry (`types`, `import`, `require`, plus `style` and `sass` conditions for style-aware resolvers), `./compat` (`types`, `import`, `require`), `./live` (`types`, `import`, `require`), `./server` (`types`, `import`, `require`), `./styles.css` (readable CSS), `./themes/*` (theme stylesheets), `./scss/*` (Sass sources), `./package.json` and `./dist/*` (every file in `dist`). Paths not listed SHALL NOT be importable.

#### Scenario: Stylesheet subpath

- **WHEN** an application imports `chartist/styles.css`
- **THEN** it resolves to `dist/index.css`

#### Scenario: CSS import through the style condition

- **WHEN** a CSS tool that resolves with the `style` condition processes `@import "chartist"`
- **THEN** it resolves to `dist/index.css`

#### Scenario: Compat subpath

- **WHEN** an application imports `{ compat }` from `chartist/compat`
- **THEN** it resolves to `dist/compat.js` (import) or `dist/compat.cjs` (require), and the core it uses is the same module instance as `chartist`

#### Scenario: Live subpath

- **WHEN** an application imports `{ liveDomRenderer }` from `chartist/live`
- **THEN** it resolves to `dist/live.js` (import) or `dist/live.cjs` (require), and the core it uses is the same module instance as `chartist`

#### Scenario: Server subpath

- **WHEN** an application imports `{ renderToString }` from `chartist/server`
- **THEN** it resolves to `dist/server.js` (import) or `dist/server.cjs` (require), and the core it uses is the same module instance as `chartist`

#### Scenario: Theme subpath

- **WHEN** an application imports `chartist/themes/accessible.css`
- **THEN** it resolves to `dist/themes/accessible.css`, and `dist/themes/accessible.min.css` exists for CDN links

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

The build SHALL be checked against gzip size budgets for at least: the browser ESM build, the UMD build, a tree-shaken import of each chart type (`LineChart`, `BarChart`, `PieChart`), the browser ESM build of `chartist/live` without the core, a tree-shaken import of `liveDomRenderer` alone and with `smilAnimations`, the browser ESM build of `chartist/server` without the core, a tree-shaken import of `renderToString` and of `applyStyles` from `chartist/server`, and the minified CSS. The check SHALL fail when a file exceeds its budget.

#### Scenario: Budget exceeded

- **WHEN** a change makes `dist/index.min.js` larger than its gzip budget
- **THEN** the size check target fails and reports the file and the overshoot

#### Scenario: Live updates stay out of the core

- **WHEN** the size check measures a tree-shaken import of `lineChart` from `chartist`
- **THEN** its size grows by at most 0.65 kB gzipped over rc.3 (13.65 kB), and it contains none of the live renderer's code

#### Scenario: Hydration stays mostly out of the core

- **WHEN** the size check measures a tree-shaken import of `lineChart` from `chartist` after hydration is added
- **THEN** it is at most 0.3 kB gzipped larger than in 2.0.0 (14.28 kB), and it contains none of the code that adopts markup, which ships with `chartist/live`

#### Scenario: Server code out of the core

- **WHEN** the size check measures `dist/index.min.js` after `renderToString` and `renderForHydration` moved to `chartist/server`
- **THEN** it is smaller than in 2.0.0 (27.62 kB gzipped), and none of the core builds contains the SVG serializer or `applyStyles`

### Requirement: No-bundler smoke test

The package SHALL have an automated test that opens plain HTML pages (no bundler, no import map) in a real browser, loads the UMD build and the browser ESM build the way the published standalone examples do, and asserts that charts render.

#### Scenario: Standalone examples render

- **WHEN** the smoke test opens the UMD and ESM standalone example pages against the freshly built `dist`
- **THEN** each page renders its charts as SVG with the expected series elements and no page errors

### Requirement: Compat builds for every format

The compat plugin SHALL ship as ESM (`dist/compat.js`), CJS (`dist/compat.cjs`), browser ESM (`dist/compat.min.js`, importing `./index.min.js`) and UMD (`dist/compat.umd.js`). The UMD build SHALL add `compat` to the global `Chartist` defined by `dist/index.umd.js`. No compat build SHALL contain a second copy of the core.

#### Scenario: Classic script tags

- **WHEN** a page loads `dist/index.umd.js` and then `dist/compat.umd.js` with classic `<script>` tags
- **THEN** `Chartist.compat` is defined, and `new Chartist.LineChart(el, data, { plugins: [Chartist.compat] })` emits 1.x `draw` events

#### Scenario: Browser module

- **WHEN** a page imports `compat` from `dist/compat.min.js` and `LineChart` from `dist/index.min.js`
- **THEN** the chart with the compat plugin emits 1.x `draw` events

### Requirement: Published package contents

The published `chartist` package SHALL contain its `package.json`, a README, the licenses (`LICENSE-MIT`, `LICENSE-WTFPL`) and the built `dist` folder, and nothing else: no sources, tests or configuration. It SHALL be published from the project folder as built, without a copy step that rewrites the package.

#### Scenario: Packed tarball

- **WHEN** the package is packed as it would be published
- **THEN** the tarball holds `package.json`, `README.md`, the two licenses and `dist/`, and every path of the `exports` map and the package fields points to a file in it

### Requirement: Package README

The package SHALL have a README for its npm page: what Chartist is, how to install it (with the npm `next` tag while v2 is in release candidates), a short example with the functional API, links to the docs, the 1.x docs and the changelog, the community wrappers, and the license.

#### Scenario: npm page

- **WHEN** a release candidate is published
- **THEN** its npm page shows the README with the v2 install instructions and a link to chartist.dev

### Requirement: Package metadata for publishing

The package's `repository` field SHALL name `https://github.com/chartist-js/chartist` with the `packages/chartist` directory, as npm trusted publishing and provenance compare it with the publishing repository.

#### Scenario: Repository field

- **WHEN** the package's `package.json` is read
- **THEN** `repository.url` is the Chartist GitHub repository and `repository.directory` is `packages/chartist`

### Requirement: Server builds for every format

`chartist/server` SHALL ship as ESM (`dist/server.js`), CJS (`dist/server.cjs`), browser ESM (`dist/server.min.js`, importing `./index.min.js`) and UMD (`dist/server.umd.js`, adding its exports to the global `Chartist` defined by `dist/index.umd.js`), with type declarations for both module systems. No server build SHALL contain a second copy of the core.

#### Scenario: Classic script tags

- **WHEN** a page loads `dist/index.umd.js` and then `dist/server.umd.js` with classic `<script>` tags
- **THEN** `Chartist.renderToString` and `Chartist.applyStyles` are defined, and `Chartist.renderToString(Chartist.toScene(config, size))` returns SVG markup

#### Scenario: Browser module

- **WHEN** a page imports `toScene` from `dist/index.min.js` and `renderToString` from `dist/server.min.js`
- **THEN** it gets SVG markup, and the page loaded one copy of the core
