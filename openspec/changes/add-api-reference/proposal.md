# Proposal

## Why

The docs explain Chartist through guides and examples, but there's no place to look up a function's parameters, an option's type and default, or what a node's context holds. Since `refine-typings`, the types are precise enough to be the reference, and the playground already shows their doc comments on hover. The plan has the API reference next, generated from the TypeScript types, with the 1.x classes kept minimal and pointing to their functions.

A trial run of TypeDoc 0.28.20 over `packages/chartist/src` (2026-10-14) shows what we start from:

- 259 top-level exports (79 at runtime), plus `chartist/compat`'s two.
- The v2 areas are mostly documented at the top level (chart, layers, presets, responsive, scene: about 90%; pipeline: half). Members (properties, parameters) are often not.
- The 1.x areas (core, charts, svg, axes, event) are thinly documented: about a third of their exports have a comment.

## What Changes

- **A generated reference at `/docs/api/`:** an overview, then one page per area: charts and presets, `chart()`, layers, scales and axes, the scene, events and plugins, rendering, responsive options, `chartist/compat`, the 1.x chart classes, and the 1.x helpers. Each entry shows its signature, description, parameters, return value, properties (with types and defaults for options), examples and links. Type names link to their entries.
- **Built from the source at build time** with TypeDoc's JSON model, rendered by the site's own components, so the reference looks like the rest of the docs rather than a TypeDoc theme.
- **Complete by construction:** every export of `chartist` and `chartist/compat` appears on exactly one page, checked in the build. A new export without a page fails the check.
- **Marked by status:** `@experimental` and `@deprecated` show as badges; the 1.x classes get a short entry with a link to the function that replaces them, and the 1.x helpers a compact list.
- **Option defaults** come from the presets' defaults objects, so they can't drift from the code.
- **Doc comments filled in** for the v2 public API (every top-level export and its members) and one-liners for the 1.x exports, including the two doc-comment findings from `add-docs-content` (the `lineSmooth` default, and interpolation comments still showing 1.x usage). Comments only: library behavior doesn't change.
- **Navigation:** a "Reference" group in the docs sidebar, and links between guides and the entries they use.

**Not in this change:** search (Pagefind is in the polish change), versioned references (only v2 is documented; 1.x keeps its archived site), and generic data typing.

## Capabilities

### Modified Capabilities

- `docs-site`: adds the API reference.
- `public-api`: the public exports carry doc comments, checked.

## Impact

- `apps/docs`: TypeDoc as a dev dependency, a generation step (Nx target, cached on the library's source), API page routes and components, a sidebar group, guide links.
- `packages/chartist/src`: doc comments only (no behavior, type or export changes); a doc coverage check.
- Specs: `docs-site`, `public-api`.
