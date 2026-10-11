# Proposal

## Why

1.x broke the "drop a script tag and go" experience that made Chartist popular (theme A in `docs/v2-scoping.md`, highest priority). Users can't find a standalone HTML example or a precompiled browser build (#1399, #1388, #1361), old CDN URLs serve 0.x (#1404), `chartist.min.js` is gone from npm (backup issue #4), and the styles have been hard to consume: the CSS path was not exported (#1368), Sass sources went missing (#1355), and the CSS source map points to a `src/styles/index.scss` that is not published (#1409). The 1.x build (Rollup 2, `rollup-plugin-swc`, `rollup-plugin-terser`, a hand-rolled styles script and a separate `tsc` pass, chained with `&` in an npm script) is also unmaintained, not cached by Nx and currently fails on `tsc` in the monorepo. The library build is the foundation for every later v2 phase, so it comes first.

## What Changes

- Replace the 1.x Rollup + `tsc` build of `packages/chartist` with a single, Nx-cached `build` target that emits:
  - `dist/index.js`: ESM for bundlers (unminified, tree-shakable, no runtime dependencies)
  - `dist/index.min.js`: minified, self-contained ESM for `<script type="module">` and CDN imports (**new**)
  - `dist/index.cjs`: CommonJS
  - `dist/index.umd.js`: minified UMD exposing the global `Chartist` (same path and behavior as 1.x)
  - `dist/chartist.min.js`: alias of the UMD build at the 0.x file name (**new**, restores the 0.x path)
  - `dist/index.d.ts` and `dist/index.d.cts`: bundled type declarations for `import` and `require` (`.d.cts` is **new**)
  - `dist/index.css` (readable) and `dist/index.min.css` (minified), plus a `dist/chartist.min.css` 0.x-name alias (**new**)
  - Sass sources in `dist/scss/` (**new**), with the 1.x `dist/index.scss` and `dist/_settings.scss` kept as forwarding entry points
  - Source maps that embed their sources (no references to unpublished files)
- Define a clean `package.json` `exports` map: `types` per condition, `import`, `require`, `style` and `sass` conditions on the root entry, `./styles.css`, `./scss/*`, `./package.json`, and the 1.x `./dist/*` wildcard. Keep `main`, `module`, `types`, `style`, `unpkg` and `jsdelivr` fields so bare CDN URLs (`cdn.jsdelivr.net/npm/chartist`, `unpkg.com/chartist`) keep serving the UMD build.
- Enforce gzip size budgets for the browser builds, the tree-shaken per-chart imports and the CSS, as an Nx target.
- Add a smoke test that loads the UMD and browser-ESM builds in plain HTML pages (no bundler) in a real browser and renders charts, and checks that every 1.x import path still resolves.
- Ship copy-paste standalone HTML examples (`packages/chartist/examples/`) and document CDN usage in the README.
- Remove the obsolete Rollup config and Rollup/terser/swc-rollup and `@size-limit/preset-big-lib` dependencies.

Breaking changes vs 1.x: **none**. Every 1.x entry point keeps its path and format (`chartist` via `import` and `require`, `chartist/dist/index.js`, `chartist/dist/index.cjs`, `chartist/dist/index.umd.js`, `chartist/dist/index.css`, `chartist/dist/index.scss`, `chartist/dist/_settings.scss`, `chartist/dist/index.d.ts`, the bare CDN URLs and the `Chartist` global). Two non-API differences are documented in design.md: `dist/index.css` is now readable instead of minified (the minified file is `dist/index.min.css`), and type declarations are bundled into `dist/index.d.ts` instead of one `.d.ts` per source file (every type stays exported from the package root; only undocumented type-only deep imports of the internal `.d.ts` tree are affected).

Out of scope:

- New entry points per chart, renderer or plugin (that comes with the v2 core architecture; the build setup must make adding them easy).
- Publishing/release automation (`nx release`, npm provenance, the `next` dist-tag), CI workflow updates, and moving README/licenses into the package directory (tracked as follow-ups).
- Changes to the library source or its runtime behavior, styling or theming (theme B), SSR safety (theme G).
- `apps/docs-v1`, Storybook and its storyshots.
- Bower (#1344) and committing `dist` to the repository (#1361): Bower is deprecated, and npm plus the npm-backed CDNs (jsDelivr, unpkg) serve every built file, which covers the "download a precompiled file" use case.

## Capabilities

### New Capabilities

- `library-distribution`: the published artifacts of the `chartist` package (formats, file names, `exports` map, CDN entry points, styles and Sass sources, type declarations, source maps), their compatibility with 1.x import paths, and the size budgets they must meet.

### Modified Capabilities

None (no specs exist yet).

## Impact

- `packages/chartist`: `package.json` (scripts, fields, `exports`, devDependencies, Nx target config), new `tsdown.config.ts`, rewritten `scripts/styles.cjs`, new `.size-limit.json` budgets, new `test/smoke/` and `examples/`; `rollup.config.js` removed.
- Dependencies: adds `tsdown`, `size-limit` 14 with `@size-limit/file` and `@size-limit/esbuild`, and `playwright` (dev only); removes `rollup`, `rollup-plugin-swc`, `rollup-plugin-terser`, `@rollup/plugin-node-resolve`, `@size-limit/preset-big-lib`; upgrades `typescript` in the package to 5.x if the declaration bundler requires it.
- Nx: `chartist:build`, `chartist:test:size` and `chartist:test:smoke` become cached targets with explicit inputs and outputs.
- README: adds a "Use it without a bundler" section with CDN examples.
- No runtime or API change for consumers.
