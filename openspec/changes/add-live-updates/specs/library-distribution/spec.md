## MODIFIED Requirements

### Requirement: Exports map

The package SHALL define an `exports` map with: the root entry (`types`, `import`, `require`, plus `style` and `sass` conditions for style-aware resolvers), `./compat` (`types`, `import`, `require`), `./live` (`types`, `import`, `require`), `./styles.css` (readable CSS), `./themes/*` (theme stylesheets), `./scss/*` (Sass sources), `./package.json` and `./dist/*` (every file in `dist`). Paths not listed SHALL NOT be importable.

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

#### Scenario: Theme subpath

- **WHEN** an application imports `chartist/themes/accessible.css`
- **THEN** it resolves to `dist/themes/accessible.css`, and `dist/themes/accessible.min.css` exists for CDN links

### Requirement: Size budgets

The build SHALL be checked against gzip size budgets for at least: the browser ESM build, the UMD build, a tree-shaken import of each chart type (`LineChart`, `BarChart`, `PieChart`), the browser ESM build of `chartist/live` without the core, a tree-shaken import of `liveDomRenderer` alone and with `smilAnimations`, and the minified CSS. The check SHALL fail when a file exceeds its budget.

#### Scenario: Budget exceeded

- **WHEN** a change makes `dist/index.min.js` larger than its gzip budget
- **THEN** the size check target fails and reports the file and the overshoot

#### Scenario: Live updates stay out of the core

- **WHEN** the size check measures a tree-shaken import of `lineChart` from `chartist`
- **THEN** its size grows by at most 0.6 kB gzipped over rc.3 (13.65 kB), and it contains none of the live renderer's code
