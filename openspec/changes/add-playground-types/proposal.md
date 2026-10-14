# Proposal

## Why

The playground strips types and runs the code; it never looks at them. Since `refine-typings`, the types carry a lot: `node.role === 'point'` narrows `node.ctx` to `{ x, y, value, … }`, `chart.on('compsoe')` is an error, and plugin options are checked. In the playground none of that shows, so readers editing an example get neither the completions nor the errors their own editor would give them. The author decided (2026-10-14) to add type errors and autocomplete to the playground, before the API reference.

## What Changes

- **Type-aware editing in TypeScript files:** errors and warnings underlined as you type, completions (on `.`, while typing an identifier, and on Ctrl+Space) with their types and doc comments, and the type of the symbol under the pointer on hover. Diagnostics are also reachable from the keyboard (the lint panel).
- **The TypeScript language service in a Web Worker**, fed with the example's files, the ES2022 and DOM lib declarations, and the declarations of the Chartist build the preview runs (`index.d.ts` and `compat.d.ts`, from a URL next to the library's).
- **Loaded on demand:** nothing type-related loads until someone focuses a TypeScript editor, so pages with live examples cost the same as today for readers who don't edit. Everything loads from the page's own origin.
- **Type errors never block the preview**, as in Vite: the code still runs.
- **CSS and HTML completion** in the other tabs, from CodeMirror's own completion sources, including the `--ct-*` custom properties.
- **The docs site** serves the declarations next to its playground build of Chartist, so live examples and `/playground/` get the types.

**Not in this change:** go to definition, rename, quick fixes and formatting; type checking in the StackBlitz export (it has its own); TypeScript 7 (the native compiler) in the browser. The playground keeps the JavaScript language service of TypeScript 6.0, which checks this code the same way.

## Capabilities

### Modified Capabilities

- `example-playground`: type checking no longer a non-goal; adds type-aware editing and on-demand loading.
- `docs-site`: the site serves the Chartist declarations for its live examples.

## Impact

- `packages/playground`: a worker (`src/types/`), CodeMirror lint, autocomplete and hover extensions in `editor.ts`, a `types` option, `--pg-*` tokens for tooltips; new dev dependencies `@codemirror/autocomplete` and `@codemirror/lint` (TypeScript is already one).
- `apps/docs`: `integrations/playground-lib.mjs` serves `index.d.ts` and `compat.d.ts`; `playground-env.ts` passes their URL.
- Download: the worker carries the TypeScript compiler (about 1 MB compressed) and the lib declarations (about 0.4 MB compressed), on first focus only. Measured and recorded in the design.
