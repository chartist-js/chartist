# Proposal

## Why

`packages/examples` holds 72 examples: every 1.x sandbox and story case, plus a few v2 ones. The visual regression tests use them, but the docs site doesn't show them yet. The plan's next website change is the gallery, the example pages and the full-screen playground.

One thing stands in the way: **63 of the 72 examples use the 1.x class API** (`new LineChart(...)`). The docs promote the functional API everywhere (plan, "Docs promote the functional API"). But the examples can't simply be rewritten: the visual baseline is recorded from published Chartist 1.5.0 with these same files (`visual-regression`, "Baseline from 1.5"), and that's what proves v2 draws exactly like 1.x.

## What Changes

### Examples get a functional and a classic entry

- Every example's `src/main.ts` uses the functional API (`lineChart()`, `barChart()`, `pieChart()`, `chart()`, v2 plugins instead of 1.x events).
- The 1.x code moves next to it as `src/main.classic.ts`, unchanged. Examples written for v2 have no classic entry.
- The visual tests render **both** entries of the local build against the **same** baseline image, and the 1.5.0 run renders the classic entry. So every converted example proves the functional API draws what 1.x drew, pixel for pixel.

### The gallery

- **`/examples/`**: every docs example (`docs: true` in the manifest), grouped by chart type, as cards with a live thumbnail and the title. Filter chips by type.
- **`/examples/<type>/<name>/`**: one page per example: title, a short description, the `LiveExample` (editable in place), the classic 1.x code one tab away for readers migrating, and a link to the full-screen playground. Previous and next within the type.
- **`/playground/`**: the full-screen playground (editor, preview, console), on our own site (suggested by the author, 2026-10-14):
  - opened with `#example=<id>`, or with `#code=<…>`: all files, as JSON, compressed and base64url-encoded;
  - once the code is edited, the address switches to `#code=…` and follows the edits (debounced), so a reload or the back button keeps them;
  - a **Share** button copies the address;
  - Reset goes back to the example it started from.
- **Live examples open in the playground** instead of StackBlitz, with their current (possibly edited) files. StackBlitz stays available from the playground's toolbar, as an export for readers who want a full Vite project.
- The header gets an "Examples" link.

### The playground library owns its UI

Today the docs reach into the playground: they insert Reset and Copy buttons by querying its toolbar markup, restyle it with 182 unlayered lines of `live.css` that target its internal classes, and wire `compile()` and `Preview` together themselves for view mode. With a full-screen playground, Share and "Open in playground" on top, that would grow. Instead (decided with the author, 2026-10-14):

- **Toolbar actions are options:** Reset, Copy, Share, Open in playground and StackBlitz are built-in actions a page turns on, with callbacks where the page decides (the playground address for "Open in playground").
- **Two layouts:** `inline` (a live example in a page) and `full` (`/playground/`).
- **`createPreview()`:** compiles and runs files in the sandbox without the editor, for live examples before Edit and gallery thumbnails.
- **Theming through `--pg-*` custom properties** with neutral defaults in `playground.css`; the docs set them from the site's tokens, so `live.css` shrinks to assignments and the code token colors.
- **The share format lives in the library:** `encodeShare()` and `decodeShare()`, next to `compile()`.

The docs keep the routes, page layout, example loading, URLs and theme values.

### Manifest

- Entries gain an optional `description` (a sentence for the card and the page) and a `classic` flag (derived from the presence of `main.classic.ts`).

The 63 conversions run in parallel, by chart type, after a foundation that sets the pattern and the twin test (as in the Tailwind and docs content changes).

## Capabilities

### Modified Capabilities

- `chart-examples`: examples have a functional entry and, for 1.x examples, a classic entry; the manifest gains `description` and `classic`.
- `visual-regression`: both entries are screenshot against the same baseline; the 1.5.0 run uses the classic entry.
- `example-playground`: configurable toolbar actions, inline and full layouts, a preview-only component, theming through custom properties, and the share format.
- `docs-site`: the gallery, the example pages and the full-screen playground.

## Impact

- `packages/examples`: 63 new `src/main.classic.ts` files (copies of today's `main.ts`), 63 rewritten `main.ts`; manifest fields.
- `packages/chartist/test/visual`: the harness serves either entry; the baseline images don't change.
- `packages/playground`: toolbar actions, layouts, `createPreview()`, `--pg-*` theming, `encodeShare()`/`decodeShare()`; its tests and e2e.
- `apps/docs`: new pages `examples/index`, `examples/[...id]`, `playground`; a loader for package examples; header link.
- No library changes. Conversions that can't reach the 1.x pixels because of a library gap are listed (and fixed later, in `fix-library-findings`), not patched around in the library.
