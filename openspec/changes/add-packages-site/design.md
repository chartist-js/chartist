# Design

## Context

The docs site (`apps/docs`) knows two sections and one library:

- **Content:** one collection, `docs` (`src/content.config.ts`), with the groups Start here, Chart types and Guides. `src/lib/docs.ts` builds navigation for `NavSection = 'docs' | 'api'`. `DocsLayout.astro` takes the sidebar, previous and next links, table of contents, Markdown link, breadcrumb, mobile menu label and search filter from that, with `page.section === 'api' ? … : 'Docs'` choices throughout. `EDIT_BASE` points at `src/content/docs/`.
- **Header:** `NAV` in `src/lib/site.ts` (Docs, API, Examples, Plugins, Playground, Credits). The active item comes from `BaseLayout`'s `section` prop.
- **API reference:** one TypeDoc run (`docs:api`, `api/typedoc.json`, entries `chartist` and `chartist/compat`) writes `src/generated/api.json`. `src/lib/api.ts` parses that one model into module-level `ENTRIES` and `LOCATIONS`, and resolves links by reflection id within it. `src/lib/api-pages.ts` groups entries into pages by source path. `src/lib/api.test.ts` checks completeness against chartist's export lists (`packages/chartist/test/api/exports/*.json`), doc comments and dead links.
- **Page lists:** `llms.txt` and `llms-full.txt` (`src/lib/markdown.ts`), share cards (`src/lib/og.ts`), the Markdown routes (`*.md.ts`, `markdownPath`), the search filters (`section:API|Docs`, grouped in `search.ts`), the samples check (`scripts/check-samples.ts`, `src/content/docs` only) and the e2e lists (`e2e/pages.ts` reads `src/content/docs`).
- **Live examples** come from `src/examples/<page>/<example>/` (`src/lib/examples.ts`).

The terminal guide is `src/content/docs/terminal-rendering.mdx` (Guides, order 9), with its example in `src/examples/terminal-rendering/text-art`.

## Goals / Non-Goals

**Goals:**

- One section, "Packages", that any `@chartist-js` package joins with a registry entry, an overview page and a TypeDoc entry point.
- The same page qualities as the core docs (layout, Markdown, `llms`, search, share cards, checks), by sharing their code rather than copying it.

**Non-Goals:**

- Examples galleries, versioned package docs, several API pages per package (see the proposal).
- Restyling the docs layout; the subsite looks like the docs.

## Decisions

### A package registry and a second content collection

- **Registry:** `src/data/packages.ts` lists the documented packages: npm name, slug, one-sentence description, and the path of the package. The version and install command come from the package's `package.json` at build time. A new package means one entry here.
- **Content:** a second collection, `packages`, globs `src/content/packages/<slug>/*.mdx`, with `title`, `description`, `order` and an optional `label`. `index.mdx` is the overview (order 0); the other files are guides, ordered by `order`. Guides import components as the core guides do.
- **Examples:** package guides' live examples live in `src/examples/<slug>/<example>/`, so the existing two-level glob (`<page>/<example>`) still fits. The terminal example moves from `terminal-rendering/text-art` to `terminal/text-art`.

Alternative: package docs inside each package (`packages/<name>/docs/*.mdx`), loaded with a glob loader outside `src`. It puts docs next to the code, but guides import site components with relative paths, live examples would need to move too, and the samples check, edit links and WRITING rules all assume the site's folders. Considered for later, when a package has enough docs to want it; the registry keeps the switch local.

### One layout, three sections

`NavSection` becomes `'docs' | 'api' | 'packages'`, and the section-dependent strings in `DocsLayout.astro` (breadcrumb, mobile menu label, aside label, search filter, markdown link) move into one lookup per section instead of ternaries. A package page's sidebar is its package navigation: Overview, the guides in order, API. The breadcrumb reads "Packages / terminal". Previous and next links stay within the package. `EDIT_BASE` becomes per collection.

Routes:

- `src/pages/packages/index.astro`: the index.
- `src/pages/packages/[pkg]/[...page].astro`: the overview (`/packages/terminal/`) and the guides (`/packages/terminal/<guide>/`).
- `src/pages/packages/[pkg]/api.astro`: the API page. `api` is reserved as a guide slug; the content schema rejects it.
- Matching `.md.ts` routes for each, using `markdownPath`.

The header's `NAV` gets `{ id: 'packages', label: 'Packages', path: 'packages/' }` after API: packages are what you reach for after the core library. Its fit on the desktop header and in the mobile menu is checked with screenshots.

### API models per package

`docs:api` runs TypeDoc once more per registered package (an options file per package, `api/typedoc.<slug>.json`, entry point `packages/<slug>/src/index.ts`, the package's tsconfig), writing `src/generated/api/<slug>.json`. The target's inputs gain `packages/*/src/**`.

`src/lib/api.ts` reads a model per source instead of one module-level project:

- a `Model` holds its entries, locations and module names; `core` is today's model;
- `linkTo(id)` resolves within the model the entry comes from;
- a reference to an external type whose package is `chartist` (TypeDoc marks those as references without a target in the package's model) resolves by name in the core model, so `LineChartData` on the terminal page links to `/api/…#LineChartData`;
- the entry rendering (signatures, members, examples, badges) is shared; only the page grouping differs: a package has one page with all its exports, in source order.

Completeness for packages: the test takes the package's exports from its TypeDoc model's top-level children (the root entry's exports). There is no export snapshot like chartist's, because packages have no 1.x surface to protect; the package's own `test/entry.spec.ts` already checks what ships. Every export needs a doc comment summary and no dead links, with the same `problems()` and `deadLinks()` checks.

### Search, share cards, llms and checks

- **Search:** package pages get the filter `section:Packages`, and the search dialog groups it after API.
- **Share cards:** `og.ts` adds a card per package page, eyebrow "Packages", title "terminal: Terminal rendering" style.
- **llms:** `llms.txt` gets a "Packages" section after "API reference" with each package's overview, guides and API page; `llms-full.txt` adds the package pages after the API reference. The note for agents names the packages in one line.
- **Samples check:** `check-samples.ts` reads `src/content/packages` too.
- **e2e:** `pages.ts` lists the package index and every package page, from the registry and the content folder, so the console, axe and live-example checks cover them; `llms.spec.ts` counts the package links.

### Moving the terminal guide

The guide moves in its own commit (`git mv` of the MDX and the example folder), so git keeps it as a rename, then gets its edits: frontmatter (`order` instead of `group`), import paths, the example id. Its intro about what the package is goes to the new `index.mdx` overview with install and a quick start from the README; the guide keeps the CLI, the API for CLI tools and HTML output. The core Guides return to their order (Updating charts back to 9), and the `add-terminal-package` change's `docs-site` delta, which added the guide to "Guides and chart type pages", is dropped: its live-example scenario is covered by "Package guides follow the docs rules" here.

### Docs for writers

`apps/docs/WRITING.md` gets a short "Package pages" section: where they live, the overview's shape (what, install, quick start, links), and that every guide still has a live example. The page table loses the terminal row.

## Risks / Trade-offs

- [A seventh header item crowds the desktop header and the phone menu] → Screenshots at desktop and 375 px in both themes are part of the tasks; if it doesn't fit, "Credits" moves to the footer, which already links it.
- [Two TypeDoc runs make `docs:api` slower] → The package run is small (one entry point); Nx caches the target by its inputs.
- [External type links depend on TypeDoc's representation of `chartist` types in the package's model] → A unit test covers one such link (`LineChartData`), so a TypeDoc upgrade that changes it fails loudly.
- [Two in-flight changes on one branch touch the same docs] → The tasks update `add-terminal-package`'s artifacts in the same commit as the move, and the follow-up archives `add-terminal-package` first.

## Migration Plan

Nothing is published yet: `/docs/terminal-rendering/` never went live, so it needs no redirect. Both changes merge together.
