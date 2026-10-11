# Chartist v2: High-Level Plan

> Living document. It records the vision and the decisions made so far. Detailed work is specified as OpenSpec changes in `openspec/`.

## Background

- **0.x (2014–2019):** the original Chartist.js by Gion Kunz. It used plain JS, Sass and an SVG-first approach with the motto "style with CSS, control with JS". Its hand-crafted docs site (Assemble/Handlebars, SSG) had the Chartist Guy mascot, live editable examples and a playful tone. Reference: `tmp/chartist-v0` (backup repo `gionkunz/chartist-js`), live at https://gionkunz.github.io/chartist-js/.
- **1.x (2022–):** cube.dev helped migrate to TypeScript, Rollup and pnpm, plus a Docusaurus site at https://chartist.dev. This kept the project alive, but the docs lost their personality, and the examples assume a bundler. Reference: `tmp/chartist-v1` (`chartist-js/chartist`).
- **v2:** a full modernization of the library, the brand and the docs. AI-assisted development makes sustained maintenance realistic again.

## Goals

1. **Bring back the soul of 0.x, made for today.** The docs should be engaging, entertaining and crafted, not a template.
2. **Modernize the brand.** That means a new Chartist Guy, logo, palette and typography. The redesign is running in parallel in Claude Design (brief: `docs/design-handoff-prompt.md`), and its output will be handed over for implementation.
3. **No bundler required.** Chartist must work directly in the browser:
   - ESM via `<script type="module">` / import from a CDN
   - UMD for classic `<script>` tags
   - CJS for older Node tooling
   - Docs examples are shown as **plain ESM first**, bundler usage second.
4. **Live, in-browser examples** like 0.x had: an embedded playground (editor + output) integrated into the docs, running sandboxed in the browser. Candidates: [almostnode](https://github.com/macaly/almostnode) or a similar in-browser bundler/runtime, or a lightweight iframe sandbox with import maps. To be evaluated.
5. **Full migration from 1.x, plus fixes and new features.** Scope research: `docs/v2-scoping.md`. Product decisions: see below.
6. **Carry the brand's hidden details forward**, quietly.

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
- Where v2 internals must differ, a **compat plugin** restores 1.x behavior (events, the `Svg` wrapper API in draw events, options). The same mechanism can let existing 0.x/1.x community plugins run on v2.

**Ecosystem**

- **Framework support: web components only**, maintained as a separate wrapper package in the monorepo. Other official wrappers may follow later.
- **Official plugins:** only the ones originally maintained by the author: accessibility, point labels, threshold (and possibly sketchy and tooltip; to be confirmed). Community plugins are supported through the compat plugin.

**Size**

- **Remain the smallest charting library.** Make everything tree-shakable: renderers, layers, axis types and plugins are separate entry points. Enforce per-entry size budgets in CI. The 1.x core is the baseline (36 kB gzipped, unminified).

## Tech decisions (so far)

| Area          | Decision                                                          | Notes                                                                                                                                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo      | Nx 23 with a TypeScript project-references setup, pnpm workspaces | Layout: `apps/*` (docs site, playgrounds), `packages/*` (library and internal libs)                                                                                                                                                                                                |
| Docs site     | Astro (SSG), in `apps/`                                           | `@nxtensions/astro` (the plugin from the original plan) is abandoned: Nx 19 / Astro ≤4 only. Candidates: `@geekvetica/nx-astro` (peer deps Nx 22–23, Astro 5–7, actively released) or plain Nx inferred tasks from the app's `package.json` scripts. Decide when creating the app. |
| Specs         | OpenSpec (`openspec/`, schema `spec-driven`)                      | Workflow: `/opsx:propose` → `/opsx:apply` → `/opsx:archive`                                                                                                                                                                                                                        |
| Formatting    | Prettier, keeping the 1.x `.prettierrc`                           | Avoids reformatting every line. Any future style change goes in its own `style:` commit, listed in `.git-blame-ignore-revs`.                                                                                                                                                       |
| Library build | TBD                                                               | Must emit ESM, CJS, UMD, `.d.ts` and CSS                                                                                                                                                                                                                                           |
| Testing       | TBD                                                               | 1.x has Jest plus image snapshot tests (`packages/chartist/test/__image_snapshots__`), which are worth keeping as a visual regression baseline                                                                                                                                     |
| Playground    | TBD                                                               | See goal 4                                                                                                                                                                                                                                                                         |

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

## Open questions

- Final npm package name and scope (`chartist` stays the main package?)
- Library build tool and test runner
- Playground technology
- Sponsor placement for Cube in README and site (agreed deal, carry over)
- Hosting and domain (chartist.dev)
