# Tasks

## 1. Search

- [x] 1.1 Pagefind after the build; `data-pagefind-body`, section filters, API entry sub-results, code weights (D1).
- [x] 1.2 The search dialog: header button, Ctrl/Cmd+K, results by section with excerpts, keyboard navigation, focus handling; dev fallback.
- [x] 1.3 e2e: `lineChart` finds its API entry; a guide term finds its guide; keyboard only; no third-party requests; axe with the dialog open.

## 2. Share previews

- [x] 2.1 Card images per page with satori and resvg, in the brand's look (D2).
- [x] 2.2 Head tags, canonical URLs, sitemap, robots.txt.
- [x] 2.3 e2e: every page has its tags, and its image exists.

## 3. Fixes

- [x] 3.1 The 1.x docs: one build with `baseUrl: '/v1/'` from a scratch copy, output in `public/v1/` with a README; out of search, sitemap and link checks (D3).
- [x] 3.2 Version URLs in one place, pointing 1.x to `v1/`; footer API link.
- [x] 3.3 Example previews fill their box (D4); e2e checks a tall preview's chart fills it.
- [x] 3.4 The typing glitch: cause, fix, fast-typing e2e test (D5).

## 4. Language models

- [x] 4.1 Markdown per guide, API page and example (D6), with links made absolute.
- [x] 4.2 `/llms.txt` and `/llms-full.txt`; `rel="alternate"` and "View as Markdown" on the pages.
- [x] 4.3 Unit test: every guide converts without JSX or imports; e2e: every link in `llms.txt` resolves, every page has its Markdown.

## 5. Proof

- [x] 5.1 Screenshot review in both themes (header with search, dialog, a card image, example pages).
- [ ] 5.2 Plan updated; full gate.
