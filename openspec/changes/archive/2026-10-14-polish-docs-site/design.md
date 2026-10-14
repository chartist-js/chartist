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

Investigated (2026-10-14), and the premise was wrong: the glitch isn't specific to live examples. It happens in every layout, the full-screen playground included, only more often where the editor scrolls itself. Instrumenting CodeMirror's observer showed every misplaced character came the same way: CodeMirror reads typing in a MutationObserver, which runs at the next microtask checkpoint. When the first script to run after the browser inserts a character is a `scroll` listener (the editor following the cursor), CodeMirror's `onScroll` flushes the pending change with the selection it had cached from before the character, and the cursor lands in front of it.

Fix in the playground's editor: an `input` listener (`EditorView.domEventObservers({ input() {} })`, public API), which forces a microtask checkpoint right after the insertion, so the observer reads the change with the right selection first. Fast-typing e2e tests in the inline layout (docs live examples, example pages) and the full layout fail 10 of 10 runs without the fix and pass with it. The underlying behavior is a CodeMirror bug worth reporting upstream.

### D6: An entry point for language models

Models were trained on years of 0.x and 1.x code (`new Chartist.Line`), so the site offers what tools and agents read first, built from the same sources as the pages (added with the author, 2026-10-14):

- **`/llms.txt`** (the llmstxt.org format): `# Chartist`, a one-paragraph summary, firm notes for writing code (v2 is the functional API: `lineChart`, `barChart`, `pieChart`, `chart()`; the 1.x classes exist for compatibility; plugins and events on the pipeline), then sections of links: Docs, API reference, Examples, and Optional (the 1.x and 0.x archives).
- **`/llms-full.txt`**: the guides and the API reference in one Markdown file.
- **Markdown per page**: `/docs/<guide>.md`, `/api/<area>.md` and `/examples/<type>/<name>.md`.
  - Guides from their MDX: frontmatter title and description, component imports and data exports dropped, `LiveExample` replaced by its example's files as code blocks, `Callout` as a blockquote, `Step` unwrapped; code blocks untouched.
  - API pages from the TypeDoc model (`lib/api.ts`): each entry with its signature as a code block, description, parameters, properties with types and defaults.
  - Examples: title, description and files.
  - Links become absolute URLs, so they keep working in `llms-full.txt`.
- **On the pages**: `<link rel="alternate" type="text/markdown">` in the head and a "View as Markdown" link next to "Edit this page", for people pasting pages into a chat.
- **Checked**: a unit test converts every guide and fails on leftover JSX or imports; an e2e test fetches `llms.txt`, follows every link and checks every guide, API page and example has its Markdown.

## Risks / Trade-offs

- **Build time:** Pagefind indexes about 100 pages in seconds; OG images render about 100 PNGs (cached by Nx with the build).
- **Index size:** downloaded in chunks on search only.
- **satori's CSS subset:** flexbox only; the card design stays within it.
- **MDX to Markdown by line rules:** fine for the three components the guides use; the unit test catches a new component that isn't converted.

## Open Questions

- None blocking. Size of the 1.x build output is checked when it's built; if it's large (generated API pages), it may leave out what the archive doesn't need (source maps).
