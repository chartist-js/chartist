# Proposal

## Why

The plugins page shows all 12 plugins as one long list. Every entry carries its facts, tags, a full live example with its code, and a setup snippet. It's complete, but it's a long scroll, and it's hard to see at a glance what's there. The author asked (2026-10-15) for an overview of tiles with the key details and a small preview, each leading to a page of its own, like the examples. The tiles should be airier than the examples gallery's.

## What Changes

- **`/plugins/` becomes an overview of tiles,** one per plugin, most downloaded first:
  - a small live preview that runs the plugin's own example, like the gallery's thumbnails;
  - the plugin's title, its description, its tags (`API v0.x`, `Global` or `ES module`, `SSR` or `No SSR`) and its chart types;
  - its monthly downloads.

  The whole tile links to the plugin's page. Tiles are larger and roomier than the examples gallery's: two per row on wide screens, one on phones.

- **The filter** (text and chart type) works on the tiles as it does on the list today. **"Write your own"** stays at the end of the overview.
- **A page per plugin at `/plugins/<slug>/`,** with:
  - a breadcrumb back to the overview, the title, the tags, the description and the note;
  - the facts: author, source, npm, license, downloads, last release, chart types;
  - the hint for interactive plugins, the live example with its code, "Open in the playground", and the setup snippet for the site;
  - links to the previous and next plugin.

  Each page has a Markdown version, a share card, and is in the search index and the sitemap.

- **Old links keep working.** A link to an entry on the old page (`/plugins/#<slug>`) lands on that plugin's page, and the guide's link to a plugin points to its page.
- **The Markdown versions:** `plugins.md` lists the plugins with links to their Markdown pages, and `llms.txt` lists the plugin pages.

## Breaking changes vs 1.x

None; this only changes the docs site.

## Out of scope

- New plugins or changes to the plugin data, apart from what the pages need to show.
- Static preview images: the tiles run the plugin examples live, like the gallery.
- Changing the examples gallery's tiles.

## Capabilities

### Modified Capabilities

- `docs-site`: the plugins page becomes an overview of tiles; each plugin gets its own page with its facts, live example and setup; old anchors lead to the plugin pages.

## Impact

- `apps/docs`:
  - `src/pages/plugins.astro` (the overview) and a new `src/pages/plugins/[slug].astro`, plus a Markdown route per plugin;
  - `src/lib/plugins.ts` (slugs, neighbors), `src/lib/og.ts` (share cards), `src/lib/markdown.ts` (`plugins.md`, `llms.txt`);
  - the gallery thumbnail runner, reused for the tiles;
  - the guide link in `coming-from-1x.mdx`;
  - the e2e tests (`plugins.spec.ts`, and the links, meta and llms tests).
- No library changes, no new dependencies.
