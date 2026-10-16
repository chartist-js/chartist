## 1. The 0.x archive under /v0/

- [x] 1.1 Copy the pages and the files they load from `gh-pages` of `gionkunz/chartist-js` at `c1e49e1` into `apps/docs/public/v0/` unchanged (the six pages, `scripts/all.js`, `styles/`, `images/`, `favicon.ico`, the `apidoc/` scripts and styles) and commit that alone, so the later edits show as diffs; verify no page references a file that wasn't copied (grep the pages' local `src`/`href`)
- [x] 1.2 Remove the Creative Tim section and its `.affiliate-project*` CSS from `index.html`, the Google Analytics snippet and the version notice from every page, and the html5shiv script from `apidoc/index.html`; verify by grepping `public/v0` for `creative-tim`, `google-analytics`, `versionNotice` and `googlecode` (no matches)
- [x] 1.3 Self-host the fonts: add `fonts/` with Oxygen 300/400/700 and Source Code Pro 400/700 (woff2), Font Awesome 4.1.0's CSS and fonts, a `fonts.css` and the licenses, and replace the WebFont loader snippet with a `<link>` to it; verify the pages request no other host (Playwright, recording requests on all six pages)
- [x] 1.4 Add the static archive note linking to chartist.dev at the top of each page, styled with the page's own CSS; verify by screenshots in light mode (the 0.x site has no dark mode) and at 375 px
- [x] 1.5 Write `public/v0/README.md`: where the files came from (`gh-pages` at `c1e49e1`), each removal and change, and that the files aren't edited otherwise; verify it lists every edit from 1.2–1.4
- [ ] 1.6 Check the live examples and the code editors on `examples.html` and `getting-started.html` under `/v0/` with the built site served by `e2e/serve.mjs`: the charts draw and editing the code updates them, with no console errors

## 2. Site wiring

- [ ] 2.1 Point the 0.x entry of `VERSIONS` in `src/lib/site.ts` to `href('v0/')` and update its doc comment; verify the version switcher and the footer link `/v0/` (the existing assertion in `e2e/fixes.spec.ts`, updated)
- [ ] 2.2 Keep `/v0/` out of the sitemap (`astro.config.mjs`) and out of the checks that skip `/v1/` (`e2e/meta.spec.ts`, `e2e/llms.spec.ts`); add `/v0/` paths to the archive check in `e2e/fixes.spec.ts` (`/v0/`, `/v0/getting-started.html`, `/v0/styles/main.css`); verify with `pnpm nx e2e docs --skip-nx-cache`

## 3. The redirect mapping

- [ ] 3.1 Add `src/lib/v0-redirects.ts` with `V0_PAGES` (page targets and anchor tables from design D4) and `v0Target(page, hash)`; verify with unit tests in `src/lib/v0-redirects.test.ts`: page targets, a mapped anchor per page, an unmapped anchor falling back to `/v0/<page>.html#<hash>`, the home page as `''`
- [ ] 3.2 Fill the anchor tables from the ids in the archived pages and the v2 examples, guides and plugin pages; add a unit test that every mapped id exists in its page under `public/v0/`, so a typo in the table fails
- [ ] 3.3 Extend `redirectHtml()` in `integrations/redirects.mjs` with an anchor table for the script and an option to leave out `noindex`, keeping its current output for the existing callers; verify `src/lib/redirects.test.ts` and `src/lib/v1-redirects.test.ts` still pass unchanged, and new tests cover both options

## 4. The redirect generator

- [ ] 4.1 Add `scripts/v0-redirects.ts` and the Nx target `docs:v0-redirects` (depends on `docs:build`, not cached) writing `tmp/v0-redirects/`: a page per old page, `404.html`, `.nojekyll` and an allow-all `robots.txt`; verify the folder's file list matches design D5
- [ ] 4.2 Check every target against `apps/docs/dist` before writing (the file exists; a `#hash` is an `id` in it) and fail with the list of misses; verify by mapping one anchor to a missing heading and seeing the target fail, then reverting
- [ ] 4.3 Test the generated pages in a browser against a local copy: serve `tmp/v0-redirects/` under `/chartist-js/` on one port and `dist` on another, with the generator pointed at the local site, and check each scenario of "Old 0.x URLs redirect" (home, an example anchor, an unmapped anchor, an unknown path, scripts off); delete the ad-hoc script afterwards

## 5. Records and gate

- [ ] 5.1 Update "Docs hosting" in `docs/decisions.md`: 0.x lives under `/v0/` without third-party requests, the old GitHub Pages site redirects there and to v2, and a renamed v2 page or heading means running `docs:v0-redirects` and redeploying `gh-pages`; also the 0.x link in the history paragraph
- [ ] 5.2 Run the gate: `pnpm nx run-many -t check test --skip-nx-cache`, `pnpm nx format:check --all` and `pnpm nx e2e docs --skip-nx-cache`; all pass

## 6. Deploy (each push needs the author's go)

- [ ] 6.1 After the change is merged and chartist.dev is deployed, open `https://chartist.dev/v0/`, `/v0/examples.html` and `/v0/getting-started.html#the-sass-way` and check they load with the archive note and working examples
- [ ] 6.2 Run `pnpm nx run docs:v0-redirects`, then in a scratch clone of `gionkunz/chartist-js` on `gh-pages` replace all files with `tmp/v0-redirects/` as one commit (`docs: redirect to chartist.dev`); show the author the diff summary and push only with their go
- [ ] 6.3 After GitHub Pages rebuilds, check the live old URLs against the scenarios of "Old 0.x URLs redirect" (including `https://gionkunz.github.io/chartist-js/examples.html#example-line-modify-drawing` and an unknown path) and report the results
