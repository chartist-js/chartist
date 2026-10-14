# Tasks

## 1. Credits in the facts snapshot

- [ ] 1.1 Add `selectCredits(contributors, { roles, creator, exclude, limit })` to `apps/docs/src/lib/facts/parse.ts`, with unit tests in `parse.test.ts`: bots (`type: "Bot"`, `[bot]` logins) and excluded logins are dropped, the top `limit` are sorted by commits, flagged people outside the top are appended by commits, `admin` maps to "core maintainer" and `maintain` to "maintainer", `write` gets no flag, and the creator gets "creator" whatever their collaborator role. Verify: `pnpm nx test docs`
- [ ] 1.2 Add `src/data/credits-exclude.json` (an empty array) and a `CREATOR = 'gionkunz'` constant beside the credits data. Verify: unit tests covering an excluded login and the creator flag
- [ ] 1.3 Extend `scripts/facts.ts`: read the collaborators (token required; on 401/403, keep `credits.roles` from the existing `facts.json` and warn), the contributors (`per_page=100`) and `/users/{login}` for names. Write `credits.roles` and `credits.people` into the snapshot and download the avatars (160px) into `src/assets/credits/<login>.png`. Update the header comment. Verify: `GITHUB_TOKEN=… pnpm nx run docs:facts` writes the roles and at least ten people, and running it without a token keeps the roles and prints the warning
- [ ] 1.4 Extend the zod schema in `src/data/facts.ts` with `credits` (at least one person, exactly one creator, roles from the three flags, URLs, positive commit counts). Verify: `pnpm nx check docs` passes, and fails when `credits` is removed from `facts.json`
- [ ] 1.5 Run the facts script with the author's token and commit the refreshed `facts.json` and the avatars (author runs it; the script needs push access). Verify: the diff shows only the `credits` data, the date and the expected count changes, and dangreen carries his collaborator flag

## 2. Credits page

- [ ] 2.1 Create `src/pages/credits.astro` on `BaseLayout`: a playful header (mascot), the Cube credit card first (0.x to 1.x move, maintenance support, cube.dev link, wordmark without a logo, no people named), then the people grid (avatar, name or login, role flag as a small label, commits to main, profile link), "See all N contributors on GitHub" and "From GitHub · <date>". Avatars load through `import.meta.glob` from `src/assets/credits/`, and the page throws at build time if a file is missing. Verify: `pnpm nx build docs` builds `/credits/index.html` without third-party URLs for images
- [ ] 2.2 Check both themes and phone width on the dev server (port 4322): no horizontal scroll, readable cards and flags, visible focus states. Verify: manual check in the browser at 375px and desktop, in light and dark
- [ ] 2.3 Add a "Credits" link to the footer's Community column (`SiteFooter.astro`) and a "Read the credits" link to the landing sponsor card (`landing/Outro.astro`), leaving their Cube copy unchanged. Verify: both links resolve to `/credits/` in the built site

## 3. Tests and baselines

- [ ] 3.1 Add `{ name: 'credits', path: '/credits/' }` to `e2e/pages.ts`, so the shared site checks (accessibility, meta, no third-party requests) cover it. Verify: `pnpm nx e2e docs`
- [ ] 3.2 Add an e2e test for the credits page: the first credit is Cube's and links to `https://cube.dev`, the list starts with the top ten without bots, the author carries the "creator" flag, and the footer's "Credits" link opens the page. Verify: `pnpm nx e2e docs`
- [ ] 3.3 Add the credits page to the visual shots in `e2e/visual.mjs`. The author records the baseline on the WSL host, never in the container. Verify: `pnpm nx visual docs` on the host passes after `--update --only credits`

## 4. Plan

- [ ] 4.1 Update `docs/v2-high-level-plan.md`: replace "No credits page needed" with the credits page and its decisions (one list of the top ten plus remaining maintainers, flagged creator / core maintainer / maintainer from the GitHub roles, read with a token; Cube credit first, naming the company only), and mark the Cube sponsor placement item as carried over. Verify: the plan no longer says no credits page is needed

## Workflow follow-up

- Archive the change, sync the `docs-site` spec, amend the commit.
