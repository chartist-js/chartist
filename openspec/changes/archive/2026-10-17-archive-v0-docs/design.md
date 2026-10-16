## Context

The 0.x site is served by GitHub Pages from the `gh-pages` branch of `gionkunz/chartist-js` (legacy branch build, custom 404, HTTPS enforced, no custom domain). The branch's last commit is `c1e49e1` (August 2022), which added the version notice pop-up. GitHub Pages can't send HTTP redirects, so everything here is done with static pages.

What the build contains:

- **Six pages:** `index.html`, `getting-started.html`, `examples.html`, `api-documentation.html`, `plugins.html` and `apidoc/index.html`. The last is a JSDoc stub showing the README. The first five are long single pages, and old links point into them with anchors (`examples.html#simple-line-chart`, `getting-started.html#responsive-sugar-topping`).
- **What they load:** the five pages load only `scripts/all.js` (the bundled site, with 0.x Chartist and the live code editors), `styles/main.css`, `styles/vendor.css`, `images/chartist-guy.svg` and `favicon.ico`. `bower_components/` (most of the 19 MB) isn't loaded by any page.
- **Third-party requests:** Google Analytics (`UA-53685926-1`) inline on every page; the Google WebFont loader from `ajax.googleapis.com`, which loads Oxygen 300/400/700 and Source Code Pro 400/700 from Google Fonts and Font Awesome 4.1.0 from cdnjs; and on the home page, three Creative Tim images on S3.
- **Links:** pages link each other relatively, so they work under another base path.

The 1.x archive (`public/v1/`, "Archived versions" in `openspec/specs/docs-site/spec.md`) is the model to follow: static files copied as they are, with a README saying where they came from. The redirect pages reuse `redirectHtml()` from `apps/docs/integrations/redirects.mjs`, which keeps the query and `#hash` with a script and falls back to a meta refresh.

## Goals / Non-Goals

**Goals:**

- An old link lands on the most useful current page, and on the 0.x content when v2 has nothing that matches.
- Search engines see a permanent move: instant redirect and a canonical link to the target.
- The mapping is data with unit tests, and every target is checked against the built site, so a renamed v2 page or heading fails a check instead of sending visitors to a 404.

**Non-Goals:**

- Rebuilding the 0.x site from its sources (Grunt, Assemble, Bower). The built output is enough, and that toolchain no longer installs reliably.
- Automating the deploy to `gionkunz/chartist-js`. It happens once, so a workflow there would cost more than it saves.

## Decisions

### D1: Copy the built site and edit it as little as possible

`public/v0/` gets the six pages, `scripts/all.js`, `styles/`, `images/`, `favicon.ico` and the files `apidoc/` loads. The edits are made by hand once and listed in `public/v0/README.md`, as `public/v1/README.md` does for its build:

- **Removed:** the Creative Tim section of `index.html` and its `.affiliate-project*` rules, the Google Analytics snippet on each page, the version notice (its markup, CSS and script) on the five content pages, the html5shiv `<script>` in `apidoc/index.html`, and the files listed in the proposal.
- **Added:** a short static note at the top of each page, styled with the page's own CSS: "This is the archived documentation of Chartist 0.11. The current docs are at chartist.dev." It links to `/`.

Rebuilding from the 0.x sources was considered and rejected (see Non-Goals). Editing `all.js` isn't needed: it makes no requests of its own.

### D2: Self-host the archive's fonts

The WebFont loader snippet is replaced by a `<link>` to `fonts/fonts.css` in the archive. That file has `@font-face` rules for Oxygen 300/400/700 and Source Code Pro 400/700 (woff2, SIL OFL), and Font Awesome 4.1.0's CSS and fonts (OFL fonts, MIT CSS), with their licenses next to them. The rest of the site self-hosts its fonts, and `docs/decisions.md` allows GoatCounter as the only third-party request. The `.wf-loading` rules in `main.css` only hide icons while the loader runs; without the loader that class is never set, so nothing is hidden.

Alternatives: keep loading from Google and cdnjs (rejected: third-party requests and a privacy cost for an archive), or drop the fonts (rejected: the page relies on Font Awesome for icons, and the archive should look like the original).

### D3: `/v0/` with `.html` files, indexed but not in the sitemap

The files keep their names (`/v0/getting-started.html`), so the relative links inside them keep working and the anchor fallback is a direct path. GitHub Pages also serves them without the extension. Like `/v1/` (`noIndex: false`), the archive may be indexed, but it isn't in the sitemap: the old URLs pass their ranking to the v2 pages, and the archive stays findable for people looking for 0.x. The sitemap filter in `astro.config.mjs` and the checks that skip `/v1/` (`e2e/meta.spec.ts`, `e2e/llms.spec.ts`) treat `/v0/` the same way.

GoatCounter isn't added to the archive, as for `/v1/`.

### D4: The mapping as data in `src/lib/v0-redirects.ts`

One module holds the mapping and the functions around it, so the unit tests and the generator import the same thing:

- `V0_PAGES`: each old page (`''` for the home page, `getting-started`, `examples`, `api-documentation`, `plugins`, `apidoc/`) with its v2 target and an `anchors` record from old ids to v2 paths with an optional `#hash`.
- `v0Target(page, hash)`: the mapped anchor, or the same page and hash under `/v0/` when the hash isn't mapped, or the page's v2 target when there is no hash.

Page targets: home → `/`, `getting-started` → `/docs/getting-started/`, `examples` → `/examples/`, `api-documentation` → `/api/`, `plugins` → `/plugins/`, `apidoc/` → `/api/`.

Anchor mapping (the ids are from the 0.x pages; v2 hashes are the guides' heading ids, checked against the build):

| Old page          | Old anchors                                                                                                                                                                               | Target                                                                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| getting-started   | `download-and-setup`, `one-two-three-css`, `simple-start`, `simple-start-cdn`, `use-a-cdn-alternatively`, `bower`, `custom-include`, `create-your-first-chart`, `as-simple-as-it-can-get` | `/docs/getting-started/`                                                                                                                                                                                                                 |
|                   | `the-sass-way`, `customizing-the-default-css`, `default-sass-settings`                                                                                                                    | `/docs/styling-with-css/#sass`                                                                                                                                                                                                           |
|                   | `styling-your-chart`, `customizing-the-default-css` and its subsections `line-chart`, `bar-chart`, `pie-chart`, `donut-chart` with their `custom-style-*` examples                        | `/docs/styling-with-css/`                                                                                                                                                                                                                |
|                   | `colour-up-your-charts`, `colour-override-line-chart`                                                                                                                                     | `/docs/styling-with-css/#one-color-per-series`                                                                                                                                                                                           |
|                   | `container-aspect-ratio-classes`, `creating-a-chart-using-aspect-ratios`, `simple-start-aspect-ratio-chart`                                                                               | `/docs/sizing-charts/#aspect-ratios`                                                                                                                                                                                                     |
|                   | `creating-a-chart-with-fixed-dimensions`, `simple-start-fixed-chart`                                                                                                                      | `/docs/sizing-charts/#fixed-sizes`                                                                                                                                                                                                       |
|                   | `more-than-one-chart-on-my-page`, `two-charts`                                                                                                                                            | `/docs/sizing-charts/#more-than-one-chart-on-a-page`                                                                                                                                                                                     |
|                   | `the-configuration-of-your-chart`, `simple-configuration-chart`, `default-settings`                                                                                                       | `/docs/data-and-options/#the-options-argument`                                                                                                                                                                                           |
|                   | `different-configuration-for-different-series`, `example-line-series-override`                                                                                                            | `/docs/data-and-options/#options-per-series`                                                                                                                                                                                             |
|                   | `responsive-sugar-topping`, `responsive-setting-overrides`, `example-simple-bar`                                                                                                          | `/docs/responsive/`                                                                                                                                                                                                                      |
|                   | `dynamic-colouring`, `example-dynamic-colours`                                                                                                                                            | `/docs/events-and-plugins/#dynamic-coloring`                                                                                                                                                                                             |
|                   | `animations-using-chartistsvg`, `example-simple-svg-animation`                                                                                                                            | `/docs/animations/`                                                                                                                                                                                                                      |
|                   | `switching-axis-type`, `creating-an-xyplot-chart`, `example-axis-auto`                                                                                                                    | `/docs/axes-and-scales/`                                                                                                                                                                                                                 |
|                   | `a-line-chart-is-only-1dimensional`, `1-dimension-values`, `2-dimensions-values`                                                                                                          | `/docs/axes-and-scales/` at "A line chart is only 1-dimensional?!"                                                                                                                                                                       |
|                   | `fixed-stuff-can-be-sweet-too`, `example-axis-fixed-and-auto`                                                                                                                             | `/docs/axes-and-scales/` at "Fixed stuff can be sweet too!"                                                                                                                                                                              |
| examples          | each live example, `example-<type>-<name>` or its short form (`simple-line-chart`, `stacked-bar`, `overlapping-bars`, `line-scatter-random`, …)                                           | the v2 example of the same name, `/examples/<type>/<name>/`, e.g. `example-line-modify-drawing` → `/examples/line/modify-drawing/`, `stacked-bar` → `/examples/bar/stacked/`, `example-timeseries-moment` → `/examples/line/timeseries/` |
|                   | `line-chart-examples`, `bar-chart-examples`, `pie-chart-examples`                                                                                                                         | `/examples/`                                                                                                                                                                                                                             |
| plugins           | `overview`, `whats-a-plugin`, `how-to-use-plugins`, `available-plugins`, `plugin-include`                                                                                                 | `/plugins/`                                                                                                                                                                                                                              |
|                   | `accessibility-plugin`, `tooltip-plugin`, `point-label-plugin`, `axis-title-plugin`, `threshold-plugin`, `filldonut-plugin`, `zoom-plugin` and their `example-plugin-*` ids               | that plugin's page, `/plugins/<package>/`, when v2 lists the same package; otherwise `/plugins/`                                                                                                                                         |
|                   | `target-line-plugin`, `example-plugin-targetline`                                                                                                                                         | `/docs/target-lines-and-bands/`                                                                                                                                                                                                          |
|                   | `develop-a-plugin`, `plugin-signature`, `example-plugin`, `plugin-example`                                                                                                                | `/docs/events-and-plugins/#writing-a-plugin`                                                                                                                                                                                             |
| api-documentation | all (0.x functions such as `chartistcore-method-getbounds`)                                                                                                                               | not mapped: `/v0/api-documentation.html#<hash>`                                                                                                                                                                                          |

Anything not in the table (for example `getting-started.html#advanced`) falls back to `/v0/`. An example the v2 gallery doesn't have falls back too. The full list is settled during implementation from the ids in the pages, and the unit tests check that each listed id exists in the 0.x page.

### D5: Redirect pages for the old site

A script `apps/docs/scripts/v0-redirects.ts`, run by an Nx target `docs:v0-redirects` that depends on `docs:build`, writes the old site's new contents to `tmp/v0-redirects/` (git-ignored):

- one page per old page (`index.html`, `getting-started.html`, …, `apidoc/index.html`), whose script picks the target from the hash with the page's anchor table, and whose canonical link and meta refresh point to the page's target without the hash;
- `404.html`, whose script sends `/chartist-js/<rest>` to `https://chartist.dev/v0/<rest>`, and which without scripts links to `https://chartist.dev/v0/`;
- `.nojekyll`, and a `robots.txt` that allows everything, so search engines can crawl the redirects.

`redirectHtml()` gets two options for this: an anchor table for the script, and leaving out `noindex`. Targets are absolute `https://chartist.dev/…` URLs. The pages on the old site leave out `noindex`, because a redirect is the signal search engines should follow, and Google advises against mixing `noindex` with a canonical link. The chartist.dev redirects keep `noindex` as they are now.

Before writing, the script checks every target against `dist/apps/docs`: the file has to exist, and a `#hash` has to be an `id` in that file. Any miss fails the target, with the list of missing targets.

Writing the redirects into the old site by hand was rejected: no tests, and no check when a v2 heading changes. A redirect in a JavaScript-only single-page app (one `404.html` for everything) was rejected because search engines would only see 404 responses.

### D6: Deploying the redirects by hand, after `/v0/` is live

1. Merge this change and deploy chartist.dev (`docs.yml` deploys from `main`). Check that `https://chartist.dev/v0/` and a few deep links load.
2. Run `pnpm nx run docs:v0-redirects`.
3. In a scratch clone of `gionkunz/chartist-js` on `gh-pages`: remove all files, copy in `tmp/v0-redirects/`, commit as one new commit (`docs: redirect to chartist.dev`). The branch history stays, so the 0.x build stays recoverable.
4. Push only with the author's go for that step. GitHub Pages rebuilds the branch in a minute or two. Check the scenarios of "Old 0.x URLs redirect" against the live site.

Rollback: revert that commit on `gh-pages` and push. The old site comes back as it was.

## Risks / Trade-offs

- **[Risk] Search engines don't treat meta refresh as a 301.** Google documents an instant meta refresh as a permanent redirect, and the canonical link backs it up. Bing and others are less clear. → That's the best GitHub Pages allows. The canonical link helps all of them.
- **[Risk] Mapped anchors break when a v2 heading or example is renamed.** → The generator's check fails, and the unit tests pin the table. The old site keeps whatever was deployed, so a rename after deploy needs a new run and push. The README in `public/v0/` and the "Docs hosting" decision say so.
- **[Risk] The archived `all.js` breaks in a future browser.** → It's archived as it was, like `/v1/`. The redirects don't depend on it, since every page without a hash goes to v2.
- **[Trade-off] Hash rules need scripts.** Without scripts, a deep link lands on the page's v2 counterpart, not on the section. Search engines don't index fragments separately, so this costs nothing in ranking.
- **[Risk] Conflict with the `test-strategy` branch,** which changes the docs e2e tests that this change touches (`meta.spec.ts`, `llms.spec.ts`). → Rebase onto it if it merges first. The edits are small, one-line filters.
