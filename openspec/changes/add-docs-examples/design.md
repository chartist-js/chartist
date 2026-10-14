# Design

## Context

- `packages/examples`: `<type>/<name>/` folders (`index.html`, `src/main.ts`, optional `src/style.css`), manifest in `index.ts` (`id`, `folder`, `title`, `type`, `docs`, `compat`, `v2`, `viewports`, `size`, `settle`). Types: line (31), bar (19), pie (16), composed (4), styling (2). 63 use the class API; 7 need compat (1.x events or the 1.x `Svg` API).
- `packages/chartist/test/visual`: Playwright, Vite-served examples; `vite.config.ts` rewrites `/src/main.ts` to the example folder; baseline (67 images) recorded from published 1.5.0; `v2: true` examples are skipped in the 1.5.0 run.
- `@chartist/playground`: `createPlayground()`, `compile()`, `Preview`, StackBlitz export.
- `apps/docs`: `LiveExample` (view mode runs the example's own code in a sandbox; Edit swaps in the playground), page-specific examples in `src/examples/`, `docs:visual` for the site's look.

## Decisions

### D1: Two entries, one baseline

`src/main.ts` is the functional version: what the docs show, what a new user copies. `src/main.classic.ts` is the 1.x code, byte for byte today's `main.ts`. `index.html` keeps loading `/src/main.ts`, so the folder still runs unchanged as a Vite app.

The visual harness renders an example once per entry: the local build with `main.ts`, the local build with `main.classic.ts`, and (when selected) 1.5.0 with `main.classic.ts`. All compare against the same baseline image. A functional entry that can't match the 1.x pixels exactly is a finding: list it, and either keep the difference out of the example or, if the difference is a deliberate v2 change, record it in the change's findings and give that entry its own baseline image with an explicit `baseline` override in the manifest.

History: `main.ts` keeps its `git log --follow` lineage (its content changes, its path doesn't); `main.classic.ts` is a new file. Copy and rewrite go in separate commits per type, so the classic copy is a pure add.

Alternative: classic examples stay as they are and the gallery shows them. Rejected: it would teach the 1.x API on the v2 site.

### D2: Compat examples

The 7 compat examples (1.x events, `Svg` animate) become v2 plugins: `compose` for changing elements, `mount` with `Svg#animate` for SMIL, as on the animations and plugins pages. Their classic entries keep `compat`.

### D3: Gallery thumbnails are live

Cards render the example's functional entry in a sandboxed preview, lazily (IntersectionObserver), with the same view-mode code `LiveExample` uses; until then, and without JS, the card shows the title and type. No build-time screenshots to keep in sync.

### D4: Example pages

`src/pages/examples/[...id].astro` with `getStaticPaths()` from the manifest (`docs: true`). The page reads the example's files through a loader for the package (`import.meta.glob` on `packages/examples/*/*/**`, `?raw`), like `src/lib/examples.ts` does for page examples. `LiveExample` gets a `classic` file to show in a second tab, read-only.

### D5: Full-screen playground and shareable code

`src/pages/playground.astro`: `createPlayground()` filling the viewport below the header, with the site's editor theme and preview styles.

- **The address carries the code, in the fragment.** `#example=<id>` opens a manifest example; `#code=<payload>` opens any files. The fragment is never sent to the server, so shared code doesn't end up in server logs, and no server limit applies to its length. (A query parameter would also work on a static host, but would reach server and CDN logs.)
- **Payload:** `1.` (a format version) followed by base64url of the deflate-raw compression (`CompressionStream`, native in all target browsers, no dependency) of `JSON.stringify({ files, title })`. A typical example (a few hundred bytes) becomes a few hundred characters. An unknown version or a payload that doesn't decode shows an error and the blank chart, never a broken page.
- **Following edits:** after the first edit, the address is replaced (`history.replaceState`, debounced by 500 ms) with `#code=…` for the current files, so reloads keep the code without filling the history.
- **Share** copies the current address (and says so); **Reset** returns to the files the page was opened with; **StackBlitz** exports the current files as a Vite project.
- **Opening from a live example:** `LiveExample`'s StackBlitz action becomes "Open in playground", which encodes its current files into `#code=…` (or uses `#example=<id>` while unedited).
- **Untrusted code:** shared code runs only in the playground's sandboxed preview (opaque origin, `allow-scripts` only), as all example code does.

The encoder and decoder live in `@chartist/playground` (`share.ts`: `encodeShare()`, `decodeShare()`), unit-tested for round trips, unicode, size and bad input.

### D7: The library owns the UI, the docs configure and theme it

- **Actions:** `actions?: PlaygroundAction[]`, built from exported factories: `resetAction()`, `copyAction(file?)`, `shareAction({ url(files): string })`, `openAction({ url(files): string })`, `stackblitzAction()`. Each renders a button in the toolbar, in the given order; a page can also pass its own `{ label, run(playground) }`. The current default (StackBlitz only) stays for existing callers.
- **Layouts:** `layout: 'inline' | 'full'`. `inline` is today's widget; `full` fills its element (editor and preview side by side, the panel below) and is what `/playground/` uses.
- **`createPreview(element, files, options)`:** compile plus `Preview`, no editor; returns `{ setFiles, setPreviewStyles, destroy }`. It reports errors through `onMessage` like the playground. `LiveExample` view mode and the gallery cards use it; the playground uses it internally.
- **Theming:** `playground.css` reads `--pg-bg`, `--pg-ink`, `--pg-muted`, `--pg-line`, `--pg-accent`, `--pg-code-bg`, `--pg-code-ink`, `--pg-font`, `--pg-font-code`, `--pg-radius` (exact list settled in the implementation) with neutral defaults, and stays in a low cascade layer of its own (`@layer playground`) so pages override it without specificity games. Code tokens keep their `tok-*` classes. The docs' `live.css` becomes these assignments from the site tokens plus the token colors; no rules on internal classes.
- **Share format:** `share.ts` exports `encodeShare({ files, title })` and `decodeShare(payload)` (D5); `shareAction` and the full-screen page use them.

The library stays usable outside the docs site, and the docs stop depending on its markup.

### D6: Parallel conversion

1. **Lead (serial):** the twin support in the harness and manifest, the conventions (`packages/examples/CONVERTING.md`: API mapping, v2 plugin patterns for compat, what "matches" means), and two reference conversions (`line/simple`, `line/modify-drawing`).
2. **Converters (subagents, one worktree each, disjoint folders):** line A (half of line), line B (other half), bar, pie, composed and styling. Each copies `main.ts` to `main.classic.ts` (one commit), rewrites `main.ts` (another commit), and passes the examples type-check and the visual tests for its folders.
3. **Lead (serial):** merge, the gallery, example pages and playground (or a second wave of agents for the pages if large), then review.

## Risks / Trade-offs

- **Twins drift apart** → both are screenshot against one image; the type-check covers both.
- **Pixel differences from real v2 changes** → listed, with an explicit per-entry baseline override and a reason, never silently re-recorded.
- **Very long shared addresses** → compression keeps typical examples short; the playground warns when an address grows past about 8,000 characters, since some chat apps and email clients cut long links.
- **Many iframes on the gallery page** → lazy, one shared Chartist module from the site; measure on the page with the most cards.
- **Two example sets in the docs** (page examples in `apps/docs/src/examples`, gallery examples in `packages/examples`) → kept apart on purpose: page examples teach one idea, gallery examples are the regression-tested set. Revisit if they converge.
