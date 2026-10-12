# Tasks

## 1. Package setup

- [x] 1.1 Scaffold `packages/playground` (`@chartist/playground`, private, `"type": "module"`, `tsconfig.json`, `README.md`) with exact-pinned dev dependencies (`sucrase`, `ts-blank-space`, `typescript`, `es-module-lexer`, CodeMirror 6 packages, `@stackblitz/sdk`, `vite`, `@playwright/test` 1.63.0) and `chartist: workspace:*`, each released at least two weeks before 2026-10-12. Verify `pnpm install` succeeds and `pnpm nx show project playground` lists the project
- [x] 1.2 Convert copies of `line/area`, `line/path-animation`, `bar/stacked` and `pie/custom-labels` (plus a new `src/style.css`) from `packages/chartist/sandboxes` into `demo/examples/<type>-<name>/` in the Vite layout (design D1 of `add-visual-regression-harness`). Verify `git diff --stat packages/chartist/sandboxes` is empty and each fixture has `index.html` and `src/main.ts`

## 2. Compile pipeline

- [x] 2.1 Implement both transformers behind one interface (design D3) and the `compile(files, options)` pipeline (design D2, D4): import scanning, CSS import rewriting, relative imports to virtual specifiers, data URL modules, import map, `index.html` rewrite. Verify with `node:test` unit tests (`pnpm nx test playground`) covering CSS imports, relative imports, the import map, type imports and a syntax error diagnostic with file and line, for both transformers

## 3. Preview, editor and export

- [x] 3.1 Implement the bootstrap script and the preview controller (design D5): sandboxed iframe via `srcdoc`, error/rejection/console forwarding with run ids, last good preview kept on compile errors. Verify in the demo that a `throw` and a `console.log` in `main.ts` appear in the error/console panel
- [x] 3.2 Implement the CodeMirror editor with file tabs and debounced re-render (design D6). Verify in the demo that typing in `src/main.ts` re-renders the chart
- [x] 3.3 Implement the "Open in StackBlitz" button (design D7). Verify the generated project files in a unit test; the StackBlitz window itself is verified by hand

## 4. Demo and end-to-end test

- [x] 4.1 Add the demo page, the Vite config with the library-serving plugin and the Nx targets `dev`, `build`, `preview` (design D8). Verify `pnpm nx build playground` produces static files under `dist/` that reference `/chartist/` and include `lib/chartist/index.js`
- [x] 4.2 Add the Playwright test (static server under `/chartist/` with CORS like GitHub Pages; Chromium, Firefox, WebKit): each example renders `svg.ct-chart-*` in the sandboxed iframe, an edit re-renders, a syntax error shows in the error panel, the iframe can't reach the host. Verify `pnpm nx test:e2e playground` passes in all three engines

## 5. Measurements and findings

- [x] 5.1 Add a `measure` target that reports the gzip size of the runtime with and without CodeMirror and of each transformer, transform time per example, the error messages of both transformers and the cold start to the first chart per engine. Verify the numbers are recorded in the "Findings" section of `design.md` with a recommendation for sucrase or ts-blank-space
- [x] 5.2 Record browser results, limitations (SMIL and `draw` examples, CSS handling, base path, iOS) and decisions for the author in `design.md`, and update the playground row and roadmap step 5 in `docs/v2-high-level-plan.md`. Verify `openspec validate add-playground-repl --strict` passes

## Workflow follow-up

- The author reviews the findings and decides the transformer before the docs-site change.
- Archive the change when the playground is integrated into the docs site, or fold its spec into that change.
