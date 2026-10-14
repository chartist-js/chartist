# Design

## Context

- The site is static Astro (`apps/docs`), built to `dist/apps/docs`, base path and site URL from `DOCS_BASE` and `DOCS_SITE` (hosting is decided in the release phase). Pages: landing, 16 guides (`/docs/`), 14 API pages (`/api/`), the examples gallery and 63 example pages (`/examples/`), the playground.
- The docs e2e tests fail on any request to another origin, and run axe on every page in both themes.
- Version links: `VERSIONS` in `lib/site.ts`, shown in the docs sidebar's switcher and the footer. 1.x docs live at `https://chartist.dev/` today (Docusaurus, deployed from `main` by `website.yml`); 0.x at `https://gionkunz.github.io/chartist-js/`.
- Example pages use `FILL_FRAME` (`scripts/playground-env.ts`): charts sized `height: 50vh` become 16:10, centered, as large as the frame allows.
- Candidates checked 2026-10-14: `pagefind` 1.5.2, `satori` 0.56.1, `@resvg/resvg-js` 2.6.2.

## Decisions

### D1: Pagefind, with our own dialog

The `build` target runs `pagefind --site <out>` after Astro, writing `pagefind/` next to the pages. Pagefind's default UI looks like Pagefind, so the dialog is ours: it loads `pagefind.js` on first open (nothing before), queries as you type (debounced), and renders results in the site's design. It's a `<dialog>`: Escape closes it, focus returns to the button, arrow keys move through results, Enter opens one.

Indexing:

- `data-pagefind-body` on the main content of guides, API pages, example pages and the landing page; headers, footers, sidebars and tables of contents stay out.
- `data-pagefind-filter="section:…"` (Docs, API, Examples) to group results.
- On API pages, each entry is a sub-result through its heading anchor, so a search for `lineChart` links to `/api/charts/#lineChart`. Signature code is indexed; property tables too, so `showArea` finds the options that have it.
- Code blocks in guides are indexed with a lower weight (`data-pagefind-weight`).

In dev, the index from the last build is served if there is one (a dev middleware serves `dist/.../pagefind/`); otherwise the dialog says search works in the built site.

Alternatives: Algolia DocSearch (third-party requests, an account, and crawling on their schedule); a hand-rolled index (Pagefind already does chunked, language-aware indexes well).

### D2: Card images at build time

An Astro endpoint renders one PNG per page (`/og/<path>.png`, 1200 × 630) with satori (layout from a small element tree) and resvg (SVG to PNG):

- The hero's yellow, the mascot (the `point` pose for docs and API, `hero` with the board for the landing and examples), the section as an eyebrow, the page title in Zilla Slab, and the description in Atkinson Hyperlegible Next.
- Fonts come from the installed `@fontsource` packages (satori needs TTF, OTF or WOFF; the packages ship WOFF next to WOFF2).
- The mascot comes from the same drawing as `Mascot.astro`, rendered to an SVG string.

Head tags in `BaseLayout`: `og:title`, `og:description`, `og:image` (absolute, from `site`), `og:url`, `og:type`, `twitter:card` (`summary_large_image`), and `<link rel="canonical">`. `@astrojs/sitemap` writes the sitemap; `robots.txt` points to it.

### D3: The 1.x docs as static files under `/v1/`

Decided with the author (2026-10-14): the 1.x docs move to `/v1/` of the new site, as the static output of one last build. The 1.x docs won't be updated again, so the Docusaurus stack isn't kept.

- Build the 1.x website once, from the `v1.5.0` sources (`tmp/chartist-v1/website`, copied to a scratch folder so `tmp/` stays untouched), with `baseUrl: '/v1/'` so its links and assets resolve under the new path.
- Commit the output to `apps/docs/public/v1/`; Astro copies it as is. A short README there says where it came from and that it isn't edited.
- Leave it out of the site's search index, sitemap, link checks and e2e page list; it keeps its own search, if it has one, as built.
- `VERSIONS` (one place, `lib/site.ts`) points 1.x to `v1/` on the same site, and 0.x to `https://gionkunz.github.io/chartist-js/`. The docs' version switcher and the footer use it.
- Old 1.x deep links (`chartist.dev/docs/...`) are the release's concern: the 1.x and 2.x docs both use `/docs/`, so redirects need the final URL lists. Recorded for the release.

### D4: Example previews fill their box

On example pages, a chart sized for a window (`height: 50vh`, as in the 1.x sandboxes) fills the whole preview frame, both ways, instead of keeping 16:10. The chart then has the proportions of the box it's in, which is what a responsive chart does in a page. Examples with their own layout are unchanged. The gallery's thumbnails (480 × 300) don't change.

### D5: The typing glitch

Investigate first: the glitch shows in live examples, whose editor sits in a container that scrolls itself, and not in the full-screen playground. The fix goes where the cause is (the live example's layout or the playground's inline layout), with an e2e test that types fast and checks the text, replacing the delay in today's test.

## Risks / Trade-offs

- **Build time:** Pagefind indexes about 100 pages in seconds; OG images render about 100 PNGs (cached by Nx with the build).
- **Index size:** downloaded in chunks on search only.
- **satori's CSS subset:** flexbox only; the card design stays within it.

## Open Questions

- None blocking. Size of the 1.x build output is checked when it's built; if it's large (generated API pages), it may leave out what the archive doesn't need (source maps).
