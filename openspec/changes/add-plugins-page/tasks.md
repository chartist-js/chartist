# Tasks

## 1. The plugins and their code on the site

- [x] 1.1 Add the 12 plugins as pinned dev dependencies of the docs app (`chartist-plugin-axistitle`, `chartist-plugin-legend`, `chartist-plugin-tooltips`, `chartist-plugin-pointlabels`, `chartist-hover`, `chartist-plugin-zoom`, `chartist-plugin-fill-donut`, `chartist-plugin-barlabels`, `chartist-plugin-accessibility`, `chartist-plugin-threshold`, `chartist-plugin-targetline`, `@stklcode/chartist-plugin-tooltips`). Verify: `pnpm install` adds them, with no install scripts and no new runtime dependencies besides chartist
- [x] 1.2 Extend `integrations/playground-lib.mjs` to serve `index.umd.js` and `compat.umd.js`, and each plugin's script and license file under `plugins/<package>/`, in dev and in the build, failing the build when one is missing. Verify: the dev server and `dist` serve them with CORS, and removing a license file fails the build
- [ ] 1.3 Add the import map keys `chartist/umd`, `chartist/compat/umd` and one per plugin package to the site's sandbox environment (`scripts/playground-env.ts`). Verify: a unit or e2e check resolves each key to the site's origin

## 2. Classic scripts by bare name in the sandbox

- [x] 2.1 In `packages/playground/src/compile.ts`, replace a classic `<script src>` whose value is a key of the import map with its URL, keeping order and leaving other scripts alone; with unit tests (bare name, unknown name, URL, module script untouched). Verify: `pnpm nx test playground`
- [ ] 2.2 Check that the same example runs in a live example, the full playground and from a shared link. Verify: playground e2e with an example that loads a UMD build by name

## 3. Compat for 0.x-era plugins

- [x] 3.1 Add the 0.x names to the global in the compat UMD entry: `plugins`, `Line`, `Bar`, `Pie` (the 1.x classes) and `getDataArray(data, reverse)`, with a unit test of `getDataArray` against 1.x's normalization and a check that the ESM and CJS exports don't gain these names. Verify: `pnpm nx test chartist`, `pnpm nx run chartist:test:api`
- [x] 3.2 Make the `fromLegacyPlugin` chart object an instance of its preset's 1.x class (`Object.create` of the prototype), with `data`, resolved `options` (1.x defaults, `classNames`) and `optionsProvider.getCurrentOptions()` set at install; plain object for `chart()` compositions. Unit tests for each field and for `instanceof`. Verify: `pnpm nx test chartist`
- [x] 3.3 Set `chart.svg` to the root wrapped in the 1.x `Svg` API before the first `draw` event, on the functional API and the 1.x classes, with tests calling `querySelectorAll` from `draw` and `created`. Verify: `pnpm nx test chartist`
- [ ] 3.4 Add 0.x `bounds` (`min`, `max`, `range`, `step`, `values`) of the value axis to the compat `created` payload, with a test. Verify: `pnpm nx test chartist`
- [ ] 3.5 Run the 1.x contract suites and the size budgets after the compat changes; raise the compat budget to the new size plus about 1% if it grows. Verify: `pnpm nx run-many -t test,test:api,test:api:v1,test:size,test:visual:local -p chartist`

## 4. Plugin data

- [x] 4.1 Add `src/data/plugins.ts`: per plugin the package, title, description, author, repository URL (or none when gone, with the note), npm URL, license, chart types, v2 status, example id and optional note, validated with zod. Verify: `pnpm nx check docs`
- [ ] 4.2 Extend `scripts/facts.ts` to write `plugins.<package>.monthlyDownloads` for the listed packages, and the schema in `src/data/facts.ts` to require a count for each listed plugin, failing with the package's name. Run the script and commit the snapshot. Verify: `pnpm nx run docs:facts`, and the build fails when a count is removed

## 5. Live examples

- [ ] 5.1 Add one example per plugin in `apps/docs/src/examples/plugins/<name>/` (Vite shape: `index.html` loading `chartist/umd`, `chartist/compat/umd` and the plugin by name; `src/main.ts` using the global `Chartist` and `fromLegacyPlugin`, or the module import for @stklcode's; a global declaration for types), showing what the plugin adds, with an instruction for tooltips, hover and zoom. Verify: each runs on the dev server without console errors
- [x] 5.2 Turn off "Open in StackBlitz" for plugin examples, keep "Open in playground". Verify: the toolbar of a plugin example has no StackBlitz action

## 6. Contract test

- [ ] 6.1 Add a docs e2e test that runs each listed plugin on v2 in both modes (`fromLegacyPlugin` on the functional API, the 1.x classes with compat), checks its markup (after hovering or dragging where needed) and fails on page errors. Move any plugin that fails for a reason in its own code off the list, with the reason in `src/data/plugins.ts`. Verify: `pnpm nx e2e docs`

## 7. The page

- [x] 7.1 Create `src/pages/plugins.astro`: header (eyebrow, "Small add-ons, big tricks", intro, guide link), the filter, the entries sorted by downloads (title, package, description, credits row with author, repository or npm link, license, downloads with the snapshot date, status tag and note, the live example, the CDN snippet), and "Write your own" with a short v2 plugin and the guide link. Verify: `pnpm nx build docs`, no third-party requests
- [x] 7.2 Add the filter as a small inline script: text over name, package, author and description, chips for all, line, bar and pie, a live region with the count, the empty message; controls hidden without JavaScript. Verify: e2e tests for text, chart type, no match and the count
- [x] 7.3 Add "Plugins" to the header navigation after Examples (`src/lib/site.ts`), the share card (`lib/og.ts`), the Markdown version and its `llms.txt` entry. Verify: e2e page list includes `/plugins/`, and the `.md` version renders
- [ ] 7.4 Check both themes and phone width on the dev server, with the filter in use. Verify: no horizontal scroll at 375 px, readable entries and tags, visible focus states
- [x] 7.5 Add `/plugins/` to `e2e/pages.ts` (accessibility, meta, no third-party requests) and to the docs visual check's pages. Verify: `pnpm nx e2e docs`

## 8. Docs and plan

- [ ] 8.1 Link the plugins page from "Events and plugins" ("Sharing a plugin") and "Coming from 1.x" ("Bring 1.x plugins along"), and mention the 0.x names the compat UMD build adds. Verify: `pnpm nx run docs:test` and the docs e2e
- [ ] 8.2 Update `docs/v2-high-level-plan.md` with the page and the compat decisions. Verify: the plan names the change and its decisions

## Workflow follow-up

- Archive the change, sync the `docs-site`, `example-playground` and `v1-compatibility` specs, amend the last implementation commit.
