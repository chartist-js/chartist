# Chartist v2: High-Level Plan

> Living document. It records the vision and the decisions made so far. Detailed work is specified as OpenSpec changes in `openspec/`.

## Background

- **0.x (2014–2019):** the original Chartist.js by Gion Kunz. It used plain JS, Sass and an SVG-first approach with the motto "style with CSS, control with JS". Its hand-crafted docs site (Assemble/Handlebars, SSG) had the Chartist Guy mascot, live editable examples and a playful tone. Reference: `tmp/chartist-v0` (backup repo `gionkunz/chartist-js`), live at https://gionkunz.github.io/chartist-js/.
- **1.x (2022–):** cube.dev helped migrate to TypeScript, Rollup and pnpm, plus a Docusaurus site at https://chartist.dev. This kept the project alive, but the docs lost their personality, and the examples assume a bundler. Reference: `tmp/chartist-v1` (`chartist-js/chartist`).
- **v2:** a full modernization of the library, the brand and the docs. AI-assisted development makes sustained maintenance realistic again.

## Goals

1. **Bring back the soul of 0.x, made for today.** The docs should be engaging, entertaining and crafted, not a template.
2. **Modernize the brand.** That means a new Chartist Guy, logo, palette and typography. The redesign is running in parallel in Claude Design (brief: `docs/design-handoff-prompt.md`), and its output will be handed over for implementation.
3. **TypeScript-native** (decided 2026-10-12). Chartist is written in TypeScript and the docs foster typed usage:
   - Every docs example is a small project of **HTML + TypeScript + CSS** (`index.html`, `index.ts`, styles), the shape of a Vite app.
   - Types are part of the API: option and data types are exported and documented next to each example.
4. **No bundler required.** Chartist must still work directly in the browser:
   - **`<script type="module">`** importing ESM from a CDN is the primary no-bundler path and the successor of UMD. The getting-started docs show it next to the npm + TypeScript setup.
   - **UMD** for classic `<script>` tags ships for **backwards compatibility only** (legacy, documented in the migration guide, not in examples).
   - CJS for older Node tooling.
5. **Live, in-browser examples** like 0.x had: an embedded playground (editor + output) integrated into the docs. It runs the HTML + TypeScript + CSS examples in a **browser-only sandbox** (no server, static hosting). Researched 2026-10-12, decided with the author:
   - **Own small playground** (the approach of the Vue, Svelte and Solid playgrounds): strip the TypeScript in the browser (sucrase or ts-blank-space), turn CSS imports from TypeScript (`import 'chartist/styles.css'`) into `<link>`/`<style>` tags as Vite does, run the result in a `sandbox="allow-scripts"` iframe, and resolve `chartist` to the docs' own build through an import map. No extra origin, no COOP/COEP headers, works on GitHub Pages and in Safari and Firefox, and the UI follows the brand.
   - **"Open in StackBlitz"** button next to each example for real Vite in a full project. Example files follow the `npm create vite` vanilla-ts layout (`index.html`, `src/main.ts`, `src/style.css`), so they open and copy unchanged.
   - Confirmed by a second, deeper research round (claude.ai, 2026-10-12): go with the DIY REPL and see how far it gets. If it falls short, evaluate `@rolldown/browser` (Vite 8's bundler as WASM, Vite-like resolution, ~12.5 MB unpacked) next. browser-vite (divriots) is archived since 2022.
   - Fallbacks: [LiveCodes](https://livecodes.io) (MIT, self-hostable, active) and Google's playground-elements.
   - Rejected: almostnode (reimplemented Vite, inactive since 2026-02, needs a second sandbox origin), inline WebContainers (cross-origin isolation headers, weak Firefox/Safari support, commercial licensing), Sandpack (stalled, hosted bundler).
6. **Full migration from 1.x, plus fixes and new features.** Scope research: `docs/v2-scoping.md`. Product decisions: see below.
7. **Carry the brand's hidden details forward**, quietly.

## Product and architecture decisions

Decided with the author on 2026-10-12, based on the scoping research (`docs/v2-scoping.md`).

**Architecture**

- **Rendering pipeline.** Data → normalization → layout (axes, scales, chart rect) → **Chartist SVG virtual DOM** (scene graph) → **renderer**. Chart code never touches the DOM. Rendering is the last step.
- **Interchangeable renderers.** The default renders to the DOM as SVG. Alternatives include an SVG string/image renderer (SSR, export, Node) and later canvas or others. This also fixes `window is not defined` and the SSR issues.
- **Functional API first** (decided 2026-10-13). The v2 API is functions, not classes: `chart('#el', { data, axes, layers, plugins, on })` returns a small handle (`update`, `destroy`, `on`, `off`), presets are `lineChart`, `barChart` and `pieChart`, and the core is pure from config to scene (`toScene`, `renderToString`). Side effects stay at the edges (host, renderer, compat). The 1.x classes (`new LineChart(...)`) remain as thin wrappers over the functions for backwards compatibility. v2 code itself uses no classes: factories return plain objects and keep state in closures (the scene node builder's shared prototype is the one exception, for memory).
  - Docs promote the functional API: all examples and guides use it. The class wrappers get minimal API docs (a short description and an `@see` link to the function), and guides mention the classic usage only briefly.
- **Event-based extension system** stays the core extension mechanism (it proved valuable in 0.x/1.x). It gets typed hooks at every pipeline stage: data, layout, scene/draw, render.
  - **Immutable event payloads** (decided 2026-10-13). Handlers receive read-only payloads and transform by **returning** a new value (`undefined` means unchanged). Results chain through the handlers in registration order. Observe-only handlers cost nothing; copies happen only where something changes. 1.x mutation semantics live in the compat plugin.
- **Composable charts.** One chart can combine several series layers (e.g. bar + line) on shared axes. This answers #37, the most-wanted issue of all time.
- **Composable multi-axis.** An XY chart can have several axes, e.g. a left and a right Y axis (#1058, #1405).
- **Responsive configuration** supports both window media queries (1.x behavior) and **container queries**. It is switchable by config and builds on modern browser APIs (`ResizeObserver`, container query conditions).

**Compatibility**

- **Aim for zero breaking changes.** `LineChart`, `BarChart` and `PieChart` remain as class wrappers around the `lineChart`, `barChart` and `pieChart` presets on top of the composable core.
- **Opt-in compat plugin** (`chartist/compat`, decided 2026-10-12). It restores the 1.x events, the `Svg` wrapper and 1.x plugins. The chart runtime ships no compat code; using 1.x events or plugins without it logs a one-time warning with migration instructions. The same mechanism can later let 0.x community plugins run on v2. Details: `openspec/changes/define-core-architecture` (design D6).
- **Plugins per API** (decided 2026-10-13). The functional API (`chart()`, `lineChart()`, …) accepts only v2 plugins (`{ name, install }`); a plugin function there is an error. The 1.x class API (`new LineChart`, …) accepts 1.x plugin functions, with `compat` in `plugins`, and passes the chart instance as before. `fromLegacyPlugin(fn, options)` from `chartist/compat` converts a 1.x plugin for the functional API: it turns on the 1.x events for that chart and gives the function a 1.x-style chart object.
- **New features are functional-API only** (decided 2026-10-13). The 1.x classes exist so 1.x users don't break; they get no new features (composed charts, multiple axes, SVG text labels, container queries). Users who want them migrate to `chart()` and the preset functions; 1.x classes and v2 charts work side by side on one page. Compat's 1.x events exist only for the presets (line, bar, pie), not for composed charts.
- **1.x `draw` events after rendering** (decided 2026-10-13). The compat plugin emits `draw` in 1.x order right after the DOM is rendered, with live elements. Only difference from 1.x: an element a handler appends to `data.group` lands after the group's other elements.
- **No 1.x export is removed** (decided 2026-10-13). `Svg`, `SvgList`, `SvgPath`, the helpers and all other 1.x root exports stay available from `chartist` and the UMD global, working without the compat plugin, because legacy plugins and users build their own SVG with them. They're tree-shaken when unused and get minimal docs pointing to the v2 equivalents. Details: design D11.

**Ecosystem**

- **Framework support: web components only**, maintained as a separate wrapper package in the monorepo. Other official wrappers may follow later.
- **Official plugins:** only the ones originally maintained by the author: accessibility, point labels, threshold (and possibly sketchy and tooltip; to be confirmed). Community plugins are supported through the compat plugin.

**Size**

- **Remain the smallest charting library.** Make everything tree-shakable: renderers, layers, axis types and plugins are separate entry points. Enforce per-entry size budgets in CI. The 1.x core is the baseline (36 kB gzipped, unminified).
  - Measured 2026-10-13 after `add-core-pipeline` (minified + gzipped): `import { chart }` 3.03 kB, `import { toScene, renderToString }` 2.39 kB; the 1.x `import { LineChart }` stays at 8.56 kB (the v2 code tree-shakes away); the whole package (browser ESM) grew from about 12 kB to 14.64 kB while v1 and v2 code ship side by side.
  - After `add-line-chart`: `import { lineChart }` 9.27 kB vs 1.x `import { LineChart }` 8.57 kB (+0.7 kB for scene, pipeline and renderers). `import { chart }` 3.19 kB; axes are opt-in through `cartesianAxes()`, so charts without axes don't bundle axis code. Whole package 17.3 kB while both generations ship.
  - After `add-compat-plugin`: `import { LineChart }` (now the 1.x wrapper over `lineChart`) 11.15 kB vs 8.57 kB before: the v2 preset (9.86 kB) plus the 1.x `BaseChart` machinery it still extends. The gap should close when bar and pie are converted and `BaseChart` slims down. `chartist/compat` adds 1.71 kB (browser ESM) or 1.84 kB (UMD) on top of the core; it never bundles the core. `import { chart }` 3.56 kB.
  - After `add-bar-chart`: `import { barChart }` 8.91 kB, `import { BarChart }` (wrapper) 10.36 kB vs 7.29 kB for the 1.x class; `import { LineChart }` 11.47 kB (the shared `PresetChart` base). The whole package only grew 0.5 kB (18.19 kB) because the 1.x bar code is gone; compat 2.14 kB with bar support.
  - After `add-pie-chart`: `import { pieChart }` 7.17 kB, `import { PieChart }` (wrapper) 8.61 kB vs 6.08 kB for the 1.x class. Whole package 18.38 kB (browser ESM). Every 1.x chart class now wraps a v2 preset; the 1.x drawing code is only used by the legacy exports and compat.
  - After `add-composed-charts`: a composed chart (`chart`, `cartesianAxes`, `stepAxis`, `autoScaleAxis`, `line`, `bar`, `axisGrid`, `axisLabels`) 10.88 kB. Layer binding and the axis list form live in `cartesianAxes()`; presets use a lean internal core without them, so `lineChart` grew only 0.54 kB (10.59 kB), `barChart` 0.49 kB (9.41 kB), `pieChart` and `chart` 0.13 kB (7.3 kB, 3.73 kB). Whole package 19.7 kB.
  - After `add-svg-text-labels`: `import { chart }` 3.94 kB (+0.21: the measurement in the container and the re-layout when web fonts load), `lineChart` 11.23 kB and `barChart` 10.07 kB (+0.64/+0.66, mostly the SVG label module), `pieChart` 7.52 kB, composed chart 11.53 kB, whole package 20.38 kB.
  - After `add-container-queries`: presets bundle the responsive watcher (`lineChart` 11.81 kB, `barChart` 10.64 kB, `pieChart` 8.1 kB, about +0.58 kB each); `chart()`'s responsive support is opt-in through `responsive([...])`, so `import { chart }` is 4.11 kB (+0.17). Whole package 21.01 kB.

## Tech decisions (so far)

| Area          | Decision                                                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo      | Nx 23 with a TypeScript project-references setup, pnpm workspaces            | Layout: `apps/*` (docs site, playgrounds), `packages/*` (library and internal libs)                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Docs site     | Astro (SSG), in `apps/`                                                      | `@nxtensions/astro` (the plugin from the original plan) is abandoned: Nx 19 / Astro ≤4 only. Decided with the author (2026-10-13): `@geekvetica/nx-astro` (3.x, peer deps Nx 22–23, Astro 5–7), app in `apps/docs`.                                                                                                                                                                                                                                                                                  |
| Specs         | OpenSpec (`openspec/`, schema `spec-driven`)                                 | Workflow: `/opsx:propose` → `/opsx:apply` → `/opsx:archive`                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Formatting    | oxfmt, with the 1.x Prettier settings in `.oxfmtrc.json`                     | Migrated from `.prettierrc` with `oxfmt --migrate=prettier`. `pnpm nx format` writes, `pnpm nx format:check --all` is part of the local gate. The one-time reformat and any future style change go in their own `style:` commits, listed in `.git-blame-ignore-revs`. Rationale: OpenSpec change `migrate-to-oxfmt`                                                                                                                                                                                  |
| Linting       | oxlint via `@nx/oxlint` (inferred `lint` target for every project)           | Root `.oxlintrc.json` carries over the 1.x ESLint rules and the TypeScript recommended set; stylistic rules are left to oxfmt. Type-aware linting is evaluated later. Rationale: OpenSpec change `migrate-to-oxlint`                                                                                                                                                                                                                                                                                 |
| Library build | tsdown (Rolldown + Oxc), Sass + PostCSS for styles, size-limit budgets       | ESM, minified browser ESM, CJS, UMD (`Chartist`), bundled `.d.ts`/`.d.cts`, CSS + Sass sources. Rationale: OpenSpec change `add-library-distribution` (design.md)                                                                                                                                                                                                                                                                                                                                    |
| Testing       | Vitest (unit, jsdom), Playwright visual regression with Vite-served examples | `pnpm nx test <project>` runs Vitest (`--watch` to watch) for `chartist` and `playground`; the package smoke tests (`test:smoke`) stay on `node --test`. Rationale: OpenSpec change `migrate-to-vitest`. `pnpm nx run chartist:test:visual` screenshots every `packages/examples` example (served by Vite, `chartist` resolved to the local build or to published 1.5.0) and compares it with a baseline recorded from 1.5.0. Rationale: OpenSpec change `add-visual-regression-harness` (design.md) |
| Playground    | Own TS-stripping iframe playground + "Open in StackBlitz" (spike: passed)    | See goal 5. Spike: `packages/playground`, OpenSpec change `add-playground-repl` (design.md, Findings). Works in Chromium, Firefox and WebKit under a base path. Type stripping: sucrase (decided)                                                                                                                                                                                                                                                                                                    |

## Repository layout

```
apps/               # v2 docs website (Astro), demos (none yet)
packages/chartist/  # the library (moved from the 1.x repo root)
packages/examples/  # shared examples (HTML + TypeScript + CSS), used by docs, playground and visual tests
packages/playground/ # browser-only example playground (REPL)
packages/           # internal packages
openspec/           # specs and change proposals
docs/               # planning docs, briefs
tmp/                # git-ignored reference clones: chartist-v0, chartist-v1
```

Reference clones (not part of the repo):

```sh
git clone https://github.com/gionkunz/chartist-js.git tmp/chartist-v0
git clone https://github.com/chartist-js/chartist.git tmp/chartist-v1
```

## Repository and migration strategy

v2 is developed **in the existing `chartist-js/chartist` repository**. Stars, followers, issues, PRs, tags (v0.x and v1.x) and the full history back to Feb 2014 all stay. Nothing is overwritten or force-pushed.

- **History continuity.** The `next` branch starts at the tip of 1.x `main` (v1.5.0). v2 is therefore a direct descendant of v1, and moving `main` to v2 later is a plain fast-forward.
- **Rename-friendly commits.** Git doesn't record renames. It infers them from how similar files are, so moves, deletions and content edits never share a commit:
  1. `chore: move v1 sources into monorepo layout`. Only `git mv` (`src`, `test`, build config and `package.json` → `packages/chartist/`; `website/` → `apps/docs-v1/`). All 304 files are detected as `R100` renames.
  2. `chore: set up Nx workspace, OpenSpec and Claude Code harness`. New root tooling.
  3. Later: remove obsolete 1.x tooling in deletion-only commits, then regular OpenSpec-driven work. The 1.x Docusaurus site (`apps/docs-v1`) was removed on 2026-10-13 (`remove-1x-leftovers`); it lives on in `main` and `tmp/chartist-v1`.
- **Branches.**
  - `main` = 1.x until the v2 release.
  - `next` = v2 development (pushed to `chartist-js/chartist`).
  - At release: create `1.x` from the v1.5.0 tag for maintenance, then fast-forward `main` to `next`.
  - Integrate with merge commits or rebase, **never squash**, because a squash merge collapses the move commit and loses the renames.
- **npm.** Pre-releases are published as `2.0.0-alpha.x` / `-beta.x` under the `next` dist-tag. `npm i chartist` keeps installing v1 until the release.
- **Issues.** Use a `v2` milestone and labels for the most-wanted issues picked during scoping.
- **Cleanup (separate, optional).** About 25 stale Renovate/dependabot branches and an old `master` (last commit 2019).
- **Docs hosting.** Check how chartist.dev is deployed today (on `main`, `website/CNAME` says `chartist.js.org`) before replacing it. Plan versioned docs (v2 current, v1 and v0 archives).

## Phases (rough)

1. **Foundation** (done): Nx workspace on top of the 1.x history (branch `next`), reference clones, OpenSpec, Claude Code harness, this plan.
2. **Scope definition:** review the most-wanted issues (v0.x and v1.x), define the v2 feature set and breaking changes, and write the first OpenSpec specs.
3. **Library core:** modernize the moved 1.x source in `packages/chartist`, set up the build pipeline (ESM/CJS/UMD), tests and visual regression.
4. **Docs site:** Astro app, implement the Claude Design output, playground and example gallery.
5. **Release** (last, decided 2026-10-13: only when the whole product, library and docs site, is ready)**:** v2 beta, migration guide, launch. Before the first push that can trigger the old workflows on `main`, rework GitHub Actions for the monorepo (deferred to this phase, decided 2026-10-13):
   - Until then, the gate is local: `pnpm nx run-many -t typecheck check build test test:smoke test:size test:visual test:visual:v1 test:api test:api:v1 test:e2e lint` and `pnpm nx format:check --all` must pass before merging into `next`.
   - The 1.x workflows (`ci.yml`, `checks.yml`, `release.yml`, `website.yml`) still call root scripts that no longer exist. They only trigger on `main` or on pull requests, so pushing `next` runs just `commit.yml` (commitlint, root `.commitlintrc.json`). Don't open pull requests against `next` until CI is reworked.
   - `website.yml` deploys chartist.dev from `main`. It must be replaced by the Astro docs deployment before `main` is fast-forwarded to `next`.
   - Visual regression in CI runs on Linux Chromium (the baseline's reference platform).
   - **Releases with `nx release`** (decided 2026-10-13), replacing the 1.x simple-release setup (`.simple-release.json`, `trigensoftware/simple-release-action`, and probably `clean-publish`). Model: the author's `../exprit` repo (`nx.json` `release` block, `.github/workflows/{ci,release,docs}.yml`):
     - `nx release` with conventional commits: version bump, workspace `CHANGELOG.md` (continuing the 1.x file), `v{version}` tags (same pattern as the 1.x tags), GitHub release, npm publish. Released project: `chartist` only.
     - The release workflow runs after green CI and waits for approval in a `release` environment; a manual run can pick the version, do a dry run or only re-publish a tagged version.
     - npm trusted publishing via OIDC (no stored token, provenance attached). Needs the trusted publisher configured on npmjs.com for `chartist` by an npm owner of the package.
     - Adaptations for Chartist: pre-releases (`2.0.0-alpha.x`/`-beta.x`) from `next` under the npm `next` dist-tag; CI adds the visual regression and playground e2e tests (Playwright Chromium; WebKit/Firefox for the playground); the docs workflow builds and deploys the Astro site (chartist.dev domain) instead of `website.yml`.
     - Revisit then whether `CHANGELOG.md` stays excluded from oxfmt (Nx writes it).

## Change roadmap (OpenSpec)

1. `add-library-distribution`: ESM/browser ESM/UMD/CJS builds, exports map, Sass sources, size budgets. Done (archived, spec `library-distribution`).
2. `define-core-architecture`: pipeline phases, scene graph, renderers, composition, responsive modes, v1 compat, functional API with immutable events, the kept 1.x export surface and public API tests. Done (archived 2026-10-13).
3. `add-visual-regression-harness`: Playwright screenshot tests that **reuse the example definitions shared with the docs site**. Done (archived, specs `chart-examples` and `visual-regression`):
   - The examples live in `packages/examples` (private `@chartist/examples`) as small HTML + TypeScript + CSS projects (Vite app shape) with a typed manifest: the 32 1.x sandboxes plus test-only ports of the 1.x story cases. The docs site, the playground and the test harness all consume them.
   - The harness serves each example's own page with Vite, adding only a test font and a fixed container size, so a docs redesign doesn't break the screenshots.
   - The baseline (67 images) is recorded from published 1.5.0, and the local build matches it. Storybook and storyshots are removed.
   - chartist.dev's CodeSandbox embeds point at the sandboxes on `main`, which keeps them until the v2 release.
4. Core implementation steps (see `define-core-architecture` design, "Migration Plan"). First: `add-public-api-tests`, a suite that tests the built package only through its entry points (export lists, type tests, behavior). Done (archived 2026-10-13, spec `public-api`): `test:api` runs it against the local build, `test:api:v1` against published 1.5.0. Then `add-core-pipeline` (archived 2026-10-13, spec `chart-composition` gains custom layers): scene graph, pipeline with return-value events, `toScene`, `renderToString`, DOM renderer, `chart()` with custom layers, exported as `@experimental`. Scene nodes have no `ref` field; `mount` listeners get `elementOf(node)`, and the compat plugin will adopt live elements through the same map (deviation from the architecture's D2). Step 4 is split in two:
   - `add-line-chart` (archived 2026-10-13, spec `chart-composition` gains axis factories): axis factories (`stepAxis`, `autoScaleAxis`, `fixedScaleAxis`, opt-in through `cartesianAxes()`), the `line()` layer and the `lineChart()` preset next to the untouched 1.x `LineChart`. Parity is proven by 35 jsdom markup fixtures and by a visual run with `LineChart` swapped for a shim over `lineChart` (`test:visual:v2`, removed again by `add-compat-plugin`): every line example without 1.x events matched the 1.5 baseline pixel for pixel.
   - `add-compat-plugin` (archived 2026-10-13, specs `v1-compatibility`, `chart-pipeline`, `chart-composition` and `library-distribution` updated): `LineChart` is a wrapper over `lineChart` (it still extends the 1.x `BaseChart`); the opt-in `compat` plugin (`chartist/compat`, all formats) restores the 1.x events after rendering, in 1.x order; `fromLegacyPlugin()` converts 1.x plugins for the functional API, while the class API runs them with `compat`. The jsdom parity tests and a new event-parity test compare with the published 1.5.0, and `test:visual` renders every line example (the event examples with `compat`) through `lineChart`. The DOM host measures like 1.x (a probe svg in the container).
   - Step 5, bar and pie:
     - `add-bar-chart` (archived 2026-10-13, spec `chart-composition` gains axis kinds and normalization): the `bar()` layer, `barChart()`, `BarChart` as a wrapper. Shared infrastructure: `createPreset()` behind both presets, the `PresetChart` base class of the 1.x wrappers, axes reporting `kind`/`stretch`, 1.x normalization options in `cartesianAxes()`. Compat emits bar events and follows each chart's axis order. Parity (markup and events) against 1.5.0 for 27 bar fixtures; the visual baseline is unchanged.
     - `add-pie-chart` (archived 2026-10-13, spec `chart-pipeline` gains the chart area minimum): the `pie()` layer (the first polar layer), `pieChart()`, `PieChart` as a wrapper (keeps `moveLabel()` and the `determineAnchorPosition` export); charts without axes get the 1.x area minimums. Compat emits `slice` and `label` events. Parity (markup and events) against 1.5.0 for 28 pie fixtures; every example now renders through a v2 preset, and the visual baseline is unchanged.
     - Inventory (2026-10-13): no dead modules. The functional API (`chart()`, `lineChart`, `barChart`, `pieChart`) bundles no 1.x class code. The 1.x classes carry about 2.8 kB minified (~1 kB gzipped) of `BaseChart`, `optionsProvider` and `EventEmitter` that `PresetChart` overrides. Small duplicates: `getSeriesOption` (1.x export and line layer), `getSerialSums` (bar layer and compat).
     - Decided with the author (2026-10-13): keep `PresetChart extends BaseChart` for now. It only costs 1.x class users, and custom 1.x `BaseChart` subclasses keep working. Option for later: `PresetChart` standalone with a `Symbol.hasInstance` on `BaseChart` (keeps `instanceof`, drops the ~1 kB, fixes the 1.5 timer-before-throw bug). The `src/legacy/` move and the small cleanups are deferred too; they don't change bundles.
   - Step 6, composed charts and new features (functional API only):
     - `add-composed-charts` (archived 2026-10-13, spec `chart-composition`: multiple axes with ids and sides, series selection, grid and label layers, centered lines): `cartesianAxes([...])` takes a list of axes, several per side stacking outward; `line()` and `bar()` select series and bind to axes by id, and each axis covers only its bound series; `axisGrid()` and `axisLabels()` draw composed charts' axes with the 1.x classes. Presets use an internal axes core without the binding. New examples `composed/bar-and-line` and `composed/two-y-axes` (baselines from v2; the 1.5 run skips them).
     - `add-svg-text-labels` (archived 2026-10-13, spec `chart-rendering`: label mode per renderer, wrapped and aligned SVG text labels). Decided with the author: the label mode comes from the rendering path, not an abstract scene node. The DOM renderer draws HTML labels (1.x markup), `toScene()` SVG text; a `labels: 'html' | 'svg'` option on the chart config, `toScene()`, `lineChart`/`barChart` and `axisLabels()` overrides it. SVG labels wrap into `tspan`s and get their alignment from the layout; charts that measured text lay out again when web fonts load. The 1.x classes always draw HTML labels. Also fixed: the HTML labels of composed charts lacked the flexbox alignment.
     - `add-container-queries` (archived 2026-10-13, spec `responsive-options`: per-entry container conditions, evaluation with `Element.matchContainer()`, fallback and errors, responsive overrides for `chart()`). Decided with the author: container conditions are marked per responsive entry (`[container('(width < 400px)'), options]`), mixed with 1.x media query strings and merged in order, so users can reuse the conditions from their CSS. They are evaluated with `Element.matchContainer()` (native or the `match-container` polyfill) instead of a Chartist query parser; without the API, Chartist warns once and container entries don't match. `chart()` takes `responsive: responsive([...])` (opt-in, so plain charts don't bundle the watcher). See "Standards to monitor".
   - Step 6 is complete: every planned core feature is in. Next: the docs site (step 6 below).
5. Playground spike (see goal 5), before the docs change. It validates: an import map loading the workspace build in a static Astro build under a base path; sucrase vs ts-blank-space (size, speed, error experience); CSS imports from TypeScript; edit-and-rerender on Chrome, Safari/iOS and Firefox; example files staying identical to a working `npm create vite` project; optionally LiveCodes with a same-site import URL.
   - Spike done 2026-10-12 (`add-playground-repl`, archived, spec `example-playground`; `packages/playground`). The DIY pipeline works in Chromium, Firefox and WebKit from a static build under `/chartist/` (51 Playwright tests). LiveCodes and `@rolldown/browser` aren't needed.
   - Decided with the author (2026-10-12):
     - **sucrase** for type stripping (44 kB gzipped, cold start ~1 s on a throttled connection) over ts-blank-space (944 kB with `typescript`, ~4 s). Error messages are comparable.
     - Examples import types with `import type` / inline `type` and use only erasable syntax (`verbatimModuleSyntax`, `erasableSyntaxOnly`, enforced by the examples' type check). The `npm create vite` tsconfig fails on the 1.x style too.
     - The docs host must send `Access-Control-Allow-Origin` for the library files (GitHub Pages sends `*`); no inline fallback.
     - The editor (CodeMirror, 155 kB gzipped) is lazy-loaded on the first interaction with the code.
   - Open: real iOS Safari, a manual check of the StackBlitz export.
6. Docs site (Astro), implementing `docs/visual-design`. Current focus (2026-10-13): the library core is feature-complete for v2, so the website comes next; the release (CI rework, `nx release`) follows at the very end.
   - Decided with the author (2026-10-13): fonts are self-hosted (Fontsource: Zilla Slab, Atkinson Hyperlegible Next and Mono; no third-party requests); the first site change is the foundation plus Getting started as one real page. The design's code samples use the 1.x class API and old paths; the site shows the functional API and the real export paths, and renders every chart with Chartist (the design's `Chart` component is a mockup). The local design snapshot matched the live canvas on 2026-10-13.
   - Changes, in order:
     1. `add-css-custom-properties` (library, proposed; decided first because the site depends on it): the default CSS reads `--ct-*` custom properties with the 1.x values as fallbacks, `--ct-color` per series, and the opt-in `chartist/themes/accessible.css` (light and dark by `color-scheme`, via `light-dark()`).
     2. `add-docs-site`: the Astro app, design tokens as site CSS, fonts, Mascot and Logomark SVG components, header and footer, light/dark, docs layout (sidebar, TOC, prev/next, edit link), 404, a landing shell with the mascot presenting a live chart, and Getting started as a real MDX page with a live chart.
     3. `add-docs-content`: guides (functional API first), the migration guide (1.x → v2, `compat`, `fromLegacyPlugin`), container queries (experimental, polyfill).
     4. `add-docs-examples`: the gallery from the examples manifest, the `LiveExample` island and the full-screen playground on `packages/playground`.
     5. `add-api-reference`: generated from the TypeScript types; minimal class entries with `@see` links.
     6. Landing extras and polish: responsive and animation showcases, sponsor slot, search (Pagefind), OG cards, the v1/v0 archive links.
   - Must (decided 2026-10-13): container conditions (`container()` in responsive entries) are documented as **experimental** and as working **only with the `match-container` polyfill** (until browsers ship `Element.matchContainer()`). Every container example shows the polyfill import and the `container-type` CSS on the chart container. The playground maps `match-container` through its `imports` option (import map) for these examples.

## Standards to monitor

Platform work Chartist builds on. Check these before each release and update the docs and the polyfill advice when they move.

- **`Element.matchContainer()`** ([csswg-drafts#6205](https://github.com/w3c/csswg-drafts/issues/6205)), the `@container` counterpart of `matchMedia()`. Used by container conditions in responsive options (`add-container-queries`).
  - Status 2026-10-13: the CSSWG resolved to add it (2021); a spec PR (#13551, September 2026) adds the method without a `change` event; a Chromium prototype is behind a flag. Open: how changes are observed (event, new observer, or `ResizeObserver`), and whether the element itself counts as a container.
  - Until it ships, users load the [`match-container`](https://github.com/teetotum/match-container) polyfill (MIT, young: no tagged releases yet). Chartist depends only on `matchContainer(query).matches` and an optional `change` event, so it works with both.
  - Watch for: the final name and element semantics, a `change` event or observer, browser releases (then the docs drop "polyfill required" for those browsers and the feature may lose its experimental label).

## Open questions

- Final npm package name and scope (`chartist` stays the main package?)
- Sponsor placement for Cube in README and site (agreed deal, carry over)
- Hosting and domain (chartist.dev)
