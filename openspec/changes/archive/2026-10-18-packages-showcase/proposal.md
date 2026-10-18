## Why

The author's packages are only reachable through the "Packages" header link, and `/packages/` is a plain list: a name, a sentence, an install command and a link. Nothing shows what a package draws, and the page has no place for what comes next. The next package is a paid financial charts package (a yearly license with support), and more free and paid packages follow. The landing page should point at the packages, and the index should be ready to show free and paid packages side by side.

Packages are always the author's own. Third-party work is a community plugin and stays on `/plugins/`.

## What Changes

- **News on the landing page instead of one release banner**: the "New: Chartist 2.0" banner becomes the first row of a short news list, newest first, and a second row announces `@chartist-js/terminal` with a link to its overview. Each row keeps today's banner look: a tag, a title, one sentence and a link. Later announcements (a new package, a release) are a new entry in the site data, and older rows drop off after the newest three.
- **A packages section on the landing page**, after "Bend it to your will" (Extend): one chart drawn twice, as SVG by `chartist` and as text art by `@chartist-js/terminal`, with the `ct-cli` one-liner and a link to `/packages/`. Below it, a short row of the packages from the site's package registry (`src/data/packages.ts`), so a new package shows up there without changing the section. The section gets a chapter in the landing's sticky navigation.
- **A package showcase at `/packages/`**: a grid of package cards instead of a list. Each card has a preview of what the package draws, rendered by the package when the site is built, the package name and version, one sentence on what it does, its license, how to get it, and links to its overview, guides and API.
- **Free and paid packages in the registry**: each package entry says whether it's free (with its license name, e.g. MIT) or commercial (a yearly license that includes support, with a link to get one). A free package shows its install command; a commercial one shows its license terms and a "Get a license" link instead.
- **The index intro** says that packages are made by Chartist's author, free and paid, and sends community work to Plugins.
- **No library or package code changes.**

Out of scope:

- How paid packages are built, hosted and delivered: where their source lives, which registry they're published to, license keys, checkout and payment, invoices, and whether they join the lockstep release. These need their own decisions before the first paid package (see design, "Open questions"). This change only makes the pages ready to present a paid package.
- A pricing page, checkout flow or account area.
- The financial charts package itself.
- Changes to the package subsites (`/packages/<name>/…`) beyond what the cards link to.

Breaking changes vs 1.x: none. This changes the docs site only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `package-docs`: the package index becomes a showcase with previews and license information for free and commercial packages, and its intro defines packages as the author's own.
- `docs-site`: the landing page's release banner becomes a news list, and the landing page gains a packages section that draws one chart as SVG and as text art and a chapter in its navigation.

## Impact

- `apps/docs/src/data/packages.ts`: new fields per package (preview example, license kind and terms).
- `apps/docs/src/pages/packages/index.astro`: rewritten as a card grid.
- `apps/docs/src/data/release.ts` becomes a list of news entries, and `ReleaseBanner.astro` renders it as rows (renamed to a news component).
- `apps/docs/src/components/landing/`: a new section component, added to `src/pages/index.astro` and to `SECTIONS` in `src/data/landing.ts`.
- The text art is rendered when the site is built, with `@chartist-js/terminal`'s HTML output, so the landing page and the index load no extra script. The terminal stylesheet is added to both pages.
- Docs e2e: the landing and packages tests extend to the new section and cards; existing loops (every page loads, every live example runs, axe) cover the rest.
