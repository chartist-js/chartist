# Design

## Context

- Exports: `packages/chartist/src/index.ts` (1.x modules first, then the v2 modules, "experimental until v2.0") and `src/compat/index.ts`. The recorded export lists are `test/api/exports/{chartist,compat}.json`.
- Docs site: Astro, MDX content collection with groups (`content.config.ts`: Start here, Chart types, Guides), sidebar from `lib/docs.ts`, code blocks with Shiki's `css-variables` theme, `check` validates samples.
- TypeDoc trial (2026-10-14): 0.28.20 supports TypeScript 6.0. It needs `moduleResolution: "bundler"` (the library's tsconfig still says `node`, which TypeScript 6 rejects) and `rootDir` at the package. Output: a 1.9 MB JSON model. Coverage per area in the proposal.
- 1.x had a TypeDoc-generated reference in Docusaurus (`tmp/chartist-v1/website`, `docusaurus-plugin-typedoc`): one page per symbol, in TypeDoc's markdown layout.

## Decisions

### D1: TypeDoc's JSON model, rendered by our components

A cached Nx target (`docs:api`) runs TypeDoc over the library's source with both entry points and writes `apps/docs/src/generated/api.json` (git-ignored). Its inputs are the library's `src` and the TypeDoc config, so it reruns only when the source changes; `check`, `build` and `dev` depend on it. Astro pages read the model through a small typed accessor (`lib/api.ts`) and render it with site components.

Alternatives: `typedoc-plugin-markdown` into MDX (fast, but template-like pages and markdown escaping trouble with signatures); the TypeScript compiler API directly (full control, but we'd rebuild what TypeDoc already resolves: re-exports, inherited members, comments, `{@link}`); API Extractor (needs `.d.ts` rollups and has its own model). TypeDoc's JSON is the established model with the least code on our side.

### D2: One page per area, entries as sections

Pages group exports by what readers look for, not by symbol:

| Page               | Exports (by source folder)                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Charts             | `presets` (`lineChart`, `barChart`, `pieChart`, their options and controllers)                                          |
| `chart()`          | `chart` (config, handle, overrides)                                                                                     |
| Layers             | `layers`                                                                                                                |
| Scales and axes    | `scales`                                                                                                                |
| Scene              | `scene` (`node`, `findAll`, `mapNodes`, `NodeRoles`, contexts, attributes)                                              |
| Events and plugins | `pipeline`, plus `ChartEvents`, `ChartPlugin`, `withOptions`                                                            |
| Rendering          | `render` (`toScene`, `renderToString`, `Renderer`)                                                                      |
| Responsive         | `responsive`                                                                                                            |
| Data               | the data and series types in `core/types.ts`                                                                            |
| SVG and animation  | `svg`, `interpolation` (used by v2 animations too)                                                                      |
| Compat             | `chartist/compat`, and the 1.x event and plugin types it brings back                                                    |
| 1.x classes        | `charts`, `event`, the 1.x axis classes, `optionsProvider` and the 1.x drawing functions (`createSvg`, `createGrid`, …) |
| Helpers            | `core`, `utils`, `axes` units: data, math and utilities both APIs use                                                   |

The mapping is by source folder in one config (`lib/api-pages.ts`), with per-export overrides for the few that read better elsewhere. On a page: functions first, then interfaces and types, each in source order (which follows the reading order the code already has). Every entry has an anchor (`#lineChart`), so links and the browser's find work. One page per area keeps related things in view (an option type next to its function) and gives about a dozen pages instead of 260.

### D3: What an entry shows

- **Name**, with badges: `experimental`, `deprecated`, `1.x`.
- **Signature**, highlighted like other code (Shiki, `css-variables`), with type names linked to their entries.
- **Description** from the doc comment, rendered as markdown; `{@link X}` becomes a link.
- **Parameters** and **returns**, from `@param` and `@returns` and the types.
- **Properties** for interfaces and option types: name, type, default, description; nested option objects (`axisX`) expand inline, one level.
- **Examples** from `@example`, as code blocks.
- **See also** from `@see`, for guides and related entries.

The 1.x classes get a minimal entry: description, constructor signature and a link to their function; their members aren't listed (the guide "Coming from 1.x" covers them). The helpers are a compact list: signature and one line each. Changed during implementation (2026-10-14, the author asked): the helpers were planned as "1.x helpers", but the v2 modules use most of them (29 of 66 directly, more through the core), so they're plain helpers in the functional API group, and only what the 1.x classes alone use (their drawing functions, `optionsProvider`, `EventEmitter`, the axis classes) moved to the 1.x page.

### D4: Defaults from the code

Option tables show a default for each option of the presets. The values come from the presets' defaults objects (`presets/*Defaults.ts`), imported at build time by the Astro page (Vite resolves the library's TypeScript source), matched by option path (`axisX.offset`). An `@defaultValue` tag in a comment wins where the object can't express it ("the renderer's mode"). Functions and objects among the defaults show as `—` with the comment's explanation.

### D5: Complete, checked

The docs `check` target fails when:

- an export in the recorded export lists has no entry, or has more than one;
- a v2 top-level export, or a member of a v2 interface or option type, has no description;
- a `{@link}` or a type reference points nowhere.

1.x exports need a one-line description, not member docs. The check reads the JSON model, so it runs without a browser.

### D6: Doc comments in the library

Writing the missing comments is most of the work. Rules: the first sentence says what it is or does (it's the summary in lists and in the playground's hover); options say what they change, in the reader's terms, with units; no restating the type. Fix the two doc-comment findings from `add-docs-content` (9: `lineSmooth` defaults to `monotoneCubic`, not cardinal; 10: interpolation comments show `new LineChart` / `Chartist.Smoothing`). No code, type or export changes; the type tests and the export lists stay as they are.

The comment work splits by area, so it fans out to parallel agents after the generator and one finished page exist (the foundation), as in `add-docs-content`.

### D7: Navigation and links

- The reference is its own header section (decided with the author 2026-10-14): "API" next to Docs, at `/api/` and `/api/<area>/`, with a sidebar of its own (Reference: the overview; Functional API; 1.x). The docs layout serves both sections, and previous/next stays within a section.
- Guides link to the entries they use where it helps (the chart type pages to their function and options, Events and plugins to `ChartEvents` and the scene types), and entries link back with `@see`.
- The overview page explains how to read the reference (badges, the 1.x sections) and lists every area with a sentence.

## Risks / Trade-offs

- **Comment volume:** several hundred members. Mitigated by the fan-out (D6) and by requiring member docs only for v2.
- **TypeDoc upgrades** may change the JSON model; the accessor in `lib/api.ts` is the only place that reads it, and the version is pinned.
- **Build time:** a TypeDoc run takes a few seconds and is cached by Nx on the library's source.
- **Long pages** (scene, helpers): each has a table of contents like the guides, and anchors per entry.

## Open Questions

- None blocking. Page titles and the overview's wording are decided while writing.
