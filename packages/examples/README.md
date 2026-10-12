# @chartist/examples

The Chartist examples, shared by the docs site, the live playground and the visual regression tests (`packages/chartist/test/visual`). Private, never published.

## Example format

Each example is a folder laid out like an `npm create vite` vanilla TypeScript starter (minus `package.json`):

```
<type>/<name>/
  index.html     the chart container and <script type="module" src="/src/main.ts">
  src/main.ts    imports 'chartist/styles.css' and the chart from 'chartist'
  src/style.css  optional, imported from src/main.ts
```

Copy a folder into a Vite app that has `chartist` installed and it runs unchanged. Examples contain only code a user would write for that chart:

- no harness, test or docs code;
- only erasable TypeScript syntax (no enums, namespaces, parameter properties or decorators), with type-only imports marked `type`;
- CSS imported from TypeScript (`chartist/styles.css`, relative `./style.css`), and no Vite-specific features (`import.meta.glob`, `?raw`, path aliases);
- seeded randomness (an inlined `mulberry32`) instead of `Math.random()`, so every render is identical.

## Commands

- `pnpm nx typecheck examples`: type-checks every example in strict mode against the built `chartist` declarations (builds `chartist` first).
- `pnpm nx check examples`: validates the manifest against the folders.
- `pnpm nx run chartist:test:visual`: screenshots every example (see `packages/chartist/test/visual`).
