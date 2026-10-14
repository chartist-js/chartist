# Design

## Context

- `packages/playground/src/editor.ts` builds the CodeMirror 6 editor (one state per file, `javascript({ typescript })`, `html()`, `css()`); `playground.ts` wires tabs, compile and preview; `transformers.ts` strips types with Sucrase (default) or ts-blank-space (which already lazy-loads `typescript` 6.0.3).
- The docs consume the playground as source (`exports` point to `src/*.ts`), so the docs' Vite build bundles whatever the playground imports, workers included.
- The docs serve the sandbox's Chartist from `/playground-lib/` (`integrations/playground-lib.mjs`); `playground-env.ts` passes `chartistUrl`, `stylesUrl` and `imports` (`match-container`).
- `packages/chartist/dist/index.d.ts` (120 KB) is self-contained; `compat.d.ts` imports `./index.js` and augments it.
- The examples compile with `packages/examples/tsconfig.json`: strict, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, ES2022 + DOM + DOM.Iterable, `moduleResolution: bundler`, `allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.
- The docs e2e tests fail on any third-party request.

## Decisions

### D1: The language service in a module worker, own adapter

A module worker (`new Worker(new URL('./types/worker.ts', import.meta.url), { type: 'module' })`) runs `ts.createLanguageService` over a small in-memory `LanguageServiceHost`: the example's files with versions, the lib files and the Chartist declarations. The editor talks to it with a few typed request messages (`update`, `diagnostics`, `completions`, `completionDetails`, `quickInfo`), each answered by id.

We write the adapter ourselves (about 300 lines) instead of using `@valtown/codemirror-ts` or `@typescript/vfs`: the host is short, the lib files must come from our origin rather than a CDN (`@typescript/vfs` fetches them by default), the tooltips must take our theme, and neither package needs to be pinned to our CodeMirror versions. Alternatives considered: running the service on the main thread (blocks typing on every check); TypeScript 7's native compiler (no in-browser language service we can rely on yet).

### D2: What the service sees

- Compiler options: the examples' `tsconfig.json`, minus `types: ["vite/client"]`.
- Lib files: `lib.es2022.d.ts` and the files it references (ES5 to ES2022), plus `lib.dom.d.ts` and `lib.dom.iterable.d.ts`, as in the examples' `lib` setting. Imported with `?raw` into the worker chunk, so they load with it.
- `chartist`: `index.d.ts` from the `types` URL, and `chartist/compat`: `compat.d.ts` next to it, mapped as `node_modules/chartist/…` files so module resolution finds them. If they can't be fetched, `chartist` becomes an untyped module and nothing else breaks.
- Ambient stubs: `declare module '*.css'`, and an untyped module for each extra `imports` key (`match-container`).
- Only `.ts` files are checked; `index.html` and CSS files are not given to the service.

### D3: Editor integration

- **Diagnostics:** `@codemirror/lint` `linter()` per TypeScript file, 300 ms after typing stops (like the preview), syntactic plus semantic diagnostics mapped to ranges, severity from the TypeScript category. The lint panel (Ctrl+Shift+M / Cmd+Shift+M) lists them for keyboard and screen reader users. A diagnostic in another file (an import error) shows in that file's tab.
- **Completions:** `@codemirror/autocomplete` with a TypeScript completion source (`getCompletionsAtPosition`, details on selection via `getCompletionEntryDetails`, shown in the info panel); triggers on `.`, identifiers and Ctrl+Space. CSS and HTML tabs use the language packages' own sources; the CSS source adds the `--ct-*` properties of the default stylesheet.
- **Hover:** `hoverTooltip` with `getQuickInfoAtPosition`: the signature and the doc comment, as plain text in a monospace block (no Markdown renderer).
- **Theme:** tooltips, the completion list, squiggles and the panel read `--pg-*` tokens (new: `--pg-error`, `--pg-warning`, `--pg-tooltip-bg`), in the playground's layer.

### D4: Loaded on first focus, optional

A `types` option on the playground: `{ url }` (the declarations' base URL; `index.d.ts` and `compat.d.ts` are resolved against it) or `false`. With `false`, or without the option, the editor behaves as today. With it, the worker starts the first time a TypeScript editor gets focus; the extensions are installed from the start but answer nothing until the service is ready (first diagnostics after about 1–2 s). A worker that fails to start leaves plain editing and logs one console warning.

### D5: Type errors don't block running

The preview keeps compiling with the type stripper and runs regardless of diagnostics, as Vite does. The existing error bar shows compile and runtime errors only.

## Risks / Trade-offs

- **Download size:** about 1.4 MB compressed on first focus. Accepted for an opt-in moment; measured (`playground:measure`) and recorded here before archiving.
- **Memory:** a language service per playground on the page. Pages with many live examples share one worker (a module-level singleton), keyed by playground instance.
- **Version skew:** the declarations come from the same build as the library the preview runs, so they can't drift on the site. Hosts that point at a published Chartist pass that version's types URL.
- **Firefox and WebKit:** module workers are supported in both; the e2e tests run in all three engines.

## Open Questions

- None blocking. Whether the docs pages mention Ctrl+Space and hover in prose is decided while writing (task 4.3).
