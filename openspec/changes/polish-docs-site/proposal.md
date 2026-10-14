# Proposal

## Why

The site has its content: landing page, guides, examples, playground and API reference. What's left before the release is what makes it pleasant to find things and to share them, plus a few rough edges found along the way:

- There's no search. With 16 guides, 13 API pages and 63 examples, readers need it.
- Shared links show no preview: no Open Graph or Twitter card tags, and no canonical URLs or sitemap.
- The version links point at `https://chartist.dev/` for the 1.x docs, which is the address v2 will take over, so the 1.x docs need a lasting home.
- On example pages with long code, the chart floats in the middle of a much taller preview (findings of `add-docs-examples`).
- In live examples, fast typing can move a character to the end of the line (finding of `add-playground-types`), which never happens in the full-screen playground.
- The footer doesn't link the API reference.

## What Changes

- **Search** with Pagefind, built from the static site, self-hosted (no third-party requests): a search button in the header and Ctrl/Cmd+K open a search dialog in the site's design. Results are grouped by section (docs, API, examples) and show the matching passage. Each API entry is indexed on its own, so `lineChart` finds the entry, not just its page.
- **Share previews:** a card image per page, generated at build time in the brand's look (the yellow of the hero, the mascot, the page title and section), with Open Graph and Twitter card tags, canonical URLs and a sitemap.
- **A lasting home for the 1.x docs** (decided with the author): the static output of one last 1.x docs build, under `/v1/` of this site, committed as files. The Docusaurus stack isn't kept. The version switcher and footer link it and the 0.x archive, from one place.
- **Example previews fill their box:** example charts sized for a window are drawn to the size of the preview, so tall previews show a tall chart instead of empty space.
- **The live example typing glitch:** find the cause and fix it.
- **Footer:** an API link.
- **An entry point for language models** (added with the author): `/llms.txt`, `/llms-full.txt` and a Markdown version of every guide, API page and example, generated from the same sources, with firm notes that v2 code uses the functional API. Models trained on 1.x code otherwise write `new Chartist.Line(…)`.

**Not in this change:** hosting and deployment (the release phase), and library changes (`fix-library-findings`).

## Capabilities

### Modified Capabilities

- `docs-site`: search, share previews, version links, example preview sizing.
- `example-playground`: no typing glitch in inline layouts.

## Impact

- `apps/docs/public/v1/`: the 1.x docs build output (static files).
- `apps/docs`: Pagefind (dev dependency, index step after the build), a search dialog, OG image generation (satori and resvg as dev dependencies, fonts from the site's own font packages), head tags, `@astrojs/sitemap`, version URLs in `lib/site.ts`, the example preview styles, the footer.
- `packages/playground`: the fix for the typing glitch, if it's on the playground's side.
- e2e tests for search, the head tags, the preview sizing and the Markdown versions.
