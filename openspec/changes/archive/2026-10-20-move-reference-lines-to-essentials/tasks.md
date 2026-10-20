# Tasks

## 1. Essentials gets the lines

- [x] 1.1 Copy `trendLine.ts` and `targetLine.ts` and their specs into `packages/essentials/src/`, importing from `chartist` (public API only) and with a private `centerShift`. Declare `trendLine`, `targetLine` and `targetLabel` in a `NodeRoles` augmentation with their context types, export the layers, option and context types from the entry. Verify: `pnpm nx run-many -t typecheck lint test -p essentials --skip-nx-cache`, the moved tests unchanged but for imports.
- [x] 1.2 Move the styles into `packages/essentials/src/styles.css` as plain CSS with the same custom properties and defaults, light and dark. Verify: the stylesheet test, and a server test with `applyStyles` and both stylesheets that gives the 2.1 values.
- [x] 1.3 Update the essentials export list, README (a section for each line) and size budgets. Verify: the package's api, README, size and smoke targets.

## 2. The core lets them go

- [x] 2.1 Remove the layers, their specs, contexts, `NodeRoles` entries and exports from `packages/chartist`; move the core tests that used them to `band()` or a test layer; update doc comments that import them (`presets/preset.ts`, `scales/axis.ts`) to essentials. Verify: `pnpm nx run-many -t typecheck lint test -p chartist --skip-nx-cache`.
- [x] 2.2 Remove their rules and Sass settings from `src/styles/`. Verify: the smoke test's Sass checks, and `grep -rn "target-line\|trend-line" packages/chartist/src/styles` finds nothing.
- [x] 2.3 Record the API (`test:api:update-exports`), lower the size budgets to the measured sizes. Verify: `chartist:test:api`, `test:api:v1`, `test:size`, the sizes in the commit message.

## 3. Other packages

- [x] 3.1 Tooltips: tests and doc comments import the lines from essentials (a dev dependency). Verify: `pnpm nx run-many -t typecheck test -p tooltips --skip-nx-cache`, the role narrowing type test.
- [x] 3.2 Terminal: tests import the target line from essentials. Verify: `pnpm nx test terminal --skip-nx-cache`.

## 4. Examples

- [x] 4.1 Move `composed/target-line`, `composed/trend-line` and `composed/scatter-regression` to `essentials/` with their visual baselines, in a commit of moves only; then change their imports, manifest entries (type `essentials`) and the other examples' imports. Verify: `pnpm nx run-many -t typecheck check -p examples`, the visual tests pass against the renamed baselines without re-recording.

## 5. Docs

- [x] 5.1 Move `docs/target-lines-and-bands.mdx` to `docs/bands.mdx` (a move-only commit), then make it the bands guide (title, navigation, its band sections, a link to the essentials guide) and write `packages/essentials/target-lines.mdx` and `trend-lines.mdx` from its target and trend line sections with their examples, importing from essentials; list it on the essentials overview. Verify: `pnpm nx run docs:samples`, `grep -rn "target-lines-and-bands" apps/docs/src apps/docs/integrations apps/docs/e2e` finds only what the next task changes.
- [x] 5.2 Point the `chartist-plugin-targetline` entry of `MOVED_PAGES` and the 0.x target line anchors in `v0-redirects.ts` to `packages/essentials/target-lines/`, with their tests; no redirect for the old guide URL. Verify: `redirects.test.ts`, `v0-redirects.test.ts`, `pnpm nx run docs:v0-redirects`.
- [x] 5.3 Update the line, bar and composed chart guides, the terminal, tooltips and log axis docs to import the lines from essentials. Verify: `grep -rn "trendLine\|targetLine" apps/docs/src` shows no import from `'chartist'`.
- [x] 5.4 Verify: `pnpm nx run docs:check`, `pnpm nx e2e docs`, the guide in light and dark mode and at 375 px.

## 6. Gate and commits

- [x] 6.1 Commits: `feat(essentials): add trendLine() and targetLine()` first, then `feat(chartist)!: move trendLine() and targetLine() to @chartist-js/essentials` with a `BREAKING CHANGE:` footer (new import, stylesheet, Sass settings) and the sizes, the example moves, the example and docs edits.
- [x] 6.2 Run the gate: `pnpm nx format:check --all`, `pnpm nx run-many -t lint typecheck test --skip-nx-cache`, chartist's api, smoke and size targets, the essentials targets, `docs:check`, `pnpm nx e2e docs`, the visual tests.
