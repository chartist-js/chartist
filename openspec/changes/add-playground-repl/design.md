# Design

## Context

- **Example format:** `add-visual-regression-harness` design D1. A folder with `index.html` (`<div id="chart">`, `<script type="module" src="/src/main.ts">`), `src/main.ts` (`import 'chartist/styles.css'; import { LineChart } from 'chartist'`) and an optional `src/style.css` imported from `main.ts`. `packages/examples` does not exist on `next` yet.
- **Library build:** `packages/chartist/dist/index.js` is a dependency-free ESM build, `dist/index.css` the stylesheet (`library-distribution` spec). The exports map already exposes `chartist/styles.css`.
- **1.x examples:** `packages/chartist/sandboxes/<type>/<name>/index.ts` (Parcel). Some import types without the `type` keyword (`import { PieChart, PieChartOptions } from 'chartist'`, `pie/custom-labels`). Four use SMIL animation through `draw` handlers.
- **Hosting:** the docs go to GitHub Pages, possibly under a base path. GitHub Pages answers every file with `Access-Control-Allow-Origin: *` (checked 2026-10-12), so cross-origin module loads from an opaque-origin iframe work.
- **Tooling:** Nx 23 with targets declared in `package.json` (`nx` field), `playwright` 1.63.0 in `packages/chartist`, no Vite in the workspace yet.

## Goals / Non-Goals

**Goals:**

- A small, framework-free runtime with a stable entry API, so the Astro site can mount it later without rework.
- Hard evidence for the plan's open points (roadmap step 5): base path, sucrase vs ts-blank-space, CSS imports, edit-and-rerender in three engines, unchanged example files.

**Non-Goals:**

- Production polish: accessibility of the editor, theming, persistence of edits, URL sharing.
- A general-purpose REPL. Only what Chartist examples need is supported.

## Decisions

### D1 Package shape

`packages/playground` is a private workspace package (`@chartist/playground`), source-only TypeScript (ESM). Two layers:

- `compile(files, options) → { html, diagnostics }`: pure, DOM-free, testable in Node.
- `createPlayground(element, options)`: editor, tabs, preview iframe, error panel, StackBlitz button. It calls `compile` and owns the iframe.

The CodeMirror editor is imported in a separate module, so a docs page can show a read-only preview without loading the editor (later).

_Alternatives:_ a web component (`<chartist-playground>`). Deferred: easy to add on top of `createPlayground`, and Astro can call a function from an island script just as well.

### D2 Compile pipeline

For every `src/*.ts` file:

1. **Strip types** with the selected transformer (D3).
2. **Scan imports** with the minimal build of `es-module-lexer` (`es-module-lexer/minimal`, 8 kB gzipped with its inlined WASM). It returns the string positions of static and dynamic import specifiers. The full build (17 kB) adds TypeScript lexing, which isn't needed after type stripping.
3. **Rewrite imports:**
   - `chartist/styles.css` → removed from the code, adds `<link rel="stylesheet" href="{stylesUrl}">`;
   - relative `*.css` → removed, adds `<style data-file="src/style.css">…</style>` with the file content;
   - relative `*.ts` (with or without extension) → the virtual specifier `playground:/src/<file>.ts`;
   - `chartist` and any other bare specifier → unchanged (import map).
4. **Emit** each module as a `data:text/javascript;charset=utf-8,…` URL (percent-encoded), with a trailing `//# sourceURL=src/<file>.ts` comment that the bootstrap uses to name files in errors. The import map maps `chartist` → `{chartistUrl}` and each `playground:/src/…` → its data URL.

`index.html` is rewritten with a small string pass: the module script whose `src` is `/src/main.ts` becomes `<script type="module">import 'playground:/src/main.ts'</script>`. The import map, the collected styles and the bootstrap script (D5) are injected at the start of `<head>`. Everything else in `index.html` stays as written.

- **Why data URLs and not blob URLs:** blob URLs belong to the origin that created them. The preview runs in an opaque origin, so host-created blob URLs are not reliably loadable there (behavior differs per engine). Data URLs have no origin and load everywhere.
- **Why a virtual scheme:** a data URL module can't resolve relative specifiers, so every relative import is resolved at compile time and mapped through the import map. A URL-like key (`playground:/…`) avoids clashing with bare npm names.
- **Why not a bundler:** two transforms and a lexer cover the example format. `@rolldown/browser` stays the documented next step if this falls short (plan, goal 5).

### D3 Type stripping: sucrase vs ts-blank-space

Both are implemented behind one interface (`transform(code, file) → code`), loaded lazily with a dynamic `import()`, and selectable with an option (`transformer: 'sucrase' | 'ts-blank-space'`).

- **sucrase** (`transforms: ['typescript']`, `disableESTransforms: true`): own parser, ~200 kB minified. Elides imports that are only used as types, like `tsc` with `isolatedModules`, so `import { PieChartOptions } from 'chartist'` works.
- **ts-blank-space**: replaces type syntax with whitespace, so positions stay identical (no source maps needed). Needs the TypeScript parser (`typescript` package) in the browser. It does not elide imports that lack the `type` keyword.

The choice is made from the measurements in "Findings". **Default: sucrase** (recommendation F2). ts-blank-space stays selectable for comparison until the author decides.

### D4 Library resolution

`chartistUrl` and `stylesUrl` are options. Relative URLs are resolved against the host page's `document.baseURI` before they go into the `srcdoc`, so the preview never depends on the `about:srcdoc` base URL. The demo serves the workspace build (`packages/chartist/dist/index.js` and `index.css`) as static files next to its own output, under the same base path. Module scripts from an opaque origin are fetched in CORS mode with `Origin: null`, so the library URL needs `Access-Control-Allow-Origin: *` (GitHub Pages sends it; the test server mimics it).

### D5 Preview and messaging

- `<iframe sandbox="allow-scripts" srcdoc="…">`: opaque origin, no `allow-same-origin`, no `allow-modals`/`allow-popups`.
- A bootstrap classic script, injected first, installs `error` and `unhandledrejection` listeners and wraps `console.log/info/warn/error/debug`. It sends `{ source: 'chartist-playground', runId, kind, … }` messages to `parent` with target origin `*`. The host only accepts messages whose `event.source` is its current iframe's `contentWindow` and whose `runId` matches the latest render.
- Data URL file names in error positions are mapped back to `src/<file>.ts` via a table in the bootstrap.
- Re-render replaces the iframe's `srcdoc`. A compile error does not touch the iframe, so the last good chart stays visible.

### D6 Editor

CodeMirror 6 assembled from `@codemirror/state`, `view`, `commands`, `language`, `lang-javascript` (TypeScript mode), `lang-html` and `lang-css`; no `basicSetup` (it pulls in autocompletion, search and lint UI). One `EditorState` per file, swapped on tab change. Edits update the file map and schedule a re-render (300 ms debounce). Plain system-font styling only.

### D7 StackBlitz export

`@stackblitz/sdk` `openProject({ template: 'node', files }, { newWindow: true, openFile: 'src/main.ts' })` with the current files plus a generated `package.json` (`"type": "module"`, scripts `dev`/`build`/`preview` running Vite, dependencies `chartist`, dev dependencies `vite`, `typescript`) and a `tsconfig.json` close to the Vite vanilla-ts template. The `chartist` version range is an option. This can only be verified by hand (it opens a new window on stackblitz.com).

### D8 Demo and test

- `demo/index.html` + `demo/main.ts`, Vite root `demo/`. Fixtures in `demo/examples/<id>/` are loaded with `import.meta.glob(..., { query: '?raw' })` and selected with buttons (and `?example=` / `?transformer=` URL parameters for tests and measurements).
- A Vite plugin serves `packages/chartist/dist/index.js` and `index.css` at `{base}lib/chartist/` in dev and emits them into the build output.
- Nx targets: `dev`, `build` (`vite build --base /chartist/`), `preview`, `test:e2e` (depends on `build` and `chartist:build`), `measure`.
- The Playwright test serves `dist/` under `/chartist/` with a tiny Node static server that sets `Access-Control-Allow-Origin: *` like GitHub Pages, and runs in the `chromium`, `firefox` and `webkit` projects.

## Risks / Trade-offs

- [Data URLs in error stacks are unreadable] → The bootstrap maps them back to file names (D5).
- [ts-blank-space breaks on non-`type` type imports] → Measured and documented; if it is chosen, the example format must require `import type` (enforceable with `verbatimModuleSyntax` in the examples' type check).
- [`typescript` in the browser is large] → Loaded lazily, only for the transformer that needs it.
- [SMIL animations restart on every re-render] → Expected; each render is a fresh document.
- [WebKit on Linux is not iOS Safari] → Noted as unverified; check on a device before the docs ship.
- [Library URL without CORS (some static hosts)] → Document the header requirement; fallback: the host fetches the library once and inlines it as a data URL.

## Migration Plan

New package only; nothing to migrate. Rollback: delete `packages/playground`.

## Findings

Spike run on 2026-10-12: WSL2 Linux, Node 22, Playwright 1.63.0 (Chromium, Firefox 155, WebKit 26.6). Reproduce with `pnpm nx run playground:measure` and `pnpm nx run playground:test:e2e`.

### F1 The DIY approach works in all three engines, with no blocker

The e2e suite runs 51 tests, all passing: 17 tests × Chromium, Firefox and WebKit, against the static build under `/chartist/`, served with only `Access-Control-Allow-Origin: *` like GitHub Pages. It covers:

- all four fixtures with both transformers;
- `chartist/styles.css` plus the example's `style.css` (computed `fill` checked);
- the SMIL `draw` animation (`<animate>` present);
- edit → re-render through real CodeMirror typing;
- a syntax error shown in the panel while the last chart stays;
- runtime errors and console output forwarded;
- module load failures reported;
- `parent.document` blocked.

The pieces that were uncertain all work in every engine:

- data-URL modules;
- a URL-like virtual scheme (`playground:/src/main.ts`) as import map keys;
- an import map inside `srcdoc`;
- `chartist` loaded cross-origin from an opaque-origin iframe.

The dev server (`pnpm nx dev playground`) works too.

The example format runs unchanged: the same fixture files run in the playground and build with plain `vite build` (checked for the pie fixture, with and without the vanilla-ts template tsconfig).

### F2 sucrase vs ts-blank-space

**Sizes** (minified, gzip -9, from the demo build; the playground runtime includes the demo glue and the lexer):

| Chunk                                      |    Gzip |
| ------------------------------------------ | ------: |
| Playground runtime + CSS                   | 16.3 kB |
| sucrase                                    | 44.0 kB |
| ts-blank-space + `typescript`              |  944 kB |
| CodeMirror editor (6 packages, see F5)     |  155 kB |
| `@stackblitz/sdk` (loaded on click)        |  3.3 kB |
| _chartist `dist/index.js` (for reference)_ | 25.7 kB |

That makes 60 kB without the editor and 215 kB with it (sucrase), against 1.1 MB with ts-blank-space.

**Transform time** (Node 22; the browser is similar):

| Transformer    | Load   | First transform | Warm transform | Full `compile()` warm |
| -------------- | ------ | --------------- | -------------- | --------------------- |
| sucrase        | 17 ms  | 3.6 ms          | 0.03 ms        | 0.04 ms               |
| ts-blank-space | 164 ms | 5.1 ms          | 0.05 ms        | 0.06 ms               |

Both are far below the 300 ms edit debounce.

**Cold start** (navigation to the first `svg.ct-chart-line`, local server, median of 5, fresh browser context):

| Engine                                | sucrase | ts-blank-space |
| ------------------------------------- | ------: | -------------: |
| Chromium                              |   90 ms |         183 ms |
| Chromium, throttled 10 Mbit/s + 40 ms |  952 ms |        3993 ms |
| Firefox                               |  138 ms |         288 ms |
| WebKit                                |  142 ms |         223 ms |

**Error messages** (both report the file plus a 1-based line and column):

| Input                          | sucrase                             | ts-blank-space                      |
| ------------------------------ | ----------------------------------- | ----------------------------------- |
| `{ series: [[1, 2]] ;`         | 1:33 Unexpected token, expected "," | 1:33 ',' expected.                  |
| `new LineChart('#chart', {…};` | 1:45 Unexpected token, expected "," | 1:45 ')' expected.                  |
| `const options: = {…}`         | 1:16 Unexpected token               | 1:16 Type expected.                 |
| `const x = 1 +;`               | 1:14 Unexpected token               | 1:14 Expression expected.           |
| `const label = 'Mon;`          | 1:15 Unterminated string constant   | 1:20 Unterminated string literal.   |
| `enum Color { Red }`           | no error (compiled to JS)           | 1:1 Unsupported TypeScript syntax … |

- TypeScript's messages are a bit more specific: they say what was expected.
- ts-blank-space alone doesn't report parse errors, because TypeScript's parser recovers. The playground reads them from the source file's internal `parseDiagnostics`, which TypeScript doesn't guarantee.

**Type-only imports.**

- sucrase elides imports that are only used as types, as `tsc` does without `verbatimModuleSyntax`.
- ts-blank-space keeps them, and the browser then fails at link time, each engine with its own message:
  - Chromium: "The requested module 'chartist' does not provide an export named 'PieChartOptions'";
  - Firefox: names the full library URL;
  - WebKit: "Importing binding name 'PieChartOptions' is not found", without a position.
- **Vite fails the same way** (`MISSING_EXPORT`) once the project uses the `npm create vite` vanilla-ts tsconfig, because it sets `verbatimModuleSyntax: true`. The 1.x style `import { PieChart, PieChartOptions }` therefore breaks a "real" Vite/StackBlitz project. The fixture now uses `import { PieChart, type PieChartOptions, … }`.

**Recommendation: sucrase.**

- It is 20× smaller (44 kB vs 944 kB gzipped).
- Cold start is about 4× faster on a throttled connection (0.95 s vs 4 s).
- Speed is equivalent and the error messages are of similar quality.
- ts-blank-space's real advantage is strictness: it rejects non-erasable syntax and non-`type` imports, exactly like the Vite template's `erasableSyntaxOnly` + `verbatimModuleSyntax`. That strictness belongs in the examples' CI type check (`add-visual-regression-harness` D3), not in every reader's download.
- Risk: sucrase's last release is 3.35.1 (2025-11). It may lag behind new TypeScript syntax, and its maintenance pace is the thing to watch. ts-blank-space is lazy-loaded, so switching later is one option.

### F3 Base path and library URL

- Under `/chartist/`, the library is served next to the demo (`lib/chartist/index.js`) and passed as a base-relative URL. `compile()` resolves it against `document.baseURI`, so the preview never depends on `about:srcdoc`.
- **CORS is required.** Module scripts from the opaque-origin iframe are fetched with `Origin: null`.
  - GitHub Pages sends `Access-Control-Allow-Origin: *` (checked with curl).
  - Astro's dev/preview server and other hosts need checking when the docs site is built.
  - Without the header, the preview shows "Failed to load a module script…".
  - Fallback if a host can't send it: the host fetches the library once (same origin) and maps `chartist` to a data URL (not implemented).
- Stylesheets (`<link>`) need no CORS.

### F4 Limitations found

- **SMIL / `draw` examples** work. Every re-render is a fresh document, so animations restart on each edit. That is fine for a playground.
- **CSS handling** is Vite-like for the example format. Not supported:
  - `@import` and relative `url()` inside the example CSS;
  - CSS modules;
  - bare CSS packages other than `chartist/styles.css`.
- **Error positions.** Runtime errors are mapped to `src/main.ts:line:col` in all engines. Chromium reports the cross-origin `SecurityError` without a file (shown as `index.html`). WebKit gives no position for link errors. Load failures of inline module scripts don't name the failing URL in any engine.
- **No type checking** in the editor (out of scope). A wrong option name runs and fails silently or at runtime.
- **iOS Safari is unverified.** WebKit on Linux is an approximation. Check on a device before the docs ship.
- **"Open in StackBlitz"** is wired. A unit test checks the project shape: files + `package.json` with `vite` and `typescript` + the vanilla-ts tsconfig. Opening it can only be verified by hand. StackBlitz's `node` template runs on WebContainers, so the export is best in Chromium.

### F5 Notes for the docs integration

- **The CodeMirror bundle is 155 kB gzipped**, more than expected. `lang-html` pulls in `lang-css`, `lang-javascript` and autocomplete. Options:
  - load the editor only on the first click into the code;
  - show HTML/CSS read-only with lighter modes.

  The preview never waits for the editor, because both load in parallel.

- The core (`compile`, `Preview`) has no DOM dependency beyond the iframe and can run in an Astro island.
- **Repo notes.**
  - `pnpm add` re-resolved some jest/storybook peer suffixes (typescript 4.9.5 → 5.9.3) in `pnpm-lock.yaml`.
  - `@lezer/*` is pinned directly to keep transitive versions older than two weeks.
  - `chartist:typecheck` already fails on `next` (BarChart/BaseChart). Run `nx typecheck playground --exclude-task-dependencies`.

### F6 Decisions for the author

1. **Transformer:** sucrase (recommended) or ts-blank-space.
2. **Example rule:** types are imported with `import type` or inline `type` (`verbatimModuleSyntax`), and only erasable syntax is used (`erasableSyntaxOnly`), enforced by the examples' type check with the vanilla-ts tsconfig. Without the rule, examples break in StackBlitz/Vite and with ts-blank-space.
3. **CORS:** whether the docs host must send `Access-Control-Allow-Origin` for the library, or whether to implement the inline-library fallback.
4. **Editor weight:** lazy-load the editor on interaction, or accept 155 kB.
5. **Next steps:** verify on a real iOS device and click through the StackBlitz export by hand.
