## 1. Registry and previews

- [x] 1.1 Add `license` (the tagged `free` / `commercial` type from the design, the free license name read from `package.json`) to `DocumentedPackage` in `apps/docs/src/data/packages.ts`, and set them for `@chartist-js/terminal`. Verify: `pnpm nx run docs:check` passes, and a commercial entry without `href` fails to type-check (tried locally, not committed)
- [x] 1.2 Add `src/lib/package-previews.ts`, which renders a package's preview as HTML at build time (for terminal: `lineChart(data, { format: 'html', low: 0, showArea: true, lineSmooth: true, columns, rows })` with the data of the terminal overview's example), keyed by package slug, plus `src/lib/package-previews.test.ts`. Verify: the unit test checks that every registered package has a preview, that the terminal preview is a `pre.ct-terminal` with series classes, and `pnpm nx test docs --skip-nx-cache` runs it
- [x] 1.3 Add `components/TerminalWindow.astro` (title bar with three dots and a title, dark screen, the custom properties for labels and grid), styled after the text-art example's CSS, and load `@chartist-js/terminal/styles.css` where it's used. Verify: it renders in tasks 2 and 3 and looks like the frame on `/packages/terminal/` in the screenshots of task 5

## 2. Package index

- [x] 2.1 Rewrite `src/pages/packages/index.astro` as the card grid from the design: preview in the terminal frame, name with the version tag, license tag, sentence, install command (with the prerelease rule) or "Get a license" link, and links to the overview, each guide (from the package's content collection) and the API page. Verify: `dist/packages/index.html` contains the text art, the version, the license name, the install command and the links, by reading the built file
- [x] 2.2 Rewrite the intro: packages are made by Chartist's author, free and paid; community plugins are on Plugins (with the link). Follow `apps/docs/WRITING.md`. Verify: the text is in `dist/packages/index.html` and the link resolves to `/plugins/`
- [x] 2.3 Check the commercial card with a temporary second registry entry (`kind: 'commercial'`, a placeholder link), take screenshots, then remove the entry. Verify: the screenshots show the terms and the "Get a license" link without an install command, and `git diff` shows no leftover entry
- [x] 2.4 Extend the Packages test in `e2e/site.spec.ts` to the card: the terminal card shows the text art and links to its overview and API page. Verify: `pnpm nx e2e docs --skip-nx-cache` passes

## 3. Landing page: news and packages

- [x] 3.1 Move `src/data/release.ts` to `src/data/news.ts` (a file move in its own commit), then make it `NEWS`, newest first, with the terminal entry and the 2.0 entry from the design, and a `latestNews()` helper that returns at most three, with a unit test. Verify: the unit test covers fewer than, exactly and more than three entries
- [x] 3.2 Replace `ReleaseBanner.astro` with `News.astro`: an `aside` labelled "News" with a list of rows in today's banner style, `data-visual="news"`; update `src/pages/index.astro`. Verify: `dist/index.html` has both rows with their links, by reading the built file
- [x] 3.3 Add `components/landing/Packages.astro` after `Extend`: heading and sentence, the SVG chart (`Chart.astro`) next to the same chart as text art in `TerminalWindow`, the `ct-cli` one-liner, the package row from the registry with license tags, and a link to `/packages/`; add `{ id: 'packages', label: 'Packages' }` after `extend` to `SECTIONS` in `src/data/landing.ts`. Verify: `dist/index.html` contains the section, the text art and the package row, and the chapter link
- [x] 3.4 Make `e2e/landing.spec.ts` import `SECTIONS` from `src/data/landing.ts` instead of its own list, and check that the packages section's SVG chart draws and the chapter is marked when scrolled to. Verify: `pnpm nx e2e docs --skip-nx-cache` passes
- [x] 3.5 Check that the `ct-cli` one-liner shown on the landing page runs. Verify: run it with the built package (`node packages/terminal/dist/cli.js line …`) and see a chart

## 4. Specs and records

- [x] 4.1 Keep `apps/docs/src/lib/markdown.ts` (`llms.txt`) in line if it describes the packages index or the landing; nothing else reads the moved release data. Verify: `pnpm nx e2e docs` (llms spec) passes, and `grep -rn "data/release" apps/docs` finds nothing

## 5. Verification

- [x] 5.1 Take screenshots of the landing's news and packages section and of `/packages/` in light and dark mode and at 390 px; check that nothing scrolls horizontally and the text art isn't cut in an ugly place. Verify: screenshots looked at, `scrollWidth` equals the viewport width
- [x] 5.2 Run the gate: `pnpm nx run-many -t check lint test -p docs --skip-nx-cache`, `pnpm nx e2e docs --skip-nx-cache` (with axe) and `pnpm nx format:check --all`. Verify: all pass
- [x] 5.3 Compare the built site with `e2e/visual.mjs`: take a baseline from `main` before the change, then compare after it. Verify: the report shows changes only in the news block, the new packages section and the blocks below it that move, and the Getting started, credits, plugins and 404 pages are unchanged
