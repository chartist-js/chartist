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
2. **Scan imports** with `es-module-lexer` (string positions of static and dynamic import specifiers; ~4 kB gzipped, WASM-free `js` build is not needed because the default build inlines a tiny WASM).
3. **Rewrite imports:**
   - `chartist/styles.css` → removed from the code, adds `<link rel="stylesheet" href="{stylesUrl}">`;
   - relative `*.css` → removed, adds `<style data-file="src/style.css">…</style>` with the file content;
   - relative `*.ts` (with or without extension) → the virtual specifier `playground:/src/<file>.ts`;
   - `chartist` and any other bare specifier → unchanged (import map).
4. **Emit** each module as a `data:text/javascript;base64,…` URL. The import map maps `chartist` → `{chartistUrl}` and each `playground:/src/…` → its data URL.

`index.html` is rewritten with a small string pass: the module script whose `src` is `/src/main.ts` becomes `<script type="module">import 'playground:/src/main.ts'</script>`. The import map, the collected styles and the bootstrap script (D5) are injected at the start of `<head>`. Everything else in `index.html` stays as written.

- **Why data URLs and not blob URLs:** blob URLs belong to the origin that created them. The preview runs in an opaque origin, so host-created blob URLs are not reliably loadable there (behavior differs per engine). Data URLs have no origin and load everywhere.
- **Why a virtual scheme:** a data URL module can't resolve relative specifiers, so every relative import is resolved at compile time and mapped through the import map. A URL-like key (`playground:/…`) avoids clashing with bare npm names.
- **Why not a bundler:** two transforms and a lexer cover the example format. `@rolldown/browser` stays the documented next step if this falls short (plan, goal 5).

### D3 Type stripping: sucrase vs ts-blank-space

Both are implemented behind one interface (`transform(code, file) → code`), loaded lazily with a dynamic `import()`, and selectable with an option (`transformer: 'sucrase' | 'ts-blank-space'`).

- **sucrase** (`transforms: ['typescript']`, `disableESTransforms: true`): own parser, ~200 kB minified. Elides imports that are only used as types, like `tsc` with `isolatedModules`, so `import { PieChartOptions } from 'chartist'` works.
- **ts-blank-space**: replaces type syntax with whitespace, so positions stay identical (no source maps needed). Needs the TypeScript parser (`typescript` package) in the browser. It does not elide imports that lack the `type` keyword.

The choice is made from the measurements in "Findings". The default is the one recommended there.

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

To be filled in by the spike (measurements, browser results, blockers).
