# Decisions

The standing decisions behind Chartist: what holds today and why. Detailed behavior is in the living specs (`openspec/specs/`). When the author decides something new, add it here with its reason, or change the entry it replaces.

## History

Chartist.js started in 2014 (0.x): plain JavaScript, Sass, "style with CSS, control with JS", and a hand-crafted docs site with the Chartist Guy and live examples (archived at https://gionkunz.github.io/chartist-js/; reference clone `tmp/chartist-v0`). In 2022, Cube sponsored the move to TypeScript, Rollup and pnpm (1.x) with a Docusaurus site at chartist.dev (reference clone `tmp/chartist-v1`). v2 rebuilt the library on a functional, composable core, brought back the 0.x site's personality with a new brand, and kept 1.x code working. The rebuild happened in the same repository, so the history back to 2014 is intact; the archived OpenSpec changes in `openspec/changes/archive/` are the detailed record of how and why.

## Principles

- **CSS-first.** Style with CSS, control with JS. Charts are plain SVG with predictable classes; colors, lines, grid and labels are `--ct-*` custom properties. Options don't duplicate what CSS can do, and output has no inline `style` attributes.
- **TypeScript-native.** The library is written in TypeScript and its types are part of the API. Docs examples are small HTML + TypeScript + CSS projects in the shape of an `npm create vite` vanilla TypeScript app (`index.html`, `src/main.ts`, `src/style.css`), so they open in StackBlitz or a fresh Vite app unchanged. They use only erasable TypeScript syntax and `import type`, so the browser playground can strip types with sucrase.
- **No bundler required.** `<script type="module">` with ESM from a CDN is the primary no-bundler path, shown in Getting started next to npm. UMD ships for backwards compatibility only (documented in "Coming from 1.x", never in examples); CJS for older Node tooling.
- **Functional API first.** `chart()`, `lineChart()`, `barChart()`, `pieChart()` and layers; the core is pure from config to scene (`toScene()`, `renderToString()`), side effects stay at the edges. Event payloads are read-only: handlers transform by returning a new value. Docs, examples and doc comments use the functional API; the 1.x classes appear only where the text is about 1.x.
- **Small.** Stay the smallest charting library: everything tree-shakes, per-entry size budgets are checked (`test:size`). A budget is raised only on purpose, with the reason in the commit. The bugs found in 2.0.0-rc.1 were fixed even though it costs about 1 kB gzipped across the entries (decided 2026-10-15): fixed behavior beats the bytes.

## 1.x compatibility

- **No breaking changes for 1.x code.** `LineChart`, `BarChart` and `PieChart` are thin wrappers over the presets and draw what 1.5.0 drew; the visual tests prove it against a 1.5.0 baseline.
- **No 1.x export is removed in 2.x.** `Svg`, `SvgList`, `SvgPath`, the helpers and the other 1.x root exports stay available from `chartist` and the UMD global.
- **The 1.x API is deprecated, with removal from `chartist` in 3.0** (decided 2026-10-14). The classes and what exists only for them (axis classes, `EventEmitter`, the 1.x drawing helpers, the 1.x options and event types) carry `@deprecated` with the functional replacement, so editors stop offering `LineChart` next to `lineChart`. Names the functional API uses or documents (data types, `Svg`, `Interpolation`, the helpers) stay. The deprecation is type-level only: no runtime warnings, the UMD global unchanged. The 1.x event and plugin types are also exported, unmarked, from `chartist/compat`. A checked-in list (`packages/chartist/test/api/exports/deprecated.json`) sorts every 1.5 export. Whether the 1.x API disappears in 3.0 or moves elsewhere is decided for 3.0; a separate entry for it in 2.x was considered and dropped, because a deprecation should point forward.
- **1.x events and plugins are opt-in** through `chartist/compat`, so the runtime ships no compat code. Without it, using them logs a one-time warning with migration instructions. `fromLegacyPlugin()` brings a 1.x plugin to the functional API, and importing `chartist/compat` sets up the global `Chartist` that 0.x and 1.x plugin scripts expect.
- **New features are functional-API only** (composed charts, multiple axes, SVG text labels, container queries). The classes exist so 1.x users don't break.
- **Plugins:** the functional API takes v2 plugins (`{ name, install }`) only; the classes take 1.x plugin functions with `compat`. Official plugins, when there are any, are limited to the ones the author maintained in 0.x (accessibility, point labels, threshold); community plugins work through compat and are listed on `/plugins/`.
- **Framework support,** when it comes, is a web component in a separate wrapper package rather than one wrapper per framework.

## Repository

- This is `chartist-js/chartist`, with its stars, issues and history back to 2014. `main` is the development branch. A `1.x` branch, created from the `v1.5.0` tag, holds 1.x maintenance.
- Git doesn't record renames; it infers them from similarity. File moves, deletions and content edits therefore go in separate commits, and branches are integrated with merge commits or a rebase, never a squash merge, which would collapse a move into its edits.
- Formatting is oxfmt with the 1.x Prettier settings in `.oxfmtrc.json`. Reformat-only commits are `style:` commits listed in `.git-blame-ignore-revs`.
- Tooling: Nx 23 with pnpm workspaces; tsdown (Rolldown + Oxc) for the library, Sass + PostCSS for its CSS; oxlint; Vitest; Playwright for visual, e2e and playground tests; Astro with `@geekvetica/nx-astro` and Tailwind v4 for the docs site.

## Distribution

The `chartist` package ships, under `dist/` and through its `exports` map:

- an ESM build for bundlers (`index.js`, side-effect free) and a minified, self-contained browser ESM build (`index.min.js`) for `<script type="module">` and CDNs;
- a UMD build defining the global `Chartist` (`index.umd.js`, also as `chartist.min.js`); the bare jsDelivr and unpkg URLs serve it, as in 1.x;
- a CommonJS build (`index.cjs`) that loads in Node without a DOM;
- type declarations for both module systems (`.d.ts`, `.d.cts`);
- compiled CSS (`chartist/styles.css`), the opt-in accessible theme (`chartist/themes/accessible.css`) and the Sass sources (`chartist/scss/…`);
- `chartist/compat` in every format.

Every 1.x import path keeps resolving.

## Releases

- **Versions:** release candidates `2.0.0-rc.N` (with the dot, so `rc.10` sorts after `rc.9`) under the npm `next` dist-tag; `npm i chartist` installs 1.x until `2.0.0`. The RC period is the last chance for breaking changes, for example dropping `@experimental` from the functional API.
- **Tooling:** `nx release` with conventional commits: the version, the workspace `CHANGELOG.md` (continuing the 1.x one), `v{version}` tags as in 1.x, the GitHub release and the npm publish. Only `chartist` is released.
- **Changelog:** it covers the package only. A renderer on top of Nx's default (`tools/changelog-renderer.cjs`) leaves out commits scoped `docs`, `playground`, `examples` and `openspec`, which ship with the site, and the authors section is off. `docs`, `test`, `build`, `chore`, `refactor`, `style` and `ci` commits neither bump the version nor appear. Commit subjects may start with a name (`LineChart wraps …`), so commitlint doesn't check their case.
- **Version choice:** in order, the manual run's version, the next prerelease of the repository variable `RELEASE_PREID` (`rc` during RCs) when the current version is one, or the conventional commits. An automatic run on a final version while `RELEASE_PREID` is set stops instead of publishing `x.y.z-rc.0`. The logic is a tested script, `.github/scripts/release.mjs`.
- **Approval:** the release workflow runs after green CI on `main` and waits for the author's approval in the `release` environment. A manual run can set the version, do a dry run, or re-publish a tagged version.
- **npm:** trusted publishing via OIDC, so there is no stored token and provenance is attached. Prereleases are published under `next`, final versions under `latest`. A local `nx release` is only ever a dry run: the configuration pushes.
- **Pushing to protected `main`:** `main` keeps its protection (reviewed pull requests, no force pushes). The release pushes its commit and tag as a GitHub App ("Chartist Release") on the protection's bypass list, with its key stored as `release` environment secrets, because `GITHUB_TOKEN` can't bypass the protection and deploy keys aren't bypass actors.
- **Install instructions:** while the package version is a prerelease, the site turns `npm install chartist` into `chartist@next` and pins CDN URLs to the exact version (ranges like `chartist@2` skip prereleases). The page sources keep the 2.0.0 wording.
- **Docs deployment:** `docs.yml` deploys chartist.dev from `main` while the repository variable `DOCS_DEPLOY` is `true`, and waits until the built version is on npm, since the release commit is pushed just before the publish.

The workflows and settings are specified in the release change (`openspec/changes/release-v2-rc/`) and, once it's archived, in the `release-process` and `continuous-integration` specs.

## Docs hosting

- **chartist.dev** serves the v2 site, from `2.0.0-rc.1` on, deployed to GitHub Pages from `main`.
- **`/v1/`** holds the 1.x docs as the static output of their last Docusaurus build; no Docusaurus stack is kept. Old 1.x URLs that v2 doesn't have redirect there.
- **0.x** stays archived at https://gionkunz.github.io/chartist-js/; the version switcher and footer link both archives.
- **Visitor counting:** GoatCounter (`chartist.goatcounter.com`), cookieless, so no consent banner. It loads only on chartist.dev, so dev, tests, previews and forks never request it, and it's the one exception to "no third-party requests" (fonts and assets are self-hosted). The `/v1/` archive isn't counted.

## Visual regression

- **Reference platform:** Linux x64 with the Chromium of the pinned Playwright version: GitHub's Ubuntu runners or the author's WSL2 host. Committed baselines (`packages/chartist/test/visual/__screenshots__`) are recorded only there.
- **The dev container's fonts render differently,** so it never records committed baselines. It uses `chartist:test:visual:local`, against a local baseline made from 1.5.0 by `chartist:test:visual:local-baseline`. Examples without 1.x code get their local baseline from the current build, so for those, check the committed images instead.
- Considered for later: running the visual tests in the official Playwright Docker image, so every machine matches the reference platform.

## Standards to monitor

Check these before each release and update the docs and the polyfill advice when they move.

- **`Element.matchContainer()`** ([csswg-drafts#6205](https://github.com/w3c/csswg-drafts/issues/6205)), the `@container` counterpart of `matchMedia()`, used by container conditions in responsive options. Until browsers ship it, users load the [`match-container`](https://github.com/teetotum/match-container) polyfill, and container conditions are documented as experimental and polyfill-only; every container example shows the polyfill import and the `container-type` CSS. Chartist depends only on `matchContainer(query).matches` and an optional `change` event. Watch for the final name and semantics, a `change` event or observer, and browser releases.
