# Design

## Context

`apps/docs/src/pages/plugins.astro` renders every plugin in full (tags, facts, live example, setup) from `data/plugins.ts`, sorted by `sortedPlugins()` in `lib/plugins.ts`, with a client-side filter. The examples gallery (`pages/examples/index.astro`) shows tiles with live thumbnails: `scripts/gallery.ts` runs each example's files in a sandboxed preview when the tile nears the viewport, with the shared import map from `scripts/playground-env.ts`, which already maps every plugin's files. Each example has a page (`pages/examples/[...id].astro`) with a breadcrumb, the live example, a playground link and previous/next links. Its Markdown version comes from `[...id].md.ts`.

## Decisions

### The overview: roomy tiles with a live thumbnail

The tiles reuse the gallery's thumbnail runner, so the preview is the plugin's own example running live, with the same sandbox and import map. A plugin example's files are loaded the way `LiveExample` loads them. `scripts/gallery.ts` gets a small export (`mountThumbnails(selector)`) instead of a second copy of the runner.

Layout, kept roomier than the gallery:

- a grid with `minmax(min(440px, 100%), 1fr)`, so it never has more than two columns in the content width, and one at phone width;
- each tile is a `card link` with the preview on top (`aspect-[16/10]`, the gallery's dot grid);
- below the preview, with generous padding (about 24 px) and gaps (12 to 16 px): the title in the slab face, the description, a row of tags (the same tag markup as today, factored into a `PluginTags` component shared by tile and page), and a quiet line with the chart types and monthly downloads.

The tile has no setup code, no facts table and no editor: those are on the plugin's page. Interactive plugins (tooltips, zoom) show their chart in the preview. The hint ("hover a point") is on the page, where you can try it.

The filter stays as it is and works on the tiles (same `data-search` and `data-types` attributes). "Write your own" stays below the tiles.

### The plugin page

`pages/plugins/[slug].astro` follows the example page:

- **Top:** a breadcrumb ("Plugins"), the title, the tags, the package with its pinned version, the description and the note.
- **Facts:** the facts list as today (author, source, license, downloads with the snapshot date, last release, charts).
- **Example:** the hint, the `LiveExample` with "Open in the playground", then "Use it on your site" with the setup snippet.
- **Bottom:** previous and next in the overview's order (`sortedPlugins()`).

The content is in `data-pagefind-body` with the filter `section:Plugins`. `[slug].md.ts` renders the Markdown version with the same pieces, and `plugins.md` becomes the list with links. The share cards come from `lib/og.ts`'s card list, with the plugin's title and description.

### Old anchors

Each tile keeps `id="<slug>"`, so without JavaScript an old link `/plugins/#<slug>` still scrolls to the plugin's tile. With JavaScript, a short inline script on the overview replaces the location with `/plugins/<slug>/` when the hash names a plugin. The only site link to an anchor (`coming-from-1x.mdx`, the tooltips plugin) points to the page instead.

### The site's design

Both themes, phone width without horizontal scroll, axe clean, as every page. `STYLING.md` and `WRITING.md` apply: tags and cards from the existing components, no new colours.

## Risks / Trade-offs

- **Twelve live thumbnails** run only when they near the viewport, as in the gallery, so the overview stays light.
- **A plugin whose example only shows something after interaction** looks like a plain chart on its tile. That's acceptable: the tile's text says what it does.
- **Search results** now point to plugin pages instead of the single page, which is better for long descriptions.

## Migration

None. Old anchors redirect, and the overview URL stays.
