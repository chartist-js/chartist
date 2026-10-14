# Tasks

## 1. Type service

- [x] 1.1 Worker with an in-memory `LanguageServiceHost`: example files, lib files (`?raw`), the examples' compiler options; typed request messages answered by id (D1, D2).
- [x] 1.2 Chartist declarations from the `types` URL (`index.d.ts`, `compat.d.ts`), `*.css` and extra-import stubs, untyped fallback when the fetch fails (D2).
- [x] 1.3 Unit tests of the service in Node against the real `dist` declarations: a misspelled event is an error, `ctx.x` completes after a role check, quick info for `lineChart`, a CSS import is fine.

## 2. Editor

- [x] 2.1 Diagnostics with `@codemirror/lint`, debounced, per file, lint panel (D3).
- [x] 2.2 TypeScript completions with details; CSS (`--ct-*`) and HTML completions (D3).
- [x] 2.3 Hover quick info (D3).
- [x] 2.4 `--pg-*` tokens for tooltips, completion list, squiggles and panel, light and dark.
- [x] 2.5 `types` option; worker starts on first focus of a TypeScript editor; shared worker per page; graceful failure (D4).

## 3. Hosts

- [x] 3.1 Docs: serve `index.d.ts` and `compat.d.ts` from `/playground-lib/`; live examples, the gallery's example pages and `/playground/` pass the types URL.
- [x] 3.2 The playground's own demo app passes its types URL.

## 4. Proof

- [x] 4.1 Playground e2e in Chromium, Firefox and WebKit: an underlined misspelled event with its message, completion of `ctx.x` after a role check, hover on `lineChart`, a type error still renders the chart, no type-service request before focus.
- [x] 4.2 Docs e2e: no third-party requests and no console errors after editing a live example; axe passes with a tooltip open.
- [x] 4.3 Docs: a line on editor help where readers first edit (Getting started, Events and plugins), if it reads naturally.
- [x] 4.4 Sizes measured and recorded in the design; plan updated; full gate.
