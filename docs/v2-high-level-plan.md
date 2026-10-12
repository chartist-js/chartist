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
- **Event-based extension system** stays the core extension mechanism (it proved valuable in 0.x/1.x). It gets typed hooks at every pipeline stage: data, layout, scene/draw, render.
- **Composable charts.** One chart can combine several series layers (e.g. bar + line) on shared axes. This answers #37, the most-wanted issue of all time.
- **Composable multi-axis.** An XY chart can have several axes, e.g. a left and a right Y axis (#1058, #1405).
- **Responsive configuration** supports both window media queries (1.x behavior) and **container queries**. It is switchable by config and builds on modern browser APIs (`ResizeObserver`, container query conditions).

**Compatibility**

- **Aim for zero breaking changes.** `LineChart`, `BarChart` and `PieChart` remain, as presets on top of the composable core.
- **Opt-in compat plugin** (`chartist/compat`, decided 2026-10-12). It restores the 1.x events, the `Svg` wrapper and 1.x plugins. The core ships no compat code; using 1.x events or plugins without it logs a one-time warning with migration instructions. The same mechanism can later let 0.x community plugins run on v2. Details: `openspec/changes/define-core-architecture` (design D6).

**Ecosystem**

- **Framework support: web components only**, maintained as a separate wrapper package in the monorepo. Other official wrappers may follow later.
- **Official plugins:** only the ones originally maintained by the author: accessibility, point labels, threshold (and possibly sketchy and tooltip; to be confirmed). Community plugins are supported through the compat plugin.

**Size**

- **Remain the smallest charting library.** Make everything tree-shakable: renderers, layers, axis types and plugins are separate entry points. Enforce per-entry size budgets in CI. The 1.x core is the baseline (36 kB gzipped, unminified).

## Tech decisions (so far)

| Area          | Decision                                                                  | Notes                                                                                                                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo      | Nx 23 with a TypeScript project-references setup, pnpm workspaces         | Layout: `apps/*` (docs site, playgrounds), `packages/*` (library and internal libs)                                                                                                                                                                                                         |
| Docs site     | Astro (SSG), in `apps/`                                                   | `@nxtensions/astro` (the plugin from the original plan) is abandoned: Nx 19 / Astro ≤4 only. Candidates: `@geekvetica/nx-astro` (peer deps Nx 22–23, Astro 5–7, actively released) or plain Nx inferred tasks from the app's `package.json` scripts. Decide when creating the app.          |
| Specs         | OpenSpec (`openspec/`, schema `spec-driven`)                              | Workflow: `/opsx:propose` → `/opsx:apply` → `/opsx:archive`                                                                                                                                                                                                                                 |
| Formatting    | Prettier, keeping the 1.x `.prettierrc`                                   | Avoids reformatting every line. Any future style change goes in its own `style:` commit, listed in `.git-blame-ignore-revs`.                                                                                                                                                                |
| Library build | tsdown (Rolldown + Oxc), Sass + PostCSS for styles, size-limit budgets    | ESM, minified browser ESM, CJS, UMD (`Chartist`), bundled `.d.ts`/`.d.cts`, CSS + Sass sources. Rationale: OpenSpec change `add-library-distribution` (design.md)                                                                                                                           |
| Testing       | Jest (unit), Playwright visual regression with Vite-served examples       | `pnpm nx run chartist:test:visual` screenshots every `packages/examples` example (served by Vite, `chartist` resolved to the local build or to published 1.5.0) and compares it with a baseline recorded from 1.5.0. Rationale: OpenSpec change `add-visual-regression-harness` (design.md) |
| Playground    | Own TS-stripping iframe playground + "Open in StackBlitz" (spike: passed) | See goal 5. Spike: `packages/playground`, OpenSpec change `add-playground-repl` (design.md, Findings). Works in Chromium, Firefox and WebKit under a base path. Type stripping: sucrase (decided)                                                                                           |

## Repository layout

```
apps/docs-v1/       # 1.x Docusaurus site (moved, reference only, removed once the v2 docs ship)
apps/               # v2 docs website (Astro), demos
packages/chartist/  # the library (moved from the 1.x repo root)
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
  3. Later: remove obsolete 1.x tooling in deletion-only commits, then regular OpenSpec-driven work.
- **Branches.**
  - `main` = 1.x until the v2 release.
  - `next` = v2 development (pushed to `chartist-js/chartist`).
  - At release: create `1.x` from the v1.5.0 tag for maintenance, then fast-forward `main` to `next`.
  - Integrate with merge commits or rebase, **never squash**, because a squash merge collapses the move commit and loses the renames.
- **npm.** Pre-releases are published as `2.0.0-alpha.x` / `-beta.x` under the `next` dist-tag. `npm i chartist` keeps installing v1 until the release.
- **Issues.** Use a `v2` milestone and labels for the most-wanted issues picked during scoping.
- **Cleanup (separate, optional).** About 25 stale Renovate/dependabot branches and an old `master` (last commit 2019).
- **Docs hosting.** Check how chartist.dev is deployed today (`website/CNAME` says `chartist.js.org`) before replacing it. Plan versioned docs (v2 current, v1 and v0 archives).

## Phases (rough)

1. **Foundation** (done): Nx workspace on top of the 1.x history (branch `next`), reference clones, OpenSpec, Claude Code harness, this plan.
2. **Scope definition:** review the most-wanted issues (v0.x and v1.x), define the v2 feature set and breaking changes, and write the first OpenSpec specs.
3. **Library core:** modernize the moved 1.x source in `packages/chartist`, set up the build pipeline (ESM/CJS/UMD), tests and visual regression.
4. **Docs site:** Astro app, implement the Claude Design output, playground and example gallery.
5. **Release:** v2 beta, migration guide, launch.

## Change roadmap (OpenSpec)

1. `add-library-distribution`: ESM/browser ESM/UMD/CJS builds, exports map, Sass sources, size budgets. Done (archived, spec `library-distribution`).
2. `define-core-architecture`: pipeline phases, scene graph, renderers, composition, responsive modes, v1 compat. Proposal, specs and design are written.
3. `add-visual-regression-harness`: Playwright screenshot tests that **reuse the example definitions shared with the docs site**. Implemented, pending archive:
   - The examples live in `packages/examples` (private `@chartist/examples`) as small HTML + TypeScript + CSS projects (Vite app shape) with a typed manifest: the 32 1.x sandboxes plus test-only ports of the 1.x story cases. The docs site, the playground and the test harness all consume them.
   - The harness serves each example's own page with Vite, adding only a test font and a fixed container size, so a docs redesign doesn't break the screenshots.
   - The baseline (67 images) is recorded from published 1.5.0, and the local build matches it. Storybook and storyshots are removed.
   - chartist.dev's CodeSandbox embeds point at the sandboxes on `main`, which keeps them until the v2 release.
4. Core implementation steps (see `define-core-architecture` design, "Migration Plan").
5. Playground spike (see goal 5), before the docs change. It validates: an import map loading the workspace build in a static Astro build under a base path; sucrase vs ts-blank-space (size, speed, error experience); CSS imports from TypeScript; edit-and-rerender on Chrome, Safari/iOS and Firefox; example files staying identical to a working `npm create vite` project; optionally LiveCodes with a same-site import URL.
   - Spike done 2026-10-12 (`add-playground-repl`, `packages/playground`). The DIY pipeline works in Chromium, Firefox and WebKit from a static build under `/chartist/` (51 Playwright tests). LiveCodes and `@rolldown/browser` aren't needed.
   - Decided with the author (2026-10-12):
     - **sucrase** for type stripping (44 kB gzipped, cold start ~1 s on a throttled connection) over ts-blank-space (944 kB with `typescript`, ~4 s). Error messages are comparable.
     - Examples import types with `import type` / inline `type` and use only erasable syntax (`verbatimModuleSyntax`, `erasableSyntaxOnly`, enforced by the examples' type check). The `npm create vite` tsconfig fails on the 1.x style too.
     - The docs host must send `Access-Control-Allow-Origin` for the library files (GitHub Pages sends `*`); no inline fallback.
     - The editor (CodeMirror, 155 kB gzipped) is lazy-loaded on the first interaction with the code.
   - Open: real iOS Safari, a manual check of the StackBlitz export.
6. Docs site (Astro), implementing `docs/visual-design`. It runs in parallel once examples exist.

## Open questions

- Final npm package name and scope (`chartist` stays the main package?)
- Unit test runner (Jest 27 from 1.x for now; the no-bundler smoke test uses Playwright)
- Sponsor placement for Cube in README and site (agreed deal, carry over)
- Hosting and domain (chartist.dev)
