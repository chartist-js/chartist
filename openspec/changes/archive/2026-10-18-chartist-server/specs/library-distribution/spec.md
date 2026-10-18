## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Server builds for every format

`chartist/server` SHALL ship as ESM (`dist/server.js`), CJS (`dist/server.cjs`), browser ESM (`dist/server.min.js`, importing `./index.min.js`) and UMD (`dist/server.umd.js`, adding its exports to the global `Chartist` defined by `dist/index.umd.js`), with type declarations for both module systems. No server build SHALL contain a second copy of the core.

#### Scenario: Classic script tags

- **WHEN** a page loads `dist/index.umd.js` and then `dist/server.umd.js` with classic `<script>` tags
- **THEN** `Chartist.renderToString` and `Chartist.applyStyles` are defined, and `Chartist.renderToString(Chartist.toScene(config, size))` returns SVG markup

#### Scenario: Browser module

- **WHEN** a page imports `toScene` from `dist/index.min.js` and `renderToString` from `dist/server.min.js`
- **THEN** it gets SVG markup, and the page loaded one copy of the core
