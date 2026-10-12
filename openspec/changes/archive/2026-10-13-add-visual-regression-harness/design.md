# Design

## Context

- **Sandboxes.** `packages/chartist/sandboxes/{bar,line,pie}/<name>/` holds 32 CodeSandbox projects (Parcel template). Each has:
  - `index.html`: identical in all 32, `<script defer src="./index.ts">` and a `#chart` div at `50vh`;
  - `index.ts`: `import 'chartist/dist/index.css'`, with type imports in 5 places;
  - `package.json`: the title is in `description`;
  - `sandbox.config.json`.

  `sandboxes/tsconfig.json` maps `chartist` to `../src`. chartist.dev embeds them through CodeSandbox GitHub URLs on `main`.

- **Stories.** 49 Storybook 6 stories (Line 22, Bar 15, Pie 12) in `src/charts/*/*.stories.ts`, each returning a detached `div`.
  - Two Bar stories declare extra viewports: `Adaptive` (iPad, iPhone X, iPhone X landscape) and `OverlappingBarsOnMobile` (iPhone X).
  - One Line story uses `faker`.
  - Storyshots render at 1920×1080 with Puppeteer 14 into `test/__image_snapshots__` (55 PNGs). Nothing in the monorepo runs them anymore.
- **Nondeterminism.**
  - `line/scatter-random` uses `Math.random()`.
  - Four sandboxes animate with SMIL through `draw` handlers: `path-animation`, `simple-svg-animation`, `svg-animation`, `donut-animation`. Three of them call `chart.update()` on a timer, every 8–12 s.
  - Chartist's `animate()` uses `fill: 'freeze'` in guided mode (`src/svg/animation.ts`).
- **Compat candidates.** `.on('draw'|'created')` and `Svg` appear in 7 sandboxes and 4 story cases.
- **Existing tooling.**
  - `playwright` 1.63.0 is already a dev dependency, used by `test:smoke`.
  - Published `chartist@1.5.0` ships a dependency-free ESM `dist/index.js` and `dist/index.css`.
  - Vite is not yet in the workspace (current major: 8). The Astro docs site will bring it anyway.
- **Environment.**
  - Development happens on WSL2 Linux without Docker inside the distro.
  - The 1.x GitHub workflows still run root-level scripts that no longer exist (the CI follow-up).

## Goals / Non-Goals

**Goals:**

- One example format, a Vite-style HTML + TypeScript + CSS project, that works unchanged in the visual tests, in Astro (Vite-based) for static previews, in the future browser-only playground, and in a user's own Vite app.
- A screenshot comparison that fails on real rendering changes and stays quiet on platform noise.
- Proof that both the 1.5.0 release and the current `next` build match one baseline.

**Non-Goals:**

- Choosing the playground runtime (almostnode, WebContainers, …). That needs its own spike. This design only avoids anything that a browser-side Vite or esbuild couldn't do: no custom Vite plugins in examples, no Node APIs, no path aliases.
- Pixel parity with the old storyshots PNGs. They were made with Puppeteer at 1920×1080 with system fonts, so the new baseline replaces them.

## Decisions

### D1 Example format: a Vite-style project per folder

```
packages/examples/line/area/
  index.html       <div id="chart"></div> <script type="module" src="/src/main.ts"></script>
  src/main.ts      import 'chartist/styles.css'; import { LineChart } from 'chartist'; ...
  src/style.css    (optional, only where an example customizes styles)
```

- It is exactly the `npm create vite` vanilla-ts layout (minus `package.json`, which consumers generate), so an example opens in StackBlitz or a fresh Vite app unchanged, and the playground can show the same file tree. It is also close to the shape the 1.x sandboxes already have. The main changes are the module script tag and Vite in place of Parcel. The moves therefore stay pure renames, and the edits are small.
- The CSS is imported from TypeScript through the documented `chartist/styles.css` export (part of the `library-distribution` spec). That works in Vite, Astro and the in-browser bundlers being considered.
- An example-specific `src/style.css` is imported from `src/main.ts`, as in the Vite starter, so readers see the "style with CSS" part next to the code.
- Each consumer gives every example its own page or iframe. That keeps `#chart`, window media queries and global CSS isolated.
- _Alternatives considered:_
  - Plain JS modules with `@ts-check`. Rejected by the author: v2 is TypeScript-native, and the docs should show typed usage.
  - A `mount(el)` export. Rejected: the docs would show wrapper code users don't write.

### D2 Manifest and package

`packages/examples/index.ts` (package root, next to the `bar/`, `line/` and `pie/` example folders) exports a typed `examples` array:

```ts
{ id: 'line/area', title: 'Line chart with area', type: 'line', docs: true,
  compat: false, viewports: ['default'], size: 'fixed', settle: { at: 0 } }
```

- The folder is derived from `id`.
- `size: 'viewport'` keeps the example's own container size in the harness. Responsive examples with extra viewports use it.
- Titles come from the sandbox `package.json` `description` and the story names.
- The package is private (`@chartist/examples`, `"private": true`). `chartist` is a `workspace:*` dependency, so types and dev resolution use the workspace build.
- A per-example `package.json` isn't kept. Consumers that need a standalone project (download, playground) generate it from the manifest and the current `chartist` version.

### D3 Type checking

- `packages/examples/tsconfig.json` uses strict mode, `moduleResolution: bundler` and `types: ['vite/client']` (for CSS imports), and includes `src/**/*.ts`.
- An Nx `typecheck` target runs `tsc --noEmit` against the built `chartist` declarations, so examples also check the published type surface (`.d.ts` bundling from `add-library-distribution`).

### D4 Migration with preserved history

1. **Move commit:** `git mv` each sandbox's `index.html` to `packages/examples/<type>/<name>/index.html` and its `index.ts` to `packages/examples/<type>/<name>/src/main.ts`. That's 64 pure renames; nothing else is in the commit.
2. **Deletion commit:** remove the remaining `package.json`, `sandbox.config.json` and `sandboxes/tsconfig.json`.
3. **Edit commit:**
   - script tag to `<script type="module" src="/src/main.ts">`;
   - CSS import to `chartist/styles.css`;
   - the `#chart` container keeps its 1.x inline `height: 50vh`, a sensible default when the example runs on its own;
   - seeded randomness;
   - package scaffolding and manifest.
4. **Story ports:** new example folders for the story cases not covered by a sandbox.
   - A story is merged only if its data, options and handlers are identical. Otherwise it becomes its own `docs: false` example.
   - A coverage table (story → example id) goes into `packages/examples/README.md`.

### D5 Seeded randomness

- A small seeded generator (`mulberry32`, ~8 lines) is inlined in each example that needs it, so the example stays self-contained.
- It replaces `Math.random()` (`line/scatter-random`) and `faker.datatype.number` (story "Scatter").
- `faker` is dropped.

### D6 Harness: Vite in Node plus Playwright Test

- **Location:** `packages/chartist/test/visual/`, next to `test/smoke`. `@chartist/examples` is a dev dependency.
- **Runner:** `@playwright/test` at the same 1.63.0 as `playwright` (`toHaveScreenshot`, HTML report with diffs, `--update-snapshots`).
- **Vite:** the harness starts a Vite dev server (`createServer`, as Playwright's `webServer`) with `root` set to `packages/examples`, serving each example at `/<type>/<name>/`. In a standalone Vite app, `/src/main.ts` points at the app root. In the harness, the example folder is a subfolder, so the harness plugin rewrites it to `/<type>/<name>/src/main.ts` in `transformIndexHtml`. The files on disk stay unchanged.
  - The build under test is chosen by `resolve.alias`: `chartist` → `<lib>/index.js` and `chartist/styles.css` → `<lib>/index.css`.
  - `<lib>` is `packages/chartist/dist` (default) or `node_modules/chartist-v1/dist` (`CHARTIST_LIB=v1`).
  - Example files stay untouched. TypeScript is only transpiled by Vite (esbuild/Oxc), never type-checked there.
- **Screenshot environment:** a harness-only Vite plugin (`transformIndexHtml`) injects a `<style>` with three things:
  - the bundled test font (OFL, checked into `test/visual/fixture/`);
  - `#chart { width: 640px !important; height: 360px !important }` (overriding the inline `50vh`), unless the manifest says `size: 'viewport'`;
  - a neutral body margin.

  This keeps examples free of harness code, and the docs site's styles never load.

- **Nx targets:**
  - `test:visual` depends on `build`;
  - `test:visual:v1` runs against 1.5.0;
  - `test:visual:update` records the baseline against 1.5.0.
- _Alternatives considered:_
  - `vite build` once, then serve static files. It is faster per run, but needs a build per library target and loses the instant feedback when editing examples. It may be added later for CI.
  - Routing an import map in a bare fixture, as the JS-only design did. Rejected: TypeScript needs a transform step.

### D7 Viewports and settling

- **Viewports:** named presets: `default` 1024×768, plus `mobile` 375×812, `mobile-landscape` 812×375 and `tablet` 768×1024 (the story viewports). Device scale factor is 1, color scheme light, `reducedMotion: 'reduce'`.
- **Screenshot:** the `#chart` element.
- **Settling** (revised while implementing, see below):
  - `page.clock.install()` and `page.clock.pauseAt()` before load freeze all timers, including Chartist's own `setTimeout(initialize, 0)` and, in guided mode, the `setTimeout(beginElement, begin)` that starts each SMIL animation.
  - `page.clock.runFor(1)` initializes the chart. The harness waits for the chart's `svg` and loads the test font (`document.fonts.load()`, `document.fonts.ready`, `document.fonts.check()`). No animation-frame wait: the paused clock also fakes `requestAnimationFrame`.
  - `svg.pauseAnimations()` stops the SVG timeline at its current time `start`.
  - `page.clock.runFor(settle.at)` fires the timers due until then. A harness init script makes a `beginElement()` call at clock time `t` a `beginElementAt(t)` on the paused timeline, so every guided animation begins at `start + t`, as in a real playback.
  - `svg.setCurrentTime(start + settle.at)`, then the screenshot.
  - `settle.at` is in milliseconds and defaults to 0. Animated examples set it to the end of their last animation plus about 100 ms (`fill: freeze` keeps the end state), measured in a real playback: `line/path-animation` 6100, `line/simple-svg-animation` 4400, `line/svg-animation` 8600, `pie/donut-animation` 7100. All are below the examples' `chart.update()` timers (8–12 s), which therefore never fire.
  - _Why revised:_ with timers frozen, `svg.setCurrentTime()` alone cannot show the end state, because guided animations have `begin="indefinite"` and only start when their timer fires. A first version stepped the clock and the SVG timeline in lockstep (20 ms steps); it produced the same images but took about 30 s per animated example.
- _Alternative considered:_ stripping `<animate>` elements. Rejected: it shows a state users never see.

### D8 Baseline and tolerance

- Baselines live in `test/visual/__screenshots__/<id>--<viewport>.png`. That is 67 images (63 examples, story viewports included) of roughly 10–30 kB; the `<id>` slash makes a folder per chart type.
- **Tolerance:**
  - `maxDiffPixelRatio: 0.001` and `threshold: 0.05` (revised from 0.2, see below);
  - anti-aliasing noise passes (pixelmatch ignores anti-aliased pixels, and up to 0.1 % of the pixels may differ);
  - a grid line moved by 1 px fails.
  - _Why revised:_ Chartist's grid lines are `rgba(0, 0, 0, 0.2)` dashes. On white, a moved grid line changes pixels by at most about 50 of 255 (25 where the area fill covers it), which is below pixelmatch's per-pixel threshold at 0.2 and at 0.1, so a 1 px shift of a horizontal or vertical grid line passed every example (task 5.3). At 0.05 it fails 49 of 67 (horizontal line) and 45 of 67 (vertical line) tests; the rest are pies without grids. The local build renders byte-identical images to 1.5.0, and five repeated runs are byte-identical, so the tighter threshold costs no stability.
- **Platform:** the baseline is authoritative for Linux x64 Chromium from the pinned Playwright version, as on GitHub `ubuntu-latest` runners and WSL2. Snapshot names carry no platform suffix, so macOS developers use the official Playwright Docker image or CI.
- **Recording:** recorded once against `chartist@1.5.0`, then verified against the local build. If the local build differs, that is a regression in the `add-library-distribution` build and is fixed there.

### D9 Storybook removal

All in deletion-only commits, followed by one edit commit for `package.json`, the Nx targets, the lint and format globs and the workflows:

- `.storybook/`, `*.stories.ts`, `test/storyshots.spec.js`, `test/utils/storyshots/`, `test/__image_snapshots__/`;
- `.github/workflows/update-storyshots.yml`.

The edit commit removes the `storyshots` matrix stage in `ci.yml` and the `build:storybook` job in `checks.yml`. These run only after the new baseline passes, so coverage never drops.

## Risks / Trade-offs

- [The playground spike picks a runtime that can't handle part of the example format (e.g. CSS imports from TypeScript)] → The format uses only features that every candidate (Vite, esbuild-wasm based sandboxes) supports. If something fails, the spike adjusts the format before the docs change, and the examples are easy to batch-edit.
- [Vite adds a sizable dev dependency to `chartist`] → Dev-only and shared with the upcoming Astro site through the pnpm store.
- [SMIL seeking differs from real playback in some animations] → Settle at the total duration with `fill: freeze`, and verify the four animated examples by eye once. If one doesn't settle reliably, screenshot it at `at: 0` and note why in the manifest.
- [Font rasterization differs slightly between machines] → Bundled font, DPR 1, tuned tolerance, CI as authority.
- [A Playwright version bump changes Chromium rendering] → Bumps get their own commit with a baseline update, reviewed image by image.
- [Merging stories into sandbox examples hides a slightly different case] → Merge only on exact equality. The coverage table in the README is reviewable.

## Migration Plan

1. Scaffold `packages/examples`, move the sandboxes (D4 commits 1–3), port the story cases, and get `typecheck` green.
2. Add the harness, record the baseline against 1.5.0, and verify against the local build.
3. Remove Storybook (D9).

Rollback: revert the merge. The 1.x sources are still on `main`.

## Implementation notes

- **Workspace linking.** `chartist` has `publishConfig.directory: "package"` (clean-publish), so pnpm linked the workspace package to the temporary `packages/chartist/package` folder. `publishConfig.linkDirectory: false` makes it link `packages/chartist` itself.
- **Nx graph.** `@chartist/examples` depends on `chartist` (build, types), and `chartist` has `@chartist/examples` as a dev dependency for the harness. To avoid a project cycle, `chartist` declares `implicitDependencies: ["!examples"]`, and the `test:visual` targets list the example files as inputs.
- **Type-only imports.** The examples tsconfig enables `verbatimModuleSyntax` and `erasableSyntaxOnly`, so type-only imports carry `type` and plain type stripping (Vite, a browser REPL) leaves no import of a type at runtime. Five sandboxes needed `type` on such imports.
- **Compat count.** `.on(...)` or `Svg` appear in 7 sandboxes (not 8), plus the 4 story cases, which are all merged into those sandboxes.
- **Story ports.** 18 stories merge into sandbox examples, 31 become test-only examples: 63 examples, 67 baseline images. `PieChart/GaugeDonut` and `PieChart/RelativeDonutWidth` draw a fixed 500×500 chart, larger than the 640×360 test container, so their container has no fixed height and they use `size: 'viewport'`. `PieChart/OverlappingLabels` uses a fixed date instead of `new Date()`.
- **Locale and time zone.** `line/timeseries` and `pie/overlapping-labels` format dates, so the harness pins `locale: 'en-US'` and `timezoneId: 'UTC'`.
- **Storybook removal.** `test/__image_snapshots__/` held 49 PNGs (not 55). `test/utils/skipable.js` was only used by storyshots and went with it; so did the Storybook-only webpack loaders (`postcss-loader`, `sass-loader`, `swc-loader`). CONTRIBUTING.md points to the examples and `test:visual` instead of `start:storybook`.
- **`chartist:typecheck`.** The Nx-inferred `typecheck` target of `chartist` already fails on `next` (TS errors in `BarChart.ts` and `BaseChart.ts` after the TypeScript 5.9 upgrade). This change leaves it alone; `examples:typecheck` depends on `chartist:build`, not on it.
- **Errors and network.** Each test fails on page errors, console errors or warnings, and any request to a host other than the harness server (aborted).
