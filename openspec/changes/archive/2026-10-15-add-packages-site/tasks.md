# Tasks

## 1. Registry, content and the move

- [x] 1.1 Add `apps/docs/src/data/packages.ts` (npm name, slug, description, package path; version and install command read from the package's `package.json`) with `@chartist-js/terminal`, and the `packages` content collection in `src/content.config.ts` (`src/content/packages/<slug>/*.mdx`; `title`, `description`, `order`, optional `label`; the slug `api` rejected). Verify: `pnpm nx run docs:check` passes with an empty collection
- [x] 1.2 Move the terminal guide in a commit of its own: `git mv` `src/content/docs/terminal-rendering.mdx` to `src/content/packages/terminal/terminal-rendering.mdx` and `src/examples/terminal-rendering/` to `src/examples/terminal/`. Verify: `git show --stat` lists both as renames
- [x] 1.3 Edit the moved guide (frontmatter, import paths, example id) and write `src/content/packages/terminal/index.mdx`: what the package does, install, a quick start (from the README), links to the guide, the API page and the README. Return Updating charts to order 9 and update `WRITING.md` (page table, a "Package pages" section). Verify: `pnpm nx run docs:check` and `docs:samples` (after 4.4)

## 2. Layout and routes

- [x] 2.1 Generalize the navigation in `src/lib/docs.ts` and `DocsLayout.astro` to a `packages` section: one lookup per section for breadcrumb, menu and aside labels, search filter and Markdown link; package sidebar (Overview, guides in order, API); previous and next within the package; edit links per collection. Verify: the docs and API pages render as before (e2e `site.spec.ts` for docs and API pages)
- [x] 2.2 Add the routes `src/pages/packages/index.astro`, `[pkg]/[...page].astro` and `[pkg]/api.astro`, with their `.md.ts` routes. Verify: the build writes `/packages/`, `/packages/terminal/`, `/packages/terminal/terminal-rendering/`, `/packages/terminal/api/` and their `.md` files
- [x] 2.3 Add "Packages" to the header `NAV` after API, active on all package pages. Verify: e2e test that the header item leads to `/packages/` and is marked current there and on a subsite page; Playwright screenshots of the header at desktop and 375 px in both themes, checked by looking

## 3. Package API pages

- [x] 3.1 Run TypeDoc per registered package in `docs:api` (`api/typedoc.terminal.json`, output `src/generated/api/terminal.json`, inputs including `packages/*/src/**`). Verify: `pnpm nx run docs:api` writes both models
- [x] 3.2 Refactor `src/lib/api.ts` to models per source (entries, locations and links per model; `chartist` external types resolved by name in the core model) without changing the core pages. Verify: the existing `api.test.ts` passes, and the built core API pages are byte-identical to before (diff of `dist/api/`)
- [x] 3.3 Render the package API page with the shared entry rendering. Verify: unit test that every terminal export appears once with a summary, that `LineChartData` in `lineChart`'s signature links to the core reference, and that an export without a doc comment fails the check

## 4. Everywhere pages are listed

- [x] 4.1 Search: `section:Packages` on package pages, shown as a "Packages" group in the dialog. Verify: e2e search for `renderToTerminal` finds it under "Packages" and links to its entry
- [x] 4.2 Share cards for the package index and pages (eyebrow "Packages"). Verify: `meta.spec.ts` covers them through the page list
- [x] 4.3 `llms.txt` "Packages" section and package pages in `llms-full.txt`; Markdown versions. Verify: `llms.spec.ts` counts the package links and fetches one Markdown page
- [x] 4.4 Samples check over `src/content/packages`; e2e page lists (`e2e/pages.ts`) with the package index and pages. Verify: `pnpm nx run docs:samples` covers the terminal guide, and `pnpm nx e2e docs` (axe, console, live examples) covers every package page

## 5. The terminal change and decisions

- [x] 5.1 Update `add-terminal-package`: drop its `docs-site` delta (the guide now lives in the package subsite; its live-example scenario is covered here), and point its proposal, design and tasks to `/packages/terminal/`. Verify: `pnpm exec openspec validate add-terminal-package --strict` and `add-packages-site --strict`
- [x] 5.2 Update `docs/decisions.md` (Maintained packages): package docs on chartist.dev under `/packages/<name>/`, sources in `apps/docs/src/content/packages/` for now, one API page per package. Verify: the section matches the registry and routes

## 6. Integration

- [x] 6.1 Run the docs gate: `pnpm nx run-many -t check test samples lint -p docs --skip-nx-cache`, `pnpm nx e2e docs`, `pnpm nx format:check --all`; Playwright screenshots of `/packages/`, `/packages/terminal/` and its API page in light, dark and at 375 px without horizontal scroll, checked by looking. Verify: all pass

## Workflow follow-up

- The author reviews and says "lgtm" before `/opsx:apply`.
- On "asa": archive `add-terminal-package` first, then this change; sync both changes' specs; update `docs/decisions.md`; amend into the last implementation commit.
