# Tasks

The prototype on branch `feat/terminal-renderer` (`packages/terminal`) is the reference for the drawing code; port from it rather than starting over.

## 1. Shared values and preset configs in chartist

- [x] 1.1 Add `lineChartConfig`, `barChartConfig` and `pieChartConfig` in `packages/chartist/src/presets` (options over the preset defaults with the presets' `extend`, then the existing spec's `config()`), exported from the root with doc comments per `DOC-COMMENTS.md`. Verify: unit tests that `toScene()` of each config equals the scene the preset renders for the same data, options and size, including `horizontalBars` and a donut
- [x] 1.2 Export `seriesColors` (the 15 default hex colors, `a` first) with a doc comment, and add a test that parses `$ct-series-colors` from `src/styles/_settings.scss` and compares. Verify: the test passes, and fails when one color in either place is changed
- [x] 1.3 Export `textAscent` and use it in `scales/svgLabels.ts` instead of the private `ASCENT`. Verify: the existing label tests and `test:visual:local` pass unchanged
- [x] 1.4 Add the new names to `test/api/exports/chartist.json` and public API tests for them. Verify: `pnpm nx run chartist:test:api` and `pnpm nx run-many -t test typecheck lint -p chartist --skip-nx-cache`

## 2. Package scaffold

- [x] 2.1 Create `packages/terminal`: `package.json` (`@chartist-js/terminal`, `version` equal to chartist's, `chartist: workspace:^`, `exports` for `.`, `./styles.css`, `./package.json`, `bin.ct-cli`, `engines.node >=22`, `publishConfig.access: public`, `repository.directory`, `files`, Nx name `terminal`), `tsconfig*.json`, `vitest.config.ts`, the licenses. Verify: `pnpm install`, and `pnpm nx show project terminal` lists build, test, typecheck and lint
- [x] 2.2 Add `tsdown.config.ts`: ESM and CJS of `src/index.ts` with `.d.ts`/`.d.cts`, `chartist` external, and `src/cli/main.ts` as ESM `dist/cli.js` with a shebang; the build also runs `scripts/styles.ts`. Verify: `pnpm nx build terminal` writes `index.js`, `index.cjs`, `index.d.ts`, `index.d.cts`, `cli.js` and `styles.css`

## 3. Canvas and drawing

- [x] 3.1 Port the canvas with semantic cells (kind, series, background series; braille masks; priorities; majority series per braille cell). Verify: unit tests for dot bits, priorities, majority series, and clipping
- [x] 3.2 Port drawing by role and element: grid, braille lines/points/areas (curves flattened), block bars with eighth blocks and stacked-cell backgrounds, slices by angle and donut ring, labels by line center using `textAscent` and pie `dx`/`dy`, plugin nodes by element; `terminalSize` and `measureCells`. Verify: unit tests for each scenario of the `terminal-rendering` spec's drawing requirements (Cell geometry through Nodes without a built-in role), on plain-text output
- [x] 3.3 Draw a node a plugin replaced while keeping its role (a `circle` with the role `point`, as in the core plugin guide) by its element, not by the role's attributes. Verify: unit test for the replaced point; the plugin guide's live example shows its circles

## 4. ANSI output and colors

- [x] 4.1 Implement `renderToTerminal(scene, { color, palette })` with truecolor, 256, 16 and none, default palette `seriesColors`, dim grid/labels/areas, contrast text on colored cells. Verify: unit tests for each mode's escapes, the custom palette and that `none` has no escape codes
- [x] 4.2 Implement `detectColorMode(stream, env)`. Verify: unit tests for `NO_COLOR`, `TERM=dumb`, non-TTY, `FORCE_COLOR` 0–3, `COLORTERM`
- [x] 4.3 Check that the API entry imports no Node.js modules and reads no globals. Verify: a test that bundles `dist/index.js` for the browser platform (or scans its imports) and fails on `node:` imports or `process`

## 5. HTML output and stylesheet

- [x] 5.1 Implement `renderToHtml(scene, options)`: `<pre class="ct-terminal">`, class runs (`ct-series-x`, `ct-bg-series-x`, `ct-grid`, `ct-label`, `ct-area`, …), escaped text, no `style` attributes. Verify: unit tests for the HTML output scenarios
- [x] 5.2 Write `scripts/styles.ts` that generates `dist/styles.css` from `seriesColors` (series colors and backgrounds via `--ct-series-*`, `--ct-terminal-on-series-*`, grid and label via `--ct-grid-color`/`--ct-label-color`, monospace stack, `line-height: 1`). Verify: a test on the generated CSS, and a Playwright screenshot (light, dark, 375 px wide) of rendered HTML with the stylesheet and with `--ct-series-a` overridden, checked by looking; delete the ad-hoc script afterwards

## 6. Chart functions and legend

- [x] 6.1 Implement `lineChart`, `barChart` and `pieChart` (data, 1.x options plus `columns`, `rows`, `color`, `palette`, `format: 'text' | 'html'`) on the chart config builders with the terminal defaults from the design. Verify: unit tests for the chart function scenarios (X labels below the axis, Y labels on grid lines, horizontal stacked bars, options override defaults)
- [x] 6.2 Implement `legend(data, { color, palette, width })`. Verify: unit tests for named, unnamed and wrapped legends
- [x] 6.3 Write `packages/terminal/README.md`: what it is, install, the API with a runnable example, HTML output and the stylesheet, color modes, fonts that work, limitations. Verify: the README's TypeScript example is type-checked by a test (or copied into a test file) and runs

## 7. ct-cli

- [x] 7.1 Implement data parsing (series arguments with holes, JSON, delimited rows with header row and name column, number errors) as its own module. Verify: unit tests for each `terminal-cli` data scenario
- [x] 7.2 Implement the command: chart types and `demo`, flags, size defaults, legend, color detection and `--color`, `--html`/`--standalone`, `--help`, `--version`, errors with exit code 1, quiet EPIPE. Verify: tests that spawn `dist/cli.js` for each `terminal-cli` scenario
- [x] 7.3 Add a smoke test that packs `@chartist-js/terminal` and `chartist`, installs both into a temp directory and runs `ct-cli --version` and a chart, and checks the tarball file list and that the packed `package.json` has no `workspace:` ranges. Verify: the smoke target passes
- [x] 7.4 Add the CLI section to the README (commands, input formats, flags, examples). Verify: each example command in it runs against the build

## 8. Docs

- [x] 8.1 Add the guide's example project `apps/docs/src/examples/terminal-rendering/text-art` (now `terminal/text-art`, moved by `add-packages-site`): the same data as an SVG chart and as text art (`format: 'html'`, the package's stylesheet). Verify: `pnpm nx run docs:check` type-checks it
- [x] 8.2 Wire `@chartist-js/terminal` into the docs and playground: serve its `dist/index.js`, `styles.css` and `index.d.ts` next to chartist's files, add it to `imports`, link CSS imports the import map names, add `types.packages` to the type service, add it to StackBlitz exports. Verify: playground unit tests for the CSS link, the types and the StackBlitz package.json; the example runs in the guide's live example (e2e)
- [x] 8.3 Write the guide `apps/docs/src/content/docs/terminal-rendering.mdx` (now in `src/content/packages/terminal/`, moved by `add-packages-site`) (CLI, API for CLI tools, HTML output, the live example) per `WRITING.md`, with install snippets following the prerelease rule in `src/lib/release.ts`. Verify: `pnpm nx run docs:samples`, `pnpm nx e2e docs` (including axe), and Playwright screenshots in light, dark and 375 px without horizontal scroll, checked by looking
- [x] 8.4 Update the docs that the new `chartist` exports change: the Server rendering guide's note that the presets have no string form, and `WRITING.md`'s page table. Verify: `pnpm nx run docs:test` (doc comments of the new exports) and `docs:samples`
- [x] 8.5 Write two more guides in the package subsite: Customizing charts (interpolation with a live `Interpolation.step()` example, options per series, axes and scales, bars and pies, what stays in the browser) and Plugins (a 2.x target-line plugin that adds a `line`, `text` and `circle`s as a live example, what the terminal draws of each element, plugins that need a page). Verify: `pnpm nx run docs:samples`, `pnpm nx e2e docs`, and Playwright screenshots in light, dark and 375 px without horizontal scroll, checked by looking

## 9. Release

- [x] 9.1 Check the release with both packages without publishing: add `terminal` to `release.projects` in `nx.json` and run `pnpm nx release <next rc> --dry-run --skip-publish` and `pnpm nx release publish --dry-run --tag next` after a build. Verify: both versions bump together, one changelog section and one `v{version}` tag, both packages in the publish dry run, and the packed `@chartist-js/terminal` depends on `chartist` `^{version}` (set `preserveLocalDependencyProtocols: false` if not)
- [x] 9.2 Check that `tools/changelog-renderer.cjs` keeps `terminal`-scoped commits. Verify: a renderer unit test with a `feat(terminal):` commit
- [x] 9.3 Update `docs/decisions.md`: the `@chartist-js` scope for maintained packages, lockstep releases, sharing through `chartist`'s public API, and "Only `chartist` is released" replaced. Verify: the Releases and Distribution sections match `nx.json` and the package
- [ ] 9.4 Author: on npmjs.com, configure the trusted publisher for `@chartist-js/terminal` (repository `chartist-js/chartist`, workflow `release.yml`, environment `release`), with a first publish if npm requires the package to exist. Verify: npmjs.com shows the trusted publisher for the package

## 10. Integration

- [x] 10.1 Run the whole gate locally: `pnpm nx run-many -t lint typecheck check test build test:smoke test:size test:api --skip-nx-cache`, `pnpm nx format:check --all`, docs and playground e2e, `test:visual:local`. Verify: all pass, and `ct-cli demo` looks right in a real terminal (checked by the author)

## Workflow follow-up

- The author reviews the proposal and says "lgtm" before `/opsx:apply`.
- Task 9.4 must be done before the first release that includes the package; until then, keep task 9.1's `nx.json` change unmerged or the publish step fails.
- On "asa": archive the change, sync its specs, update `docs/decisions.md`, and amend into the last implementation commit.
- When `release-v2-rc` is archived as well, change the `release-process` wording from "the `chartist` package" to the release group.
