# @chartist/playground (spike)

In-browser playground for Chartist example projects: an editor with file tabs and a live preview of a Vite-style example (`index.html`, `src/main.ts`, `src/style.css`), without a server. Private, not published. Spec and design: `openspec/changes/add-playground-repl/`.

How it works:

1. Strip TypeScript in the browser (sucrase by default, ts-blank-space optional).
2. Turn CSS imports from TypeScript into `<link>`/`<style>` tags.
3. Resolve relative imports to data-URL modules through an import map, which also maps `chartist` to a configurable URL.
4. Render the result into an `<iframe sandbox="allow-scripts">` via `srcdoc`. Errors and console output come back through `postMessage`.

```ts
import { createPlayground } from '@chartist/playground';

await createPlayground(document.querySelector('#playground')!, {
  files: { 'index.html': '…', 'src/main.ts': '…' },
  chartistUrl: '/lib/chartist/index.js', // must send Access-Control-Allow-Origin
  stylesUrl: '/lib/chartist/index.css',
  types: { url: '/lib/chartist/' }, // index.d.ts and compat.d.ts, optional
  chartistVersion: '^1.5.0' // for "Open in StackBlitz"
});
```

`compile(files, options)` is the DOM-free core, usable on its own.

With `types`, TypeScript files get type errors (underlined; Ctrl/Cmd+Shift+M lists them), completions (on `.`, while typing, Ctrl+Space) and the type and doc comment of a name on hover. The TypeScript language service runs in a worker (`src/types/`), one per page, which loads when a TypeScript editor first gets focus: about 1.3 MB compressed with the lib declarations, from the page's own origin. Type errors never stop the preview. The playground element gets `data-types="ready"` once types answer. CSS files complete the stylesheet's `--ct-*` properties. Openspec change: `add-playground-types`.

## Tasks

| Command                           | What it does                                                        |
| --------------------------------- | ------------------------------------------------------------------- |
| `pnpm nx dev playground`          | Demo with the example fixtures in `demo/examples` (Vite dev server) |
| `pnpm nx build playground`        | Static demo in `dist/`, base path `/chartist/`                      |
| `pnpm nx preview playground`      | Serves `dist/` at `http://localhost:4321/chartist/`                 |
| `pnpm nx test playground`         | Unit tests of the compile pipeline (`node:test`)                    |
| `pnpm nx run playground:test:e2e` | Playwright, Chromium + Firefox + WebKit, against the built demo     |
| `pnpm nx run playground:measure`  | Bundle sizes and transformer timings (see design.md, Findings)      |

Browsers for the e2e test: `pnpm --filter @chartist/playground exec playwright install chromium firefox webkit`.

The demo URL takes `?example=<id>&transformer=sucrase|ts-blank-space`, and `&types=off` for plain editing.

"Open in StackBlitz" can only be checked by hand: it opens stackblitz.com in a new tab.
