# The 1.x docs

These files are the Chartist 1.5.x documentation (formerly at
`https://chartist.dev/`), the static output of its Docusaurus website. Astro
copies them to `/v1/` of the site as they are.

They are not edited by hand. The 1.x docs won't be updated again, so the
Docusaurus stack isn't kept; if they ever need to change, rebuild them as
below and replace this folder.

## How they were built

Built once on 2026-10-14, from the `v1.5.0` sources (`website/` of
`chartist-js/chartist` at the `v1.5.0` tag, plus the commit after it that
removed the analytics):

1. Copy the 1.x repository to a scratch folder outside this repository.
2. In `website/docusaurus.config.js`: `baseUrl: '/v1/'`, `noIndex: false`, and
   no `editUrl` (there is nothing to edit any more). `url` stays
   `https://chartist.dev`; `trailingSlash` stays `false`, because the
   generated API pages link each other relatively (`../#series`).
3. `pnpm@7 install --frozen-lockfile --ignore-scripts` (the 1.x lockfile is
   pnpm 7's), then `BRANCH=v1.5.0 docusaurus build` in `website/` with Node 22.
   `BRANCH` sets the tree of the CodeSandbox example embeds, so they show the
   1.5.0 sandboxes.
4. Copy `website/build/` here (there are no source maps).

Pages are `.html` files linked without the extension (`/v1/api/basics`), as
Docusaurus writes them with `trailingSlash: false`; the host serves
`page.html` for `/page`, as GitHub Pages does.
