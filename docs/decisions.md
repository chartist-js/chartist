# Decisions

The standing decisions behind Chartist: what holds today and why. Detailed behavior is in the living specs (`openspec/specs/`). When the author decides something new, add it here with its reason, or change the entry it replaces.

## History

Chartist.js started in 2014 (0.x): plain JavaScript, Sass, "style with CSS, control with JS", and a hand-crafted docs site with the Chartist Guy and live examples (archived under `/v0/` of chartist.dev; reference clone `tmp/chartist-v0`). In 2022, Cube sponsored the move to TypeScript, Rollup and pnpm (1.x) with a Docusaurus site at chartist.dev (reference clone `tmp/chartist-v1`). v2 rebuilt the library on a functional, composable core, brought back the 0.x site's personality with a new brand, and kept 1.x code working. The rebuild happened in the same repository, so the history back to 2014 is intact; the archived OpenSpec changes in `openspec/changes/archive/` are the detailed record of how and why.

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

## Layers

- **Reference lines and bands are core layers** (decided 2026-10-16): `targetLine()` and `band()`, the most common additions to line and bar charts, which 1.x left to plugins. They're ordinary layers, so they tree-shake, render on the server and in the terminal, and are styled with classes and `--ct-target-line-*` / `--ct-band-*` properties only. The size budgets were raised for them on purpose.
- **One target line per layer.** A first version took one line or `lines: [...]` as a union of two option shapes; TypeScript then reported a missing `value` as a wrong `label` type. Several lines are several layers, with plain options.
- **A band edge is a constant, values of its own, or a series.** Own values (an array, one per label) keep edges that aren't data out of `data`, so presets don't draw them as lines and the series keep their colors. A bare number is a constant; a series by index is `{ series: 2 }`.
- **Layers that change other layers' output use `refine`,** an optional layer method in the `compose` phase (decided 2026-10-16): every layer composes independently first, then each node with a role passes through the refining layers in list order, before the `compose` events. List order stays the draw order. A dependency order between layers was rejected: compose order doesn't decide draw order, and layers depend on each other's finished nodes, not their data. A refiner sees one node at a time and can't drop nodes or change the tree; charts without a refining layer skip the step. The band's `mark` option is built on it.
- **Presets take extra layers** with `layers: { below, above }`: below the series (after the grid) or above them (before the axis labels). Two lists, because a band belongs behind the data and a target line in front; the preset's own layers stay private. Responsive entries merge into it like other options, list by list.
- **A listed plugin whose use case the core covers leaves the plugins page,** and its published page redirects to the docs that cover it (`chartist-plugin-targetline` → "Target lines and bands"). `chartist-plugin-threshold` stays: the core doesn't split lines and bars at a value.

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

The `@chartist-js` packages ship ESM and CommonJS builds with declarations for both, through their `exports` maps, and depend on `chartist` with a `^{version}` range (`workspace:^` in the repository, which `pnpm publish` rewrites).

## Maintained packages

- **The `@chartist-js` npm scope** (decided 2026-10-15) holds the packages maintained next to `chartist`: renderers, plugins and wrappers, each in `packages/<name>`. `chartist` keeps its name. The first is `@chartist-js/terminal`, a terminal and text-art HTML renderer with the `ct-cli` command.
- **Shared code goes through `chartist`'s public API**, not a shared internal package (decided 2026-10-15). What a renderer needs is exported from `chartist`: the preset configs without a container (`lineChartConfig`, `barChartConfig`, `pieChartConfig`), the series colors (`seriesColors`, kept equal to `$ct-series-colors` by a test) and the SVG label metric (`textAscent`). Third-party renderers get the same, and there is no extra package to version. A private shared package was considered and dropped, because its code would be copied into every package's build.
- **Package docs live on chartist.dev** under `/packages/<name>/` (decided 2026-10-15): an overview, the package's guides and one API page generated from its types, with a "Packages" item in the header. Their sources stay with the site, in `apps/docs/src/content/packages/<slug>/`, and `apps/docs/src/data/packages.ts` registers each package. Docs inside each package's folder were considered and left for later: guides import site components, and the site's checks assume its folders.
- **Packages use only `chartist`'s published entry points** and are tested from their build: unit tests, a test of their README's examples, and a smoke test that packs and installs them.

## Releases

- **Versions:** release candidates `2.0.0-rc.N` (with the dot, so `rc.10` sorts after `rc.9`) under the npm `next` dist-tag; `npm i chartist` installs 1.x until `2.0.0`. The RC period is the last chance for breaking changes, for example dropping `@experimental` from the functional API.
- **Tooling:** `nx release` with conventional commits: the version, the workspace `CHANGELOG.md` (continuing the 1.x one), `v{version}` tags as in 1.x, the GitHub release and the npm publish.
- **Lockstep:** `chartist` and the `@chartist-js` packages are one fixed release group (decided 2026-10-15): one version for all, one tag, one changelog section and one GitHub release, published by the same workflow. Independent versions were considered; lockstep keeps one version to explain and one release to approve. A new package needs a trusted publisher on npmjs.com (repository `chartist-js/chartist`, workflow `release.yml`, environment `release`) before its first release. For `@chartist-js/terminal` that is still open (2026-10-15): until it's set up, a release fails at publishing the package.
- **Changelog:** it covers the released packages only. A renderer on top of Nx's default (`tools/changelog-renderer.cjs`) leaves out commits scoped `docs`, `playground`, `examples` and `openspec`, which ship with the site, and the authors section is off. `docs`, `test`, `build`, `chore`, `refactor`, `style` and `ci` commits neither bump the version nor appear. Commit subjects may start with a name (`LineChart wraps …`), so commitlint doesn't check their case.
- **Version choice:** in order, the manual run's version, the next prerelease of the repository variable `RELEASE_PREID` (`rc` during RCs) when the current version is one, or the conventional commits. An automatic run on a final version while `RELEASE_PREID` is set stops instead of publishing `x.y.z-rc.0`. The logic is a tested script, `.github/scripts/release.mjs`.
- **Approval:** the release workflow runs after green CI on `main` and waits for the author's approval in the `release` environment. A manual run can set the version, do a dry run, or re-publish a tagged version.
- **npm:** trusted publishing via OIDC, so there is no stored token and provenance is attached. Prereleases are published under `next`, final versions under `latest`. A local `nx release` is only ever a dry run: the configuration pushes.
- **Pushing to protected `main`:** `main` keeps its protection (reviewed pull requests, no force pushes). The release pushes its commit and tag as a GitHub App ("Chartist Release") on the protection's bypass list, with its key stored as `release` environment secrets, because `GITHUB_TOKEN` can't bypass the protection and deploy keys aren't bypass actors.
- **Install instructions:** while the version is a prerelease, the site turns `npm install chartist` into `chartist@next` (and `@chartist-js/terminal` into `@chartist-js/terminal@next`) and pins CDN URLs to the exact version (ranges like `chartist@2` skip prereleases). The page sources keep the 2.0.0 wording.
- **Docs deployment:** `docs.yml` deploys chartist.dev from `main` while the repository variable `DOCS_DEPLOY` is `true`, and waits until the built version is on npm, since the release commit is pushed just before the publish.

The workflows and settings are specified in the release change (`openspec/changes/release-v2-rc/`) and, once it's archived, in the `release-process` and `continuous-integration` specs.

## Docs hosting

- **chartist.dev** serves the v2 site, from `2.0.0-rc.1` on, deployed to GitHub Pages from `main`.
- **`/v1/`** holds the 1.x docs as the static output of their last Docusaurus build; no Docusaurus stack is kept. Old 1.x URLs that v2 doesn't have redirect there.
- **`/v0/`** holds the 0.x docs, copied from the last build on the `gh-pages` branch of `gionkunz/chartist-js` without the affiliate block, the analytics and the version pop-up, and with self-hosted fonts, so they make no requests to other hosts. The version switcher and the footer link both archives.
- **The old 0.x site** (https://gionkunz.github.io/chartist-js/) redirects to chartist.dev with a page per old page: canonical link, script and instant meta refresh, since GitHub Pages can't send HTTP redirects. A page without a `#hash` goes to its v2 counterpart, an anchor v2 covers to that page, any other anchor to the same place under `/v0/`. `docs:v0-redirects` checks the targets against the build and writes the pages; a renamed v2 page or heading means running it again and pushing the result to that `gh-pages` branch.
- **Visitor counting:** GoatCounter (`chartist.goatcounter.com`), cookieless, so no consent banner. It loads only on chartist.dev, so dev, tests, previews and forks never request it, and it's the one exception to "no third-party requests" (fonts and assets are self-hosted). The `/v1/` archive isn't counted.

## Test strategy

- **The library is tested rigorously; the docs site gets happy paths** (decided 2026-10-16). Chartist's tests guard what users rely on: unit and public API tests, the 1.x parity tests and the API tests against 1.5.0, pixel comparisons with 1.5.0, the bundle size budgets and the package smoke tests. The docs e2e tests check that each page loads without errors or third-party requests, that every live example runs, and the site's interactive features and published URLs. They don't pin copy, ordering or per-page details.
- **One page per template** is enough where pages share a template: the accessibility scan opens one page per template (plus pages with components of their own) on every push, and every page only before a release. Checks of static output (share tags, the sitemap) read the built HTML instead of opening a browser per page.
- **CI checks each thing once:** the Node matrix covers the packages; the docs site is built and tested in its own workflow.

## Visual regression

- **Reference platform:** Linux x64 with the Chromium of the pinned Playwright version: GitHub's Ubuntu runners or the author's WSL2 host. Committed baselines (`packages/chartist/test/visual/__screenshots__`) are recorded only there.
- **The dev container's fonts render differently,** so it never records committed baselines. It uses `chartist:test:visual:local`, against a local baseline made from 1.5.0 by `chartist:test:visual:local-baseline`. Examples without 1.x code get their local baseline from the current build, so for those, check the committed images instead.
- Considered for later: running the visual tests in the official Playwright Docker image, so every machine matches the reference platform.

## Standards to monitor

Check these before each release and update the docs and the polyfill advice when they move.

- **`Element.matchContainer()`** ([csswg-drafts#6205](https://github.com/w3c/csswg-drafts/issues/6205)), the `@container` counterpart of `matchMedia()`, used by container conditions in responsive options. Until browsers ship it, users load the [`match-container`](https://github.com/teetotum/match-container) polyfill, and container conditions are documented as experimental and polyfill-only; every container example shows the polyfill import and the `container-type` CSS. Chartist depends only on `matchContainer(query).matches` and an optional `change` event. Watch for the final name and semantics, a `change` event or observer, and browser releases.
