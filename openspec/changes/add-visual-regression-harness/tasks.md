# Tasks

## 1. Move the sandboxes (history-preserving)

- [x] 1.1 Move commit: `git mv` each `packages/chartist/sandboxes/<type>/<name>/index.html` to `packages/examples/<type>/<name>/index.html` and `index.ts` to `packages/examples/<type>/<name>/src/main.ts` (64 files, nothing else in the commit); verify `git show --stat -M HEAD` lists 64 `R100` renames
- [x] 1.2 Deletion commit: remove the remaining sandbox `package.json` and `sandbox.config.json` files and `sandboxes/tsconfig.json`, first noting each title from `package.json` `description` for the manifest; verify `packages/chartist/sandboxes` no longer exists and the commit contains only deletions

## 2. Examples package

- [x] 2.1 Scaffold `packages/examples`: private `@chartist/examples`, `chartist` as a `workspace:*` dependency, `vite` dev dependency, `tsconfig.json` (strict, `moduleResolution: bundler`, `vite/client` types, including `*/*/src/**/*.ts` and `index.ts`), `README.md`, picked up as an Nx project. Verify `pnpm install` succeeds and `pnpm nx show project examples` lists it
- [x] 2.2 Edit the 32 moved examples (design D4 step 3): module script tag, CSS through `chartist/styles.css`, seeded generator in `line/scatter-random`. Verify each example runs with `pnpm exec vite packages/examples/<type>/<name>` without console errors (spot-check one per chart type), and that no file references Parcel or `chartist/dist/`
- [x] 2.3 Add the `typecheck` target (`tsc --noEmit`, depends on `chartist:build`) and fix the type errors it reports in the examples; verify `pnpm nx typecheck examples` passes and fails after introducing a wrong option name
- [x] 2.4 Write the typed manifest in `index.ts` for the 32 examples (id, title, type, `docs: true`, `compat` for the 7 examples using `.on(...)` or `Svg`, viewports, size, settle) and a check script (Nx target `check`). It asserts unique ids, that each folder has `index.html` and `src/main.ts`, and that every example containing `.on(` or `Svg` has `compat: true`. Verify `pnpm nx check examples` passes

## 3. Port the Storybook story cases

- [x] 3.1 Compare all 49 stories with the sandbox examples. Merge only exact matches (same data, options and handlers). Write every other story as a new `docs: false` example folder, replacing `faker` with the seeded generator. Verify the README coverage table maps all 49 stories to an example id, and that `typecheck` and `check` pass
- [x] 3.2 Carry the story viewports over to the manifest (`Adaptive`: default, tablet, mobile, mobile-landscape; `OverlappingBarsOnMobile`: default, mobile; both `size: 'viewport'`) and extend the check script to assert them from the README table; verify `pnpm nx check examples` passes

## 4. Visual regression harness

- [x] 4.1 Add exact-pinned `@playwright/test` 1.63.0, `vite` (same version as in examples), `chartist-v1` (`npm:chartist@1.5.0`) and `@chartist/examples` dev dependencies to `packages/chartist`; verify `pnpm install` succeeds and `node_modules/chartist-v1/dist/index.js` exists
- [x] 4.2 Add `test/visual/vite.config.ts` (root = `packages/examples`, per-example `/src/main.ts` rewrite, `chartist` and `chartist/styles.css` aliased to the lib chosen by `CHARTIST_LIB`, harness plugin injecting the test font and container size from design D6) and the OFL font with its license in `test/visual/fixture/`. Verify that `line/area` opens from the harness dev server with network disabled, in both lib modes, and that `git diff packages/examples` is empty
- [x] 4.3 Add `test/visual/playwright.config.ts` (Chromium only, DPR 1, light, reduced motion, platform-free `snapshotPathTemplate`, tolerance from design D8, Vite as `webServer`) and `visual.spec.ts`. The spec generates one test per manifest entry and viewport, installs the clock, waits for the chart and fonts, settles SMIL (design D7) and screenshots `#chart`. Verify `pnpm exec playwright test --list` lists one test per example and viewport
- [x] 4.4 Wire Nx targets `test:visual` (depends on `build`), `test:visual:v1` and `test:visual:update` (records against 1.5.0); verify `pnpm nx run chartist:test:visual` fails because baselines are missing and names the examples
- [x] 4.5 Measure the settle times of `line/path-animation`, `line/simple-svg-animation`, `line/svg-animation` and `pie/donut-animation` and set them in the manifest; verify by eye that each screenshot shows the end state of a real playback and that 5 consecutive runs produce identical images

## 5. Baseline

- [ ] 5.1 Record the baseline with `pnpm nx run chartist:test:visual:update` against 1.5.0 and review every image; verify one PNG exists per example and viewport, and commit the baseline on its own
- [x] 5.2 Run `test:visual:v1` and `test:visual` (local `next` build); verify both pass, and fix any difference in the build, never in the baseline
- [x] 5.3 Check that the tolerance catches real changes: temporarily shift a grid line by 1 px in `dist/index.css` and confirm `test:visual` fails with a diff image, then revert

## 6. Remove Storybook and storyshots

- [x] 6.1 Deletion commit: remove `.storybook/`, `src/charts/*/*.stories.ts`, `test/storyshots.spec.js`, `test/utils/storyshots/`, `test/__image_snapshots__/` and `.github/workflows/update-storyshots.yml`; verify the commit contains only deletions
- [x] 6.2 Edit commit: remove the Storybook, storyshots, Puppeteer, `jest-image-snapshot`, `faker` and `@storybook/*` dependencies; the `start:storybook`, `build:storybook` and `test:storyshots` scripts and Nx targets; the `.storybook` and `sandboxes` lint and format globs; the `storyshots` stage in `ci.yml` and the `build:storybook` job in `checks.yml`. Verify `pnpm install` succeeds and `pnpm nx run-many -p chartist examples -t build test:unit test:smoke test:size test:visual typecheck check lint` all pass

## 7. Docs

- [x] 7.1 Update `docs/v2-high-level-plan.md` (testing row: Playwright visual regression with Vite-served examples; roadmap step 3 status; the note that chartist.dev's CodeSandbox embeds stay on `main` until release); verify the plan has no Storybook references left except history
