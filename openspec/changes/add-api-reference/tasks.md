# Tasks

## 1. Foundation

- [x] 1.1 TypeDoc as a docs dev dependency (pinned), its config (both entry points, `moduleResolution: "bundler"`, internals excluded), and the cached `docs:api` target writing `src/generated/api.json` (D1).
- [x] 1.2 `lib/api.ts`: typed access to the model (entries, signatures, comments, links, type rendering) and `lib/api-pages.ts`: the page mapping (D2).
- [x] 1.3 Components: entry, signature, properties table (with defaults, D4), badges, see-also; the area page route and the overview; the "API" header section with its sidebar (D3, D7).
- [x] 1.4 One area finished end to end as the reference for the rest: Charts (presets), with complete doc comments and defaults.
- [x] 1.5 The completeness check in `check` (D5).

## 2. Doc comments and pages (parallel after 1)

- [ ] 2.1 `chart()`, layers, scales and axes.
- [ ] 2.2 Scene, events and plugins, rendering, responsive, compat.
- [ ] 2.3 1.x classes (minimal entries) and helpers (one-liners); finding 10.

## 3. Links

- [x] 3.1 Guides link to their entries; entries link to guides with `@see` (D7).

## 4. Proof

- [ ] 4.1 The check passes: every export on exactly one page, v2 described, no dead links.
- [ ] 4.2 Docs e2e: every API page loads without console errors and passes axe in both themes (the existing page list picks them up); a type link jumps to its entry.
- [ ] 4.3 Library gate unchanged: type tests, export lists, visual tests (comments only).
- [ ] 4.4 Findings 9 and 10 marked resolved; plan updated; full gate.
