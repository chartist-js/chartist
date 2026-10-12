## Why

The core rewrite (`define-core-architecture`) promises that the 1.x chart types keep rendering like 1.5. That promise needs a screenshot baseline recorded **before** any core code changes. Today the only visual tests are Storybook 6 storyshots: Puppeteer 14, Jest 27, 55 PNGs, and a CI workflow that no longer runs since the monorepo move. The 32 runnable 1.x examples live separately in `packages/chartist/sandboxes` as CodeSandbox projects (HTML + TypeScript on Parcel).

v2 is TypeScript-native. Its docs show every example as a small HTML + TypeScript + CSS project, editable live in a browser sandbox. One shared set of such projects should feed the docs, the playground and the visual tests.

## What Changes

- **New private workspace package `packages/examples`.** Each example is a folder laid out exactly like an `npm create vite` vanilla-ts starter: `index.html`, `src/main.ts` and an optional `src/style.css`. It can be copied into a Vite app or opened in StackBlitz unchanged, and is written the way a user would write it with `import { LineChart } from 'chartist'`. A typed manifest lists each example's id, title, chart type and test settings.
- **The 32 sandboxes move in.**
  - First, move-only commits for `index.html` and `index.ts` → `src/main.ts` (renames preserved).
  - Then a separate edit commit: a module script tag, CSS through the documented `chartist/styles.css` entry, seeded randomness.
  - Their CodeSandbox scaffolding (`package.json`, `sandbox.config.json`, `tsconfig.json`) is deleted.
- **Every Storybook story case** not already covered by a sandbox becomes an example marked as test-only, so removing Storybook loses no coverage.
- **Examples are type-checked** against Chartist's published types in a `typecheck` target.
- **Compat marking.** Examples that use 1.x `draw`/`created` events or `Svg` are marked as needing the compat plugin in v2.
- **Playwright visual regression harness** in `packages/chartist` (`test:visual`). It serves the example projects with **Vite**, resolving `chartist` to the build under test. Each example's own page is rendered in a pinned screenshot environment (fixed viewport, bundled test font, settled animations) and compared.
- **Baseline from published `chartist@1.5.0`.** The same comparison must pass against the current `next` build, which also proves the tsdown build renders like the 1.5 release.
- **Storybook and storyshots are removed** in deletion-only commits:
  - `.storybook/`, `*.stories.ts`, `test/storyshots.spec.js`, `test/utils/storyshots/`, `test/__image_snapshots__/`;
  - the related dependencies (Storybook, Puppeteer, `jest-image-snapshot`, `faker`), scripts and Nx targets;
  - the `update-storyshots` workflow and the Storybook/storyshots jobs in the old 1.x workflows.
- No library code changes.

**Breaking changes vs 1.x:** none. The published package is unchanged. The removed Storybook, sandboxes and storyshots were never published. The CodeSandbox embeds on chartist.dev point at `main`, which keeps its sandboxes until the v2 release.

## Out of scope

- The Astro docs site and the live playground, which will consume `packages/examples`. Choosing the browser-only sandbox technology is a separate spike (plan, goal 5). This change only keeps the example format compatible with a Vite-based sandbox.
- The no-bundler path (`<script type="module">` from a CDN, UMD as legacy). It is already covered by the `test:smoke` target of `add-library-distribution`, and examples don't repeat it.
- Porting the 0.x-only examples (plugins, gallery). They come with the docs site.
- Making the GitHub Actions workflows work in the monorepo. That is the separate CI follow-up; this change only removes the Storybook parts.
- Cross-browser screenshots. The baseline is Chromium only.
- Visual tests for plugins, since the official plugins are not in the repo yet.

## Capabilities

### New Capabilities

- `chart-examples`: the shared examples package. Covers:
  - the example project format (HTML + TypeScript + CSS, Vite app shape);
  - the manifest;
  - type checking;
  - coverage of all 1.x sandboxes and story cases;
  - determinism and compat marking.
- `visual-regression`: the screenshot harness. Covers:
  - serving examples against a selectable build;
  - the screenshot environment and settling animations;
  - viewports;
  - baseline storage and updates, and the 1.5 baseline.

### Modified Capabilities

None. `library-distribution` is unaffected.

## Impact

- **New:** `packages/examples` (private, not published) and `packages/chartist/test/visual/` (Playwright config, Vite harness config, specs, `__screenshots__/`).
- **Moved:** `packages/chartist/sandboxes/<type>/<name>/index.html` → `packages/examples/<type>/<name>/index.html` and `…/index.ts` → `…/src/main.ts`.
- **Removed:** Storybook config and stories, storyshots tests, 55 PNG snapshots, CodeSandbox scaffolding, `update-storyshots.yml`.
- **`packages/chartist/package.json`:**
  - adds `@playwright/test` (pinned to the existing `playwright` 1.63.0), `vite`, the `chartist-v1` alias for `chartist@1.5.0` and the examples package;
  - removes the Storybook, Puppeteer, `jest-image-snapshot` and `faker` dependencies;
  - adds the `test:visual` and `test:visual:update` scripts and Nx targets, and removes `start:storybook`, `build:storybook` and `test:storyshots`;
  - drops `.storybook` and `sandboxes` from the lint and format globs.
- **Repo:**
  - `pnpm-lock.yaml`;
  - `docs/v2-high-level-plan.md` (roadmap, testing row);
  - `CLAUDE.md` and `openspec/config.yaml` (the TypeScript-native example rule, decided 2026-10-12).
