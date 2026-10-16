## Why

Google still sends a lot of visitors to the 0.x docs at https://gionkunz.github.io/chartist-js/, which was Chartist's home for years. Those pages show the 0.x API, a 2022 "new version" pop-up, Google Analytics and a Creative Tim affiliate block that is no longer needed. Their search ranking should go to chartist.dev, and the 0.x docs should stay readable there as an archive, like the 1.x docs under `/v1/`.

## What Changes

- **The 0.x docs move to `chartist.dev/v0/`** as static files in `apps/docs/public/v0/`, taken from the last build on the `gh-pages` branch of `gionkunz/chartist-js` (`c1e49e1`, August 2022). The content stays as it was, apart from what is removed or changed:
  - the Creative Tim block on the home page ("Get awesome Dashboard Templates by Creative Tim"), its CSS and its three images on S3;
  - Google Analytics on every page;
  - the 2022 version notice pop-up, replaced by a short static note that points to chartist.dev;
  - the web fonts (Oxygen, Source Code Pro, Font Awesome 4.1), which are self-hosted instead of loaded from Google and cdnjs;
  - files the pages don't use: `bower_components/` (most of the 19 MB), `test-chart.html`, `doc-clean-pull.sh`, the 0.x `404.html`, and the dead html5shiv script in `apidoc/`.
- **The version switcher and the footer** link the 0.x archive at `/v0/` instead of the old GitHub Pages site.
- **Redirect pages for the old site:** a generator in `apps/docs` writes one page per old URL that sends visitors on with a canonical link, a script and an instant meta refresh. A page without a `#hash` goes to its v2 counterpart. An anchor with a v2 counterpart (an example, a guide section, a plugin) goes there. Any other anchor goes to the same page and anchor under `/v0/`. A `404.html` sends any other old path to the same path under `/v0/`.
- **Deploying the redirects:** after `/v0/` is live on chartist.dev, the generated pages replace the contents of `gh-pages` in `gionkunz/chartist-js`, in one new commit that keeps the branch's history. That push needs the author's go at that step.
- `docs/decisions.md` ("Docs hosting") records the new home of the 0.x docs and how the old URLs redirect.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `docs-site`: "Archived versions" adds the 0.x archive under `/v0/`, served without third-party requests, and the switcher and footer link it there. A new requirement covers the redirects from the old 0.x URLs.

## Impact

- `apps/docs/public/v0/` (new, about 1 MB plus fonts), `apps/docs/src/lib/site.ts` (`VERSIONS`), `apps/docs/astro.config.mjs` (keeps `/v0/` out of the sitemap).
- A new redirect module and its Nx target in `apps/docs`, reusing `redirectHtml()` from `integrations/redirects.mjs`, with unit tests next to it. The checks that treat `/v1/` specially (`e2e/meta.spec.ts`, `e2e/fixes.spec.ts`, `e2e/llms.spec.ts`) cover `/v0/` too.
- The `gh-pages` branch of `gionkunz/chartist-js`: its content is replaced by redirect pages. That repository's other branches and settings stay as they are.
- No library code changes. There are no breaking changes for 1.x users.

## Out of scope

- The `ct` namespace URI `http://gionkunz.github.com/chartist-js/ct` in the library. It's an identifier, never fetched, and changing it would break existing CSS and code.
- Archiving or renaming `gionkunz/chartist-js`, or changing its README or settings. These can follow on their own once the redirects are live.
- Changing the 0.x content itself: wording, examples and the bundled 0.x Chartist stay as they were.
- The 1.x redirects on chartist.dev and the `/v1/` archive.
- Search Console. As far as we know, its Change of Address tool works only for whole domains, not for a `github.io` subpath.
