# Proposal

## Why

`@chartist-js/terminal` is the first package beyond `chartist`, and more will follow under the `@chartist-js` scope (plugins, wrappers). On chartist.dev its guide sits among the core guides, and its API isn't in the reference at all, because the site knows two sections (Docs and API) and one TypeDoc model (`chartist`). Packages need a home of their own with the same kinds of pages, and now is the time: the terminal guide isn't published yet, so it can move without a redirect.

## What Changes

- **A Packages section** on chartist.dev, in the header navigation: `/packages/` lists the `@chartist-js` packages with a line on each and its install command.
- **A subsite per package** at `/packages/<name>/`, with a navigation of its own:
  - an overview page: what the package does, install, a quick start;
  - the package's guides, at `/packages/<name>/<guide>/`;
  - an API reference page generated from the package's types and doc comments, at `/packages/<name>/api/`.
- **The terminal guide moves** from `/docs/terminal-rendering/` into `/packages/terminal/`, before it's published. The core Guides go back to their order without it.
- **Every page kind keeps its extras** in the subsite: a Markdown version, entries in `llms.txt` and `llms-full.txt`, a share card, search results (grouped as Packages), and the e2e and axe checks.
- **The reference check covers packages:** every export of a package appears on its API page, with a doc comment, and links resolve.

No breaking changes vs 1.x: only the docs site changes. No library or package code changes.

## Out of scope

- Package examples galleries. Examples stay as live examples in the guides.
- Versioned package docs; packages are released in lockstep with `chartist`, so the site's version applies.
- Moving the package docs' sources into the packages' folders (`packages/<name>/docs/`); they live with the site for now (see design).
- Community plugins: they stay on `/plugins/`.
- Splitting a package's API into several pages; a package gets one API page until it needs more.

## Capabilities

### New Capabilities

- `package-docs`: the Packages section of the docs site: the package index, each package's subsite (overview, guides, API page, navigation), and how package pages join search, share cards, Markdown versions and `llms.txt`.

### Modified Capabilities

- `docs-site`: the header navigation gets Packages; the API reference requirements cover the packages' API pages; search groups package results; `llms.txt` and `llms-full.txt` include the package pages.

## Impact

- **Docs site (`apps/docs`):** a second content collection for package pages, a package registry, routes under `src/pages/packages/`, a package layout (or the docs layout with a package navigation), a second TypeDoc model per package and an API model that reads more than one, header navigation, search filter, share cards, Markdown and `llms` generation, and the e2e page lists.
- **The `add-terminal-package` change** on this branch: its guide moves here, so its `docs-site` delta (the guide in "Guides and chart type pages") and the tasks that place the guide get updated to point to the package subsite.
- **`docs/decisions.md`:** a line on where package docs live.
