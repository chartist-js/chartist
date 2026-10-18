## Context

See proposal.md for why. What the design builds on:

- `apps/docs/src/data/packages.ts` registers the documented packages (slug, npm name, description, version from the package's `package.json`). The subsites, the header, search and `llms.txt` read it. It is imported by e2e specs and unit tests too, so it must load outside Astro.
- `/packages/` (`src/pages/packages/index.astro`) renders one list item per package.
- The landing page's "New: Chartist 2.0" row is `ReleaseBanner.astro`, fed by one object in `src/data/release.ts`. It is a `[data-visual]` block, which the site screenshot script (`e2e/visual.mjs`) captures.
- Landing charts are `Chart.astro`: a reserved box that Chartist draws into on the client, with an optional draw-in.
- `@chartist-js/terminal` runs in any JavaScript runtime. `lineChart(data, { format: 'html', columns, rows })` returns the text art as an HTML string (`pre.ct-terminal`, one `i` per cell, classes instead of colors), styled by `@chartist-js/terminal/styles.css`. Its size is in characters, so it needs no measuring. The docs site already depends on the package.
- The terminal overview's live example (`src/examples/terminal/text-art`) frames the text art as a terminal window with its own CSS.

## Goals / Non-Goals

**Goals:**

- A registry entry is all a new package needs to appear on the landing page and the index, free or paid.
- No extra script on the landing page or the index for package previews.
- The terminal window frame is one component, used by the landing section and the cards.

**Non-Goals:**

- Interactive previews (editing, live data) on the index. Each package's overview keeps its live examples.
- A news archive page, dates on news rows or a feed. The list shows the newest three; older news lives in the changelog and GitHub releases.

## Decisions

### Previews are rendered at build time

`src/lib/package-previews.ts` maps each package's slug to a function that returns HTML, run while the page is built; a unit test checks that every registered package has one. For the terminal package it's `lineChart(data, { format: 'html', … })` inside the terminal frame. A future SVG-based package can return `renderToString(toScene(…))`.

- _Why:_ the text art shows without JavaScript, adds no script, doesn't shift the layout, and is what the package really draws.
- _Alternatives:_ a `LiveExample` per card (code panel and sandbox: too heavy for a grid of cards); client-side rendering with a lazy import of the package (more script for no visible gain, since the preview doesn't change).
- The preview functions live in their own module, not in `packages.ts`, so the registry stays plain data for e2e specs and unit tests.

### Licenses are a tagged field in the registry

```ts
type PackageLicense =
  | { readonly kind: 'free'; readonly name: string } // e.g. 'MIT OR WTFPL', from package.json
  | {
      readonly kind: 'commercial';
      readonly terms: string; // e.g. 'Yearly license, support included'
      readonly href: string; // where to get a license
    };
```

The card and the landing list render from it: a free package shows "Free" with its license name and the install command; a commercial one shows its terms and a "Get a license" link, and no install command. A free package's license name comes from its `package.json`, like the version.

- _Why:_ one field decides everything that differs, and TypeScript makes a commercial entry without a link impossible.
- _Alternative:_ a boolean `paid` plus optional fields: allows a paid entry without a link.
- The commercial card is built and checked with a temporary local entry during implementation (screenshots), not with a published fake package: no package is listed that doesn't exist.

### The index is a column of wide cards

One package per row: on wide screens the card has the preview on the left and the details on the right; on phones (below `md`) they stack. A narrow card grid left a lone card with empty space next to it, and wide cards keep each preview large as more packages arrive. The details, from top to bottom: the preview (dark terminal frame for the terminal package), the name with the version as a tag, the license tag, the sentence, the install command (or the license link), then links: Overview, the guides (titles from the package's content collection, as in its sidebar), API.

- _Why:_ one package already looks intentional as a single wide card, and more packages stack without a redesign.
- _Alternatives:_ a multi-column grid of narrow cards (tried: one card sat alone at the left with empty space); the old list with previews added (the preview and the text don't belong together visually).

The intro keeps the "More than SVG" heading and says, in the docs' voice, that packages are made by Chartist's author, free and paid, and that plugins from the community are on Plugins.

### News is a list in the site data

`src/data/release.ts` becomes `src/data/news.ts` with `NEWS: readonly NewsEntry[]`, newest first: `{ tag, title, text, href, linkLabel }`. `ReleaseBanner.astro` becomes `News.astro`: an `aside` labelled "News" with a list of up to three rows, each styled like today's banner (one card per row, the row is the link). The `data-visual` name changes from `release` to `news`.

Entries at the start:

1. **New:** `@chartist-js/terminal`. Chartist charts in your terminal and as text art in HTML, with the `ct-cli` command. Link: `/packages/terminal/`, "Meet it".
2. **New:** Chartist 2.0. Today's text and link to the release notes.

- _Why:_ "newest first, at most three" is a slice of an ordered array; no dates to keep in sync.
- _Alternative:_ entries with dates, sorted by date: more data for no visible use, since rows show no dates.
- The terminal package came with 2.0. Listing it as its own news is deliberate, to point at it from the top of the page.

### The landing section

`components/landing/Packages.astro`, after `Extend` in `src/pages/index.astro`, with `{ id: 'packages', label: 'Packages' }` after `extend` in `SECTIONS`. The layout follows the other sections (`section-head`, `reveal`):

- the heading and one sentence (the scene is the chart; SVG is one way to draw it);
- two panels side by side, stacked on phones: the SVG chart (`Chart.astro`, line with area, the data of the terminal overview's example) and the same chart as text art in the terminal frame;
- the `ct-cli` one-liner as a code block;
- a row of the registered packages (name, sentence, license tag), each linking to its overview, and a link to `/packages/`.

Settled while building it, so the two drawings read as the same chart:

- Both share a fixed Y axis (0, 5, 10, 15, `TEXT_ART_Y_AXIS`). Left alone, each renderer picks steps that suit its size: 2.5 in SVG, 5 in text art.
- The SVG chart is `plain` without draw-in: the library's default look and label width. The landing's compact padding cut off its top label, and the draw-in styles need a plugin plain charts don't load (the lines came out dotted).
- The SVG chart's top padding is the library's 15px plus the terminal's title bar (47px), so both plots start below a band of the same height.
- On wide screens (`lg`) the text art has more cells (46 × 17 instead of 34 × 14) and a larger font, so the window matches the SVG panel; below, the 34 columns fit a phone.

The terminal frame becomes `components/TerminalWindow.astro` (title bar with the three dots and a title, a dark screen), styled with the CSS of the text-art example. The example keeps its own copy: examples are standalone projects.

## Risks / Trade-offs

- [Braille and box-drawing characters depend on the stylesheet's font] → It's the same stylesheet the terminal docs use; check light, dark and phone screenshots of both pages.
- [Text art is wider than a phone] → The frame cuts it off, as on the terminal overview; pick a column count that fits 390 px (about 34 columns at 13 px) for the landing and the card.
- [A commercial card is never seen in CI until the first paid package] → The license field is typed, and the commercial branch is checked by screenshots with a temporary entry during implementation.
- [Moving `release.ts` breaks imports] → Only `ReleaseBanner.astro` imports it.
- [The site screenshot script's `release` block becomes `news`] → Re-record the site screenshots with the new name.

## Open Questions

These don't change this change's specs or tasks; they have to be answered before the first paid package.

- Where a paid package's source lives (a private repository rather than `packages/<name>` here), which registry it's published to, and how customers install it (private npm scope, token, license key).
- Whether paid packages join the lockstep release of `chartist` or have their own versions.
- The `scoped-packages` spec says maintained packages are published from this repository as public packages; it needs an exception or a new capability for paid packages.
- Checkout, invoices and the license terms page that a commercial entry's link points to.
- Whether a paid package's docs and API pages are public on chartist.dev, like the free ones.
