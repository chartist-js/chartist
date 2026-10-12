## Why

The v2 docs show every example as a small HTML + TypeScript + CSS project that readers can edit and run in the browser (plan, goal 5). The author decided on a DIY REPL: strip TypeScript in the browser, turn CSS imports into tags, run the result in a sandboxed iframe and resolve `chartist` through an import map. Before the Astro docs site is built on top of it, a spike has to prove that this works on static hosting under a base path, in Chromium, Firefox and WebKit, with the example format from `add-visual-regression-harness` (design D1) unchanged. It also has to settle sucrase vs ts-blank-space with measurements.

## What Changes

- **New private workspace package `packages/playground`** (`@chartist/playground`, not published). It is framework-free TypeScript that the Astro docs site can embed later. Spike quality, but with a reusable API:
  - **Compile pipeline** from a set of example files (path → content) to an HTML document: TypeScript type stripping, CSS imports from TypeScript turned into `<link>`/`<style>` tags, relative module imports resolved to in-memory modules, and an import map that maps `chartist` and `chartist/styles.css` to configurable URLs.
  - **Preview** in an `<iframe sandbox="allow-scripts">` (opaque origin, no `allow-same-origin`) through `srcdoc`. Runtime errors and console output are forwarded to the host with `postMessage`.
  - **Minimal editor** (CodeMirror 6) with file tabs, debounced re-render on edit, and an error panel for compile and runtime errors. No brand styling.
  - **"Open in StackBlitz"** export through `@stackblitz/sdk`, generating a `package.json` with `vite`, `typescript` and `chartist`.
- **Demo page** in the package, built by Vite into static files, loading four example fixtures converted from 1.x sandboxes into the Vite layout (fixtures live inside the playground package; `packages/examples` is created by another change).
- **Playwright test** of the built demo served under a non-root base path, in Chromium, Firefox and WebKit.
- **Measurements** recorded in `design.md`: bundle size, sucrase vs ts-blank-space (size, speed, error messages), cold start.
- No library code changes.

**Breaking changes vs 1.x:** none. Nothing published changes. The 1.x sandboxes are only copied, not modified.

## Out of scope

- Integration into the Astro docs site, and the docs site itself.
- Brand styling of the editor and preview (it comes from the Claude Design handoff).
- TypeScript autocompletion, hover types and type checking in the editor. Type errors are not reported; only syntax errors are.
- Consuming `packages/examples`. The demo uses its own fixtures until that package exists.
- Bare imports other than `chartist` (npm packages from a CDN), multi-file trees beyond `index.html`, `src/*.ts` and `src/*.css`, and non-erasable TypeScript (enums, namespaces, parameter properties).
- `@rolldown/browser`, LiveCodes and other fallbacks. They are evaluated only if this spike hits a hard blocker.
- Manual verification on real iOS Safari (WebKit on Linux approximates it).

## Capabilities

### New Capabilities

- `example-playground`: the in-browser playground for example projects. Covers:
  - compiling a Vite-style example (HTML + TypeScript + CSS) in the browser without a server;
  - resolving `chartist` and its stylesheet through configurable URLs;
  - running the result in an isolated sandbox and reporting compile and runtime errors and console output;
  - editing with live re-render;
  - exporting to StackBlitz;
  - working from static hosting under a base path in Chromium, Firefox and WebKit.

### Modified Capabilities

None. `library-distribution` is unaffected.

## Impact

- **New:** `packages/playground` (`src/`, `demo/` with example fixtures, `test/` with Playwright, Vite config, Nx targets `dev`, `build`, `preview`, `test:e2e`, `measure`).
- **Dependencies** (dev, exact-pinned, all released at least two weeks before 2026-10-12): `sucrase`, `ts-blank-space`, `typescript`, `es-module-lexer`, CodeMirror 6 packages, `@stackblitz/sdk`, `vite`, `@playwright/test` 1.63.0 (same version as `playwright` in `packages/chartist`). `chartist` as a `workspace:*` dependency.
- **Repo:** `pnpm-lock.yaml`; `docs/v2-high-level-plan.md` (playground row and roadmap step 5) once the spike has results.
