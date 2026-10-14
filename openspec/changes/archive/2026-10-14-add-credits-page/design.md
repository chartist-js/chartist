## Context

The docs site already has a "pre-scrape": `apps/docs/scripts/facts.ts` (`pnpm nx run docs:facts`) writes `src/data/facts.json`, a dated snapshot that is committed and validated with zod in `src/data/facts.ts`. Builds never fetch. "Used by" shows that this pattern can also bring in avatars: the script downloads them into `src/assets/used-by/`, and `landing/Numbers.astro` loads them with `import.meta.glob`, so pages make no third-party requests.

Cube is thanked in two places today. The footer has "Supported by Cube" (`SiteFooter.astro`). The landing page has a sponsor card, "Cube helped move Chartist to TypeScript…" (`landing/Outro.astro`). The plan says the Cube sponsor placement is an agreed deal.

What GitHub returns (checked 2026-10-14):

- `GET /repos/chartist-js/chartist/contributors` works without a token and returns logins, avatars, `type` (`User`/`Bot`) and commit counts. It only counts the default branch (`main`). Current top: gionkunz 444, dangreen 77, hansmaad 27, renovate[bot] 23, autarc 10, …
- `GET /orgs/chartist-js/public_members` returns `[]`: no member has made their membership public.
- `GET /repos/chartist-js/chartist/collaborators` returns 401 without a token. With a token that has push access, it returns each collaborator with `role_name` (`admin`, `maintain`, `write`, …).

## Goals / Non-Goals

**Goals:**

- A crafted `/credits/` page in the site's design: Cube first, then the people, in one list.
- People and their roles come from GitHub through the facts snapshot and are never typed in. The avatars are served locally.
- Cube's existing mentions lead to the page.

**Non-Goals:**

- Live data at page load, sponsorship tiers, crediting third-party tools, other repositories (see the proposal).

## Decisions

### One list of people, flagged by role

The page doesn't have separate maintainer and contributor sections. It shows one list: the ten contributors with the most commits, and each entry has a flag that shows its role. The flags are:

- **Creator**: the author, `gionkunz`. This is the one role that is copy and not data, kept as a `CREATOR` constant next to the page data. GitHub has no "creator" role, and the owner of the repository is the organization.
- **Core maintainer**: a collaborator with the `admin` role.
- **Maintainer**: a collaborator with the `maintain` role.
- No flag: everyone else.

A person gets one flag; the creator flag wins over the collaborator role. Maintainers with too few commits for the top ten are added after the top ten. That way the list holds everyone in the core team, and it shows the top ten plus at most the remaining maintainers. Collaborators with the `write` role or lower get no flag.

Today this gives: gionkunz (creator) first, then dangreen and the others without a flag. On GitHub, dangreen has the `write` role, and the author keeps it that way for now (2026-10-14), so the page shows no maintainer flags yet; a role change on GitHub shows up with the next facts run. dangreen did the 1.x work Cube supported, so the Cube credit doesn't have to name people.

### Roles come from the collaborators, with a token

The script reads `/repos/{repo}/collaborators?affiliation=all` and maps `role_name` to a flag (`admin` → core maintainer, `maintain` → maintainer), with bots removed.

Alternatives:

- _Org public members_: works without a token, but it is empty today, and it depends on each person making their membership public. Outside collaborators would be missed.
- _A hand-kept list of logins and roles_: simple, but the request was to read the maintainers from GitHub.

Trade-off: the collaborators call needs a token. A personal token needs push access; in CI, the Actions `GITHUB_TOKEN` works too, because GitHub lists the endpoint under the metadata read permission, which every installation token has, so the facts script can run in a workflow that passes `secrets.GITHUB_TOKEN`. Builds still never fetch. Without that token, the script keeps the roles from the existing `facts.json` (`credits.roles`), warns, and still updates the contributors. A run without a token never drops the flags.

### Selection: humans by commits, then the remaining maintainers

The script reads `/contributors?per_page=100` (one page covers a top ten and the core team). It drops `type: "Bot"` and logins ending in `[bot]` and excluded logins, sorts by commits, keeps ten, and appends the flagged people who are not in the top ten, also by commits. It reads `/users/{login}` for names. Anonymous contributors (`anon=1`) are not used here, because they have no profile to link to. They still count in the total, which comes from `github.contributors` as today. The selection is a pure function in `src/lib/facts/parse.ts`, `selectCredits(contributors, { roles, creator, exclude, limit })`, with unit tests, like `selectUsedBy`.

The counts only cover the default branch, so v2 work on `next` shows up once it merges. The page says "commits to main" to stay honest.

### Snapshot shape

```jsonc
"credits": {
  "roles": { "<login>": "core maintainer" | "maintainer" },
  "people": [{ "login", "name", "url", "commits", "role"?, "avatar" }]
}
```

`role` is `creator`, `core maintainer` or `maintainer`, or missing. `roles` is the raw collaborator mapping kept for runs without a token. `avatar` is a file name in `src/assets/credits/` (`<login>.png`, lowercase, 160px from `https://github.com/<login>.png?size=160`). The zod schema requires at least one person, exactly one creator, and an avatar file for each entry. The page checks the files through the glob and throws at build time if one is missing.

### Cube credit is plain copy, not data, and names no one

Cube's credit is written on the page. It is a plain sponsor credit, not a number and not a tribute (decided with the author 2026-10-14). It says, without technical details: "Cube sponsored Chartist's maintenance and the update from 0.x to 1.x. Thank you!" It names Cube only, not people at Cube. The person who did the work is in the list, with his flag. It links to cube.dev in a new tab and shows Cube's logo, from Cube's public brand kit (https://cube.dev/brand) and used as its rules ask: the files unchanged, the light or dark file to match the ground (the card is light and the footer dark in both themes), clear space of the cube mark's width. The footer's "Supported by" line shows the dark logo too, and the landing card's cube.dev link also opens in a new tab. The landing card keeps its text and gets a "Read the credits" link. The footer's "Supported by Cube" line still links to cube.dev, and a "Credits" entry is added to the Community column.

### Page shape

`src/pages/credits.astro` uses `BaseLayout` and has no section in the header nav. It gets a playful header in the 0.x spirit (the mascot in a thankful pose if one exists, or the easel), then two sections: a Cube card on the yellow band, and the people as a grid of cards (avatar, name, role flag as a small label, commits to main). "See all N contributors on GitHub" and a "From GitHub · <date>" note follow, the date from `formatDate(facts.generatedAt)` as in `Numbers.astro`. The page gets the share card and llms handling every page gets, but no Markdown twin, because it isn't documentation.

## Risks / Trade-offs

- [Token needed for the roles] → the previous snapshot's roles are kept, the script warns, and the design records this. Making org membership public would allow a token-free fallback later.
- [Contributor counts ignore `next`] → the page labels the counts as commits to main. They update when v2 merges.
- [People may not want to be listed] → `src/data/credits-exclude.json` (logins) removes people from the list, like `used-by-exclude.json`.
- [Avatars can change] → they refresh whenever the facts script runs. The snapshot date shows how old they are.
- [GitHub roles may not match the team as the author sees it] → the flags follow the roles on GitHub. Changing a role there and rerunning the script fixes the flag.

## Open Questions

_None._ Decided with the author on 2026-10-14: the Cube credit names Cube only, and the author is in the regular list with a "creator" flag, while the others have "core maintainer" or "maintainer" flags.
