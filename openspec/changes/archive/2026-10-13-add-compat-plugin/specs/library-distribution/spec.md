# Spec Delta

## MODIFIED Requirements

### Requirement: Exports map

The package SHALL define an `exports` map with: the root entry (`types`, `import`, `require`, plus `style` and `sass` conditions for style-aware resolvers), `./compat` (`types`, `import`, `require`), `./styles.css` (readable CSS), `./scss/*` (Sass sources), `./package.json` and `./dist/*` (every file in `dist`). Paths not listed SHALL NOT be importable.

#### Scenario: Stylesheet subpath

- **WHEN** an application imports `chartist/styles.css`
- **THEN** it resolves to `dist/index.css`

#### Scenario: CSS import through the style condition

- **WHEN** a CSS tool that resolves with the `style` condition processes `@import "chartist"`
- **THEN** it resolves to `dist/index.css`

#### Scenario: Compat subpath

- **WHEN** an application imports `{ compat }` from `chartist/compat`
- **THEN** it resolves to `dist/compat.js` (import) or `dist/compat.cjs` (require), and the core it uses is the same module instance as `chartist`

## ADDED Requirements

### Requirement: Compat builds for every format

The compat plugin SHALL ship as ESM (`dist/compat.js`), CJS (`dist/compat.cjs`), browser ESM (`dist/compat.min.js`, importing `./index.min.js`) and UMD (`dist/compat.umd.js`). The UMD build SHALL add `compat` to the global `Chartist` defined by `dist/index.umd.js`. No compat build SHALL contain a second copy of the core.

#### Scenario: Classic script tags

- **WHEN** a page loads `dist/index.umd.js` and then `dist/compat.umd.js` with classic `<script>` tags
- **THEN** `Chartist.compat` is defined, and `new Chartist.LineChart(el, data, { plugins: [Chartist.compat] })` emits 1.x `draw` events

#### Scenario: Browser module

- **WHEN** a page imports `compat` from `dist/compat.min.js` and `LineChart` from `dist/index.min.js`
- **THEN** the chart with the compat plugin emits 1.x `draw` events
