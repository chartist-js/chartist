# Tasks

## 0. Before starting

- [x] 0.1 Check that `add-essentials-package` is applied (the `packages/essentials` project builds, its entry, stylesheet, API recordings, size budgets, docs pages and the gallery's "Essentials" section with the `essentials` example type exist), and whether `add-time-axis` or `add-label-thinning` already changed `src/scales/axis.ts` and `src/scales/grid.ts`; build on their state. The design's "Decisions from review" settles the defaults. Verify: `pnpm nx build essentials` passes and `openspec validate add-log-axis --strict` passes.

## 1. Core: minor grid lines

- [x] 1.1 Add `minorTicks?: readonly number[]` to `ScaleAxis` with a doc comment, and an optional `gridMinor` class name to `AxisClassNames` (`src/scales/grid.ts`), defaulted where the grid is drawn (`classNames.gridMinor ?? 'ct-grid-minor'`), not in the presets' `classNames` defaults (`lineDefaults`, `barDefaults`), which are the 1.x classes' resolved options. Verify: `pnpm nx typecheck chartist`, and the reference check (`pnpm nx run docs:test`) finds a comment on each new member.
- [x] 1.2 Draw minor grid lines in `axisNodes()` (`src/scales/grid.ts`): for each minor tick inside the area, when the axis shows its grid, a `line` with the grid classes plus `ct-grid-minor`, role `grid`, `ctx.minor: true` and the minor tick's index, before the axis's major grid lines; no labels. Verify: unit tests for "A custom axis with minor ticks", "No grid", and a scene equality test that charts with only core axes are unchanged (spec "Unchanged charts").
- [x] 1.3 Add the `.ct-grid-minor` rule to the core stylesheet with `--ct-grid-minor-color`, `--ct-grid-minor-width` and `--ct-grid-minor-dasharray`, defaults lighter than the grid and following `light-dark()` like it, and document the properties where the grid properties are documented. Verify: the stylesheet test that reads the compiled CSS, a test for "Restyled with CSS", and `pnpm nx run chartist:test:size`.

## 2. Core: axis transforms and trend lines

- [x] 2.1 Add the `AxisTransform` type (`forward`, `inverse`), `AxisFactory.transform` and `ScaleAxis.transform`, with doc comments, and export the type from `chartist`. Pass the transforms of a layer's axes to `extent` (`ExtentContext.transforms`, from the axis definitions in `src/scales/cartesian.ts`). Verify: unit test "A transform reaches the layers".
- [x] 2.2 Make the presets' axis wrappers (`lineChart`, `barChart`) keep the user factory's `transform`. Verify: unit test "Through a preset", and the existing preset and parity tests unchanged.
- [x] 2.3 Fit `trendLine()` in transformed space when its axes have transforms: transform X (scale axes) and Y, skip non-finite transformed values, place the ends with `inverse`, report the extent in values; update its doc comment (slope and intercept in transformed units). Verify: unit tests "An exponential trend on a log axis" (with a test transform in the core, not the essentials package), "Values without a place", and "Linear axes unchanged" next to the existing trend line tests.
- [x] 2.4 Update the API recordings and type tests (`test/api/exports/`, a `*.test-d.ts` for `AxisTransform`, `minorTicks` and `ExtentContext.transforms`), and re-measure the core budgets. Verify: `pnpm nx run chartist:test:api --skip-nx-cache`, `chartist:test:api:v1` and `chartist:test:size`, with the sizes in the commit message.

## 3. Terminal

- [x] 3.1 Skip `grid` nodes with `ctx.minor` in `packages/terminal/src/draw.ts`. Verify: a unit test with a custom axis that has minor ticks, whose output equals the output without them (spec "A log axis with minor ticks"), `pnpm nx test terminal --skip-nx-cache`.

## 4. The log axis

- [x] 4.1 Write the range, tick and minor tick helpers in `packages/essentials/src/logAxis.ts`: range from positive values and extents widened to whole powers, the equal-ends and no-positive-values cases, exact `low`/`high`, `high <= low`; powers rounded to 15 significant digits; thinning at exponents divisible by n; multiples inside a single power; explicit `ticks` without values of zero or below; minor ticks as multiples or as the powers left out. Verify: unit tests for every scenario of "Range in whole powers", "Ticks at powers" and "Minor ticks" in the `log-axis` spec, plus bases 2 and `Math.E` and values from 1e-9 to 1e12.
- [x] 4.2 Write `logAxis(options)`: kind `log`, validation of `base` at the call and of `low`/`high` at creation (errors naming `logAxis` and the option), projection by `ln(value / min) / ln(max / min)` with values of zero or below at 0, `highLow` used only where positive, the `log_base` transform, `minorTicks` when asked. Doc comment with an `@example`, following `DOC-COMMENTS.md`. Export it and `LogAxisOptions` from the package entry. Verify: unit tests for "Invalid base", "A low of zero", "Positions", "Zero and negative values".
- [x] 4.3 Test the layers on a log axis with `toScene()`: line points and area, bars from the axis start with a zero value, band edges and `mark`, a target line at zero, a trend line, a preset `barChart` with its reference value 0, a log-log chart, and a linear left plus log right Y axis. Verify: scene tests for every scenario of "Layers on a log axis", "In a composed chart" and "Log axes with other axes".
- [x] 4.4 Test server and terminal output: two `toScene()` calls in Node are equal and `renderToString()` has a grid line per tick; `@chartist-js/terminal` draws a log axis chart with `minorTicks: true` with a grid line and a label per tick (the terminal package as a dev dependency of essentials, or the test in the terminal package with essentials as its dev dependency, whichever the essentials setup allows without a workspace cycle). Verify: the tests in "Log axes on the server and in the terminal" pass.
- [x] 4.5 Update the essentials API recordings, README (a log axis section with an example, checked by the README test) and size budget (`import { logAxis } from '@chartist-js/essentials'`). Verify: the package's api, README and size targets, and its smoke test.

## 5. Examples and visual tests

- [x] 5.1 Add `essentials/log-axis` (a `lineChart` from 120 to 850,000 on `axisY: { type: logAxis() }`, labels with `toLocaleString`) and `essentials/log-log` (a `chart()` with two log axes, points, `minorTicks: true` and a `trendLine()` of a power law), in `packages/examples/essentials/`, with manifest entries, `v2: true`, descriptions and seeded data. Verify: `pnpm nx typecheck examples`, `pnpm nx check examples`, both show in the gallery's "Essentials" section and run in the playground.
- [x] 5.2 Check both in the visual tests with their local target (the visual tests are their own package since #1525, with `@chartist-js/essentials` as a dependency) and look at the screenshots: evenly spaced decades, minor grid lines lighter than the grid, the trend line through the points. Leave recording the committed baselines to the author's WSL host or CI. Verify: the local run passes and the screenshots are checked by eye in light and dark mode.

## 6. Docs

- [x] 6.1 Write the "Log axis" guide in the `@chartist-js/essentials` docs (`apps/docs/src/content/packages/essentials/`): when to use it, decades from the data and `low`/`high`, `base`, ticks by hand, `minorTicks` and the `--ct-grid-minor-*` properties, labels with `labelTransform`, zero and negative values (with `null` for gaps), bars and stacked bars, trend lines, a second axis, a note for `chartist-logaxis` users; live examples from 5.1. Follow `apps/docs/WRITING.md`. Verify: `pnpm nx run docs:samples`, `pnpm nx run docs:check`, the guide's e2e checks, and Playwright screenshots in light and dark mode and at 375 px without horizontal scrolling.
- [x] 6.2 In `apps/docs/src/content/docs/axes-and-scales.mdx`, after "Three kinds of axes", name the log axis from `@chartist-js/essentials` in a sentence or callout and link the guide. Verify: the link resolves in the built site (`docs:check`), spec "From the axes guide".
- [x] 6.3 Check that the API reference has `logAxis` and `LogAxisOptions` on the essentials page and `AxisTransform` and the new members on the core's scales page. Verify: the generated `api.json` and the built reference pages.

## 7. Gate

- [x] 7.1 Run the gate: `pnpm nx format:check --all`, `pnpm nx run-many -t lint typecheck test --skip-nx-cache`, `chartist:test:api` and `:v1`, `chartist:test:smoke`, `chartist:test:size`, the essentials package's api, smoke and size targets, `docs:check`, `pnpm nx e2e docs`, and the local visual tests. Verify: all of them pass.
