# Tasks

## 1. Shared pieces

- [x] 1.1 Factor the tag row into a `PluginTags` component, add `pluginNeighbors(slug)` to `lib/plugins.ts`, and export a `mountThumbnails(selector)` from `scripts/gallery.ts` that the gallery itself uses. Verify: `pnpm nx run-many -t check test -p docs`; the examples gallery's thumbnails still render (`pnpm nx e2e docs` gallery tests)

## 2. Plugin pages

- [x] 2.1 Add `pages/plugins/[slug].astro`: breadcrumb, title, tags, package and version, description, note, facts, hint, live example with "Open in the playground", setup snippet, previous and next; in the search index with `section:Plugins`. Verify: an e2e test opens `/plugins/chartist-plugin-axistitle/` and finds the credits, the links, the license, the downloads, the tags and the setup; the live example of `chartist-plugin-pointlabels` draws its labels without console errors
- [x] 2.2 Add `plugins/[slug].md.ts`, the plugin pages in `llms.txt`, `plugins.md` as a list with links, and share cards in `lib/og.ts`. Verify: the llms and meta e2e tests cover a plugin page (Markdown resolves, `llms.txt` links it, share card present)

## 3. The overview

- [x] 3.1 Turn `plugins.astro` into tiles: live thumbnail, title, description, tags, chart types, downloads, the whole tile linking to the page; the filter on the tiles; "Write your own" below. Verify: e2e tests for the order, a tile's content and link, the filter (text, type, no match), no JavaScript (every tile shows, no filter), and a tile preview that draws without console errors
- [x] 3.2 Redirect old anchors (`/plugins/#<slug>`) to the plugin page with JavaScript, keep each tile's `id`, and point the guide link in `coming-from-1x.mdx` at the plugin page. Verify: an e2e test opens `/plugins/#stklcode-chartist-plugin-tooltips` and lands on that plugin's page; the links e2e test passes

## 4. Design check and gate

- [x] 4.1 Screenshots of the overview and one plugin page in light and dark mode and at phone width (390 px), and a check that neither page scrolls sideways; adjust spacing until the tiles look roomy next to the examples gallery. Verify: the screenshots, the axe checks in the e2e tests
- [x] 4.2 Run the gate: `pnpm nx run-many -t lint check test build --skip-nx-cache`, `pnpm nx format:check --all`, the docs e2e suite including the plugin contract test, and the playground e2e suite. Verify: all pass

## Workflow follow-up

- After "asa": push the branch and open a pull request in the author's voice.
