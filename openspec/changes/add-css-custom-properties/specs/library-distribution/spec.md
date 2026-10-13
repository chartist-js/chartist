# Spec Delta

## MODIFIED Requirements

### Requirement: Exports map

The package SHALL define an `exports` map with: the root entry (`types`, `import`, `require`, plus `style` and `sass` conditions for style-aware resolvers), `./compat` (`types`, `import`, `require`), `./styles.css` (readable CSS), `./themes/*` (theme stylesheets), `./scss/*` (Sass sources), `./package.json` and `./dist/*` (every file in `dist`). Paths not listed SHALL NOT be importable.

#### Scenario: Stylesheet subpath

- **WHEN** an application imports `chartist/styles.css`
- **THEN** it resolves to `dist/index.css`

#### Scenario: CSS import through the style condition

- **WHEN** a CSS tool that resolves with the `style` condition processes `@import "chartist"`
- **THEN** it resolves to `dist/index.css`

#### Scenario: Compat subpath

- **WHEN** an application imports `{ compat }` from `chartist/compat`
- **THEN** it resolves to `dist/compat.js` (import) or `dist/compat.cjs` (require), and the core it uses is the same module instance as `chartist`

#### Scenario: Theme subpath

- **WHEN** an application imports `chartist/themes/accessible.css`
- **THEN** it resolves to `dist/themes/accessible.css`, and `dist/themes/accessible.min.css` exists for CDN links
