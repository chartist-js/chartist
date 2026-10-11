# Tasks

## 1. Dependencies

- [x] 1.1 Add exact-pinned `tsdown`, `size-limit`, `@size-limit/file`, `@size-limit/esbuild` and `playwright` dev dependencies to `packages/chartist` (and `typescript` 5.x if the declaration bundler needs it); verify `pnpm install` succeeds and `pnpm nx run chartist:test:unit` still passes 146 tests

## 2. JavaScript and type builds

- [x] 2.1 Add `packages/chartist/tsdown.config.ts` with the five builds from design.md (ESM, CJS + `.d.cts`, ESM declarations, minified browser ESM, minified UMD `Chartist`) plus the `chartist.min.js` copy; verify `pnpm exec tsdown` in the package emits `index.js`, `index.cjs`, `index.d.ts`, `index.d.cts`, `index.min.js`, `index.umd.js`, `chartist.min.js` and maps, and that `index.js`/`index.min.js` are single files without imports
- [x] 2.2 Verify every JS source map embeds `sourcesContent` and that `node -e "require('./dist/index.cjs')"` exposes `LineChart`, `BarChart`, `PieChart` and `Interpolation`

## 3. Styles and Sass sources

- [x] 3.1 Rewrite `scripts/styles.cjs` to emit `index.css` (readable), `index.min.css`, `chartist.min.css`, self-contained maps pointing to the published `scss/` copies, `dist/scss/` sources and the `dist/index.scss`/`dist/_settings.scss` forwarders; verify the files exist and `index.css.map` has relative `sources` and `sourcesContent`

## 4. Package metadata and Nx target

- [x] 4.1 Update `packages/chartist/package.json`: top-level `main`/`module`/`types`/`style`/`sass`/`unpkg`/`jsdelivr` and the `exports` map from design.md, `publishConfig` reduced to `directory`, `build` script (`del-cli dist && tsdown && node scripts/styles.cjs`), and `nx.targets.build` with cache inputs and outputs; verify `pnpm nx build chartist` succeeds and a second run is a cache hit
- [ ] 4.2 Compare the new `package.json` against `tmp/chartist-v1/package.json` (published fields after `publishConfig` merge) and verify every 1.x field and path still resolves to a file of the same format

## 5. Size budgets

- [x] 5.1 Remove `@size-limit/preset-big-lib`, replace `.size-limit.json` with gzip budgets for `index.min.js`, `index.umd.js`, tree-shaken `{ LineChart }`, `{ BarChart }`, `{ PieChart }` from `index.js`, and `index.min.css`; wire `test:size` as a cached Nx target depending on `build`; verify `pnpm nx run chartist:test:size` passes and fails when a budget is lowered below the actual size

## 6. Standalone examples and smoke test

- [ ] 6.1 Add `packages/chartist/examples/umd.html` and `examples/esm.html` (copy-paste standalone pages loading Chartist from jsDelivr) and verify they contain no bundler-specific code
- [ ] 6.2 Add `packages/chartist/test/smoke/` (Node test runner + Playwright) that serves the examples with CDN requests routed to the local `dist`, asserts charts render with no page errors, checks the 0.x `chartist.min.js` alias and bare CDN URLs, checks every 1.x and new import path through the `exports` map, and compiles the Sass entry points; wire `test:smoke` as an Nx target depending on `build`; verify `pnpm nx run chartist:test:smoke` passes
- [ ] 6.3 Add a "Use it without a bundler" section with the CDN snippets to the README and verify the snippets match the tested examples

## 7. Cleanup

- [ ] 7.1 Delete `rollup.config.js` in a deletion-only commit and remove `rollup`, `rollup-plugin-swc`, `rollup-plugin-terser`, `@rollup/plugin-node-resolve` and the obsolete `emitDeclarations` script; verify `pnpm install`, `pnpm nx build chartist` and `pnpm nx run chartist:test:unit` still pass

## 8. Integration check

- [ ] 8.1 Run `pnpm nx run-many -t build test:unit test:size test:smoke -p chartist` from a clean `dist` and record the output file table with raw and gzip sizes against 1.x; validate with `pnpm exec openspec validate add-library-distribution`

## Workflow follow-up

- CI: install Playwright Chromium and run `build`, `test:size` and `test:smoke` through Nx (the 1.x workflows still call root scripts).
- Release: publish from `packages/chartist` with README and license files, `next` dist-tag, `nx release`.
- Archive the change after review.
