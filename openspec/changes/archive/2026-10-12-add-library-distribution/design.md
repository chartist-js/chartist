# Design

## Context

See proposal.md for motivation. Current state of `packages/chartist` (the moved 1.x package):

- `build` is the npm script `rollup -c & pnpm build:styles & pnpm emitDeclarations`. Nx infers it as an uncached `nx:run-script` target. The `&` chain hides failures, and the `tsc` step currently fails in the monorepo (`NodeJS.Timer` vs the hoisted `@types/node`).
- Rollup 2 + `rollup-plugin-swc` (unmaintained) + `rollup-plugin-terser` (deprecated) emit `index.cjs` and `index.js` (unminified) and `index.umd.js` (minified). `tsc` emits one `.d.ts` per source file. `scripts/styles.cjs` compiles Sass, runs PostCSS (`postcss-preset-env` + `cssnano`, so `index.css` was minified) and copies the Sass files flat into `dist`.
- 1.x published from a `clean-publish` copy where `publishConfig` replaced `main` (`./src/index.ts` in the repo) with the dist paths. Published 1.x fields: `main: ./dist/index.cjs`, `module: ./dist/index.js`, `types: ./dist/index.d.ts`, `style: ./dist/index.css`, `unpkg`/`jsdelivr: ./dist/index.umd.js`, `exports: { ".": { require, import }, "./dist/*": "./dist/*" }`, `sideEffects: ["*.css", "*.scss"]`.
- The CSS source map listed `/src/styles/index.scss` (cwd stripped), a path that is not published. That is #1409.
- Baseline sizes (1.x build): `index.cjs` 159.9 kB raw / 36.2 kB gzip (unminified, with JSDoc), `index.umd.js` 34.6 kB / 11.8 kB gzip, `index.css` 1.3 kB gzip.

## Goals / Non-Goals

**Goals:**

- One cached Nx `build` target producing every artifact in the spec, reproducibly and fast.
- Keep bundles as small as 1.x or smaller, and enforce that.
- A test that proves the no-bundler story in a real browser, using the same HTML we tell users to copy.
- A build config where adding entry points later (per chart, renderer, plugin) is a one-line change.

**Non-Goals:**

- Changing library source code or behavior. The one exception allowed is a type-only fix if the declaration build needs it.
- Release automation and CI wiring (follow-ups).

## Decisions

### 1. Build tool: tsdown (Rolldown + Oxc)

Candidates, measured on the unchanged 1.x sources (gzip -9 of the browser ESM build):

| Option                                                                    | Notes                                                                                                                                                                                                                                                 | Minified ESM gzip                    |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Keep Rollup 2 + swc + terser                                              | Plugins are unmaintained/deprecated; still needs a separate `tsc` pass for types and a d.ts tree without `.d.cts`.                                                                                                                                    | 11.77 kB (1.x UMD)                   |
| Rollup 4 + `@rollup/plugin-terser` + swc/esbuild + `rollup-plugin-dts`    | Mature, but four or five plugins to wire and keep in sync.                                                                                                                                                                                            | ~11.70 kB (terser on the same input) |
| **tsdown 0.23** (Rolldown + Oxc transform/minify + `rolldown-plugin-dts`) | One dev dependency. ESM, CJS, UMD and IIFE formats, bundled `.d.ts` **and** `.d.cts`, source maps with embedded sources, sub-second builds. Config is a typed array of builds, so new entry points are trivial. Maintained by the Vite/VoidZero team. | **11.76 kB**                         |
| Vite library mode                                                         | Pulls in all of Vite; types need `vite-plugin-dts`; UMD is supported but CJS+UMD+ESM in one config is clumsy.                                                                                                                                         | n/a                                  |
| esbuild / tsup                                                            | esbuild has no UMD output; tsup is in maintenance mode and recommends tsdown.                                                                                                                                                                         | n/a                                  |

Oxc's minifier lands within 0.5 % of terser (terser with `passes: 2`: 11.70 kB, Oxc: 11.76 kB), which is noise compared with what tree-shaking and the v2 architecture will save. tsdown is pre-1.0, so the version is pinned exactly and the config sticks to documented options; the build is small enough that switching back to Rollup 4 later would be a one-file change. Nx runs it through the package's `build` script (inferred target) with explicit cache inputs and outputs in the package's `nx` config, so no Nx plugin is needed.

Builds (one tsdown config array, all `platform: neutral`, `target: es2022`, which matches 1.x output: native classes and class fields under the browserslist `defaults` query):

1. ESM `dist/index.js`, unminified, source map.
2. CJS `dist/index.cjs` with `dist/index.d.cts` (tsdown builds CJS declarations in a separate pass).
3. Declarations only, ESM: `dist/index.d.ts`. Kept separate from build 1 because enabling declarations in the same Rolldown graph makes it split the runtime helper into a shared chunk, and the published ESM must stay a single file.
4. ESM `dist/index.min.js`, minified.
5. UMD `dist/index.umd.js`, minified, `name: Chartist`, named exports (like 1.x). After the build it is copied to `dist/chartist.min.js` (with its map) for the 0.x file name.

### 2. Declarations are bundled

`dist/index.d.ts` and `dist/index.d.cts` are single bundled files instead of the 1.x per-file tree (`dist/charts/LineChart/LineChart.d.ts`, ...). Reasons: a `.d.cts` is required for correct `require` typing under `node16`/`nodenext` (1.x had none, so CJS TypeScript users got no or wrong types), and two parallel trees would double the package. Every type is re-exported from the root (checked: every folder barrel is `export *`-ed from `src/index.ts`), so no public type disappears from the package root. Type-only deep imports such as `chartist/dist/charts/index.js` could technically resolve in 1.x through the `./dist/*` wildcard, but they were never documented and there is no JS behind them. This is the only path-level difference from 1.x. **Review item for the author:** if it matters, the per-file tree can additionally be emitted with `tsc` at the cost of about 100 extra files.

### 3. Styles: keep Sass + PostCSS, emit readable and minified CSS

The existing `sass`, `postcss`, `postcss-preset-env` and `cssnano` dev dependencies are reused (no new dependencies; Storybook uses the same PostCSS config). `scripts/styles.cjs` is rewritten to:

- compile `src/styles/index.scss` once, run `postcss-preset-env` → `dist/index.css` (readable), then `cssnano` → `dist/index.min.css`; copy to `dist/chartist.min.css`;
- write source maps whose `sources` are relative to `dist` and point to the **published** Sass copies (`scss/index.scss`, `scss/_settings.scss`) and embed `sourcesContent` (fixes #1409);
- copy `src/styles/*.scss` to `dist/scss/`, and write two one-line forwarders `dist/index.scss` (`@import "scss/index";`) and `dist/_settings.scss` (`@import "scss/settings";`) so the 1.x Sass paths keep working, including `!default` overrides, without duplicating the sources.

`dist/index.css` becomes readable instead of minified. That is not an API change (same rules), it gzips to about the same size, and it matches the `index.js`/`index.min.js` convention. CDN users who want the smallest file use `index.min.css`. **Review item for the author.** Alternative considered: Lightning CSS (one native dependency replacing preset-env + cssnano). Rejected for now to avoid a new dependency while Storybook still needs the PostCSS stack; worth revisiting with the theming work (theme B).

### 4. Exports map and package fields

```jsonc
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "style": "./dist/index.css",
  "sass": "./dist/scss/index.scss",
  "unpkg": "./dist/index.umd.js",
  "jsdelivr": "./dist/index.umd.js",
  "exports": {
    ".": {
      "sass": "./dist/scss/index.scss",
      "style": "./dist/index.css",
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      },
      "default": "./dist/index.js"
    },
    "./styles.css": "./dist/index.css",
    "./scss/*": "./dist/scss/*",
    "./package.json": "./package.json",
    "./dist/*": "./dist/*"
  }
}
```

- The published fields move from `publishConfig` to the top level; `publishConfig` keeps only `directory: package` for the existing `clean-publish` flow. Nothing in the workspace consumed `main: ./src/index.ts` except the deleted Rollup config (Jest and Storybook use the `chartist-dev` alias).
- `sass`/`style` conditions come first in `.` because they are only set by style resolvers (Sass's `pkg:` importer, webpack `css-loader`/`sass-loader`, Vite and PostCSS `@import`); JS resolvers skip them.
- Bare CDN URLs stay on UMD (not on the ESM build): 1.x's maintainers recommended `cdn.jsdelivr.net/npm/chartist` for classic script tags in #1404, so switching it to ESM would break pages. The ESM path is explicit: `.../dist/index.min.js` (jsDelivr's automatic `/+esm` endpoint also works).
- `./dist/*` stays for 1.x compatibility (it also exposes the new files). `sideEffects` stays `["*.css", "*.scss"]`.

### 5. Size budgets: size-limit 14 with `@size-limit/file` and `@size-limit/esbuild`

size-limit is already the 1.x tool, so budgets and the `test:size` script carry over. `@size-limit/preset-big-lib` (webpack + headless Chrome timing) is replaced by the lightweight `file` plugin (gzip size of a file) and the `esbuild` plugin (size of a tree-shaken `import { X }`). Budgets sit a few percent above the measured size so regressions are caught early; raising one is an explicit, reviewable change to `.size-limit.json`. Wired as the Nx target `test:size` (cached, depends on `build`).

### 6. Smoke test: Playwright library + Node's test runner

jsdom cannot run `<script type="module">` and does not lay out SVG, so it cannot prove the ESM-in-the-browser story. Playwright's library package (`playwright`, no `@playwright/test` runner) drives headless Chromium from a `node --test` file, so there is no extra test framework. Pages are served without a web server: `page.route()` maps `https://cdn.jsdelivr.net/npm/chartist*/…` and `https://unpkg.com/chartist*/…` to the local `dist` (resolving bare URLs through the `jsdelivr`/`unpkg` fields). This lets the test open the **exact standalone examples** in `packages/chartist/examples/` that users copy (#1399), unchanged. The same test file also checks, in Node, that every 1.x import path and new subpath resolves through the `exports` map (via a temporary `node_modules/chartist` symlink) and that the Sass entry points compile with Sass's `NodePackageImporter` and with a `node_modules` load path.

Puppeteer is already a devDependency (Storybook storyshots), but it is pinned to v14 for Storybook 6, so reusing it would tie the smoke test to a 2022 Chromium. Playwright reuses the browsers in `~/.cache/ms-playwright`; CI needs `pnpm exec playwright install chromium`.

### 7. Nx wiring

Targets stay inferred from `package.json` scripts; the package's `nx.targets` adds caching, inputs and outputs:

- `build`: inputs = production sources (excluding specs and stories), `tsdown.config.ts`, `scripts/styles.cjs`, PostCSS/browserslist/tsconfig files and the `tsdown`/`sass` versions; outputs = `{projectRoot}/dist`.
- `test:size` and `test:smoke`: `dependsOn: ["build"]`, inputs include the build outputs and their own config/test files.

## Risks / Trade-offs

- [tsdown is pre-1.0; minor versions may change defaults] → Exact version pin, documented options only, smoke test plus size budgets catch output changes.
- [Bundled `.d.ts` instead of the per-file tree] → Every type stays exported from the root; flagged for review.
- [`dist/index.css` is no longer minified] → Same rules; `index.min.css` added; flagged for review.
- [`dist/chartist.min.js` restores the 0.x file name but not the 0.x API (`Chartist.Line` became `Chartist.LineChart` in 1.0)] → Documented; a 0.x API shim belongs to the planned compat plugin, not to distribution.
- [Smoke test needs a Chromium download in CI] → Uses the shared Playwright browser cache; the install step is a follow-up for the CI workflow.
- [Publishing from `packages/chartist` misses README and license files, which live at the repo root] → Pre-existing since the monorepo move; follow-up in the release change.

## Migration Plan

No consumer migration. Inside the repo: `pnpm nx build chartist` replaces `pnpm build`; the Rollup config and its dependencies are deleted in a deletion-only commit. Rollback = revert the change commits.

## Open Questions

- Which version the docs and examples should pin in CDN URLs (`chartist@1` vs `chartist@2` vs unpinned) depends on whether this ships in a 1.x minor or with 2.0. The examples use unpinned URLs for now.
