# Proposal

## Why

Chartist has been carried by more people than its author. The site has no place that says so. Cube, which sponsored Chartist's maintenance and the update from 0.x to 1.x, has one line in the footer and a small card on the landing page. A credits page gives the people a proper thank-you, from data that stays current, and names the sponsor plainly.

## What Changes

- New page at `/credits/` with two parts:
  - **Cube**, as the sponsor: plainly what Cube sponsored (maintenance and the update from 0.x to 1.x) and a link to cube.dev, without praise beyond that. It names the company, not people. The person who did the work is in the list below.
  - **People**: one list of the ten contributors with the most commits to `chartist-js/chartist`, read from GitHub, without bots, and then any maintainers who aren't in the top ten. Each entry has an avatar, name, commit count and profile link, and a flag for its role: "creator" for the author, "core maintainer" (admin role on GitHub) or "maintainer" (maintain role). A link at the end goes to the full contributors list on GitHub and gives the total from the facts snapshot.
- The facts script (`pnpm nx run docs:facts`) also writes the people and their roles into the committed, dated snapshot. It downloads their avatars into the site's assets, so the page makes no third-party requests and builds never fetch.
- Cube's logo, unchanged from Cube's brand kit (https://cube.dev/brand), on the credits card and in the footer's "Supported by" line, and Cube's links open in a new tab (asked by the author 2026-10-14).
- The footer's "Supported by Cube" line and the landing page's sponsor card stay as they are. The sponsor card gets a link to the credits page, and the footer's Community column gets a "Credits" link.
- `docs/v2-high-level-plan.md` no longer says "no credits page needed". It records the page and the decisions made here.

## Capabilities

### New Capabilities

_None._ The page is part of the docs site and fits next to its "Landing page", "Sourced facts" and "Used by" requirements.

### Modified Capabilities

- `docs-site`: adds requirements for the credits page (where it is and how to reach it), the Cube credit, the people with role flags, their source (the GitHub snapshot with local avatars, and a build that fails when they are missing), and keeping the roles when the script runs without access.

## Out of scope

- Sponsorship tiers, GitHub Sponsors or Open Collective listings, and donation buttons.
- Crediting third-party libraries, fonts or tools the site uses.
- Contributors to other repositories than `chartist-js/chartist` (the plugins, the 0.x site), and commits that GitHub doesn't count for the default branch (work on `next` before it merges).
- Changing the Cube copy on the landing page and in the footer, beyond adding the links.

## Breaking changes vs 1.x

None. This only changes the docs site. The 1.x site had no credits page.

## Impact

- `apps/docs/scripts/facts.ts` and `src/lib/facts/parse.ts` (+ tests): collaborators and contributors are fetched and selected. The role flags need a `GITHUB_TOKEN` with push access to the repository.
- `apps/docs/src/data/facts.json` and `facts.ts` (schema), plus new avatars in `src/assets/credits/`.
- New `apps/docs/src/pages/credits.astro`. `SiteFooter.astro` and `landing/Outro.astro` get links.
- e2e: the page list (`e2e/pages.ts`) and a credits test. The page joins the shots of the local visual check (`docs:visual`), which has no committed baseline.
- `docs/v2-high-level-plan.md`.
