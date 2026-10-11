# Chartist v2: Scoping Research

> Input for defining the v2 scope. Source: every issue and PR in `chartist-js/chartist` (1,123 issues, 319 PRs, Mar 2014 – Sep 2026; it includes the 0.x history because the repo was transferred), plus the 13 issues in the `gionkunz/chartist-js` backup. Ranking score = 2 × 👍 + other reactions + comments. Snapshot taken 2026-10-12.

## Repo at a glance

- ⭐ 13,390 stars · 2,464 forks · 325 watchers
- 204 open issues, 28 open community PRs (excluding bots)
- The 1.x era (since mid-2022) has few issues. Most of them are **regressions caused by the 1.x stack** (distribution, styles, docs), not feature requests.

## Themes

### A. Distribution and "no bundler" (1.x regressions). Highest priority

1.x broke the "drop a script tag and go" experience that made Chartist popular.

| Issue     | Score | Summary                                                                    |
| --------- | ----- | -------------------------------------------------------------------------- |
| #1399     | 4     | Please provide a standalone HTML/CSS/JS example of 1.0+ (no npm, no build) |
| #1388     | 3     | Precompiled releases again, like before                                    |
| #1404     | 4     | Pulling from a CDN gives the latest 0.x version                            |
| #1361     | 1     | Provide a `dist` folder at the repo root                                   |
| #1344     | 11    | `bower install` no longer works                                            |
| #1355     | 12    | Sass styling no longer available                                           |
| #1368     | 9     | Can't import `index.css`                                                   |
| #1409     | –     | `src/styles/index.scss` not found                                          |
| backup #4 | –     | `chartist.min.js` missing from npm since 1.0                               |

**→ v2:** Ship ESM (with a browser-ready build for `<script type="module">`), UMD (`chartist.umd.min.js`) and CJS. Publish CSS and Sass sources, define a clean `exports` map, keep CDN URLs stable (jsDelivr/unpkg), and document the copy-paste HTML example first.

### B. Theming and styling

| Issue           | Score | Summary                                                                   |
| --------------- | ----- | ------------------------------------------------------------------------- |
| #1463           | –     | Grid/label defaults unreadable in dark mode (hard-coded `rgba(0,0,0,.4)`) |
| #79, #256, #745 | 19/14 | More series colors (only 15 built in) / a "spread out" color scheme       |
| #940            | 12    | Explicitly set class names for series                                     |
| #387            | 12    | SVG gradients on chart elements                                           |
| #1430 (PR)      | –     | Fix CSP violations (inline styles)                                        |
| #1461 (PR)      | –     | CSS enhancements                                                          |

**→ v2:** Theme with CSS custom properties: series colors, grid, labels and stroke widths, with light and dark mode built in, an unlimited or cycling series palette, CSP-safe output (no inline `style` attributes), and gradients and patterns as documented recipes. This is also where the new brand palette (Claude Design) becomes the default theme.

### C. Chart types and composition

| Issue              | Score   | Summary                                                                          |
| ------------------ | ------- | -------------------------------------------------------------------------------- |
| **#37**            | **152** | **Compound charts: combine different types (line + bar) — #1 issue of all time** |
| #262               | 31      | Stacked and grouped bars                                                         |
| #390               | 31      | Radar/spider chart (open PR #1453)                                               |
| #660               | 29      | Candlestick chart                                                                |
| #1058, #1405       | 21/7    | Dual Y axis                                                                      |
| #64                | 34      | Logarithmic scale                                                                |
| #116               | 69      | Time intervals (proper time axis)                                                |
| #1260, #1146 (PRs) | –       | Stack chart                                                                      |

**→ v2:** The top requests are all variations of one capability: **composable charts on shared axes**, with several series renderers (line, area, bar, scatter) per chart and several axes. Designing the v2 core around that also covers dual Y, mixed charts, and stacked plus grouped bars. Log and time axes then become additional axis types.

### D. Data updates and animation

| Issue              | Score | Summary                                                      |
| ------------------ | ----- | ------------------------------------------------------------ |
| #3                 | 42    | Rebuild the core to handle progressive/realtime data updates |
| #838               | 10    | Dynamic data updates                                         |
| #688               | 9     | Stacked bar animations                                       |
| #1243, #1129 (PRs) | –     | Pass `responsiveOptions` to `update()`                       |

**→ v2:** Change-aware updates that let you animate between old and new data. Animation driven by CSS where possible, plus a small JS animation API to replace the 0.x SMIL animation API.

### E. Axes and labels

| Issue                 | Score | Summary                                       |
| --------------------- | ----- | --------------------------------------------- |
| #921, #395, #406 (PR) | 22/10 | Missing final grid line / last tick           |
| #54, #1455            | 23    | X labels not centered                         |
| #224, #546            | 18/15 | Overlapping and multi-line pie labels         |
| #849, #576            | 24/9  | Many data points: automatic label skipping    |
| #712, #237            | 9/9   | Rotated labels                                |
| #77                   | 33    | Decimals in axis values                       |
| #1443                 | –     | Expose `chartRect` to `labelInterpolationFnc` |
| #842                  | 25    | Pie chart: numeric padding crashes            |

**→ v2:** A layout engine for labels: collision avoidance, auto skipping, rotation, centering, and number and date formatting through `Intl`.

### F. Official plugins and the extension API

| Issue            | Score    | Summary                      |
| ---------------- | -------- | ---------------------------- |
| #1410            | 9        | Legends                      |
| #27              | 15       | Axis titles                  |
| #235, #322, #976 | 16/19/12 | Target lines, bands, regions |
| #230, #1048 (PR) | 9        | Crosshair                    |
| #290             | 15       | Plugin ideas                 |
| #2               | 17       | Accessibility and ARIA       |

In 0.x these were community plugins (tooltip, axis title, point labels, threshold, target line, zoom, fill donut, accessibility; see `tmp/chartist-v0/site/data/pages/plugins.yml`). Most of them don't work with 1.x, and the README says "Plugins: coming soon".

**→ v2:** A typed plugin API, plus an **official plugin set in the monorepo** (`packages/plugin-*`): legend, tooltip, axis titles, annotations (lines, bands, regions), point labels, crosshair, accessibility.

### G. Runtime environments

| Issue               | Score    | Summary                                                  |
| ------------------- | -------- | -------------------------------------------------------- |
| #87, #1424          | 20       | Server-side rendering / render in Node (JSDOM or string) |
| #1017, #1189, #1180 | 14/14/21 | `window is not defined` in Node, Angular, SSR frameworks |
| #287, #119          | 13/15    | Charts in hidden or detached nodes (tabs)                |
| #118                | 12       | Print cut-off                                            |
| #696, #157, #1378   | 20/13/3  | Export as image / SVG                                    |
| #734                | 35       | React Native (likely out of scope)                       |

**→ v2:** No global `window`/`document` access (use `ownerDocument`), a `ResizeObserver` instead of window resize events, a **render-to-SVG-string** path for SSR and export, and print styles.

### H. Documentation and DX

| Issue        | Score | Summary                                                                 |
| ------------ | ----- | ----------------------------------------------------------------------- |
| #409         | 106   | "Worst API ever": no discoverable list of options, no use-case examples |
| #90          | 40    | Document events                                                         |
| #733         | 13    | Most-wanted examples on the examples page                               |
| #1399        | 4     | Standalone examples                                                     |
| #1398, #1411 | –     | Broken website/homepage links                                           |

**→ v2:** Option reference pages generated from the TypeScript types, an event reference, recipe-style examples ("how do I hide the Y axis?"), and live playgrounds everywhere. This lines up with the docs redesign.

### I. Framework integration (inferred)

0.x had a whole ecosystem of wrappers (React, Angular, Vue, Ember, …), and most of them are unmaintained. Options: an official web component (`<chartist-chart>`), which works in every framework, and/or thin official wrappers.

## Proposed scope tiers (recommendation, for discussion)

**v2.0: foundation and regressions**

- Distribution (A), CSS custom-property theming with dark mode (B), SSR-safe runtime and render-to-string (G)
- **Composable core:** multiple series types and axes per chart (C, #37). This is the architectural bet, and it's much cheaper to make now than later.
- Label layout fixes (E), better `update()` (D)
- Official plugins: legend, tooltip, axis titles, annotations, accessibility (F)
- Docs: generated option and event reference, recipes, playground (H)
- Migration guide from 1.x with codemods where practical

**v2.x: chart types and extras**

- Stacked + grouped bars, log axis, time axis (once the composable core exists, these are mostly axis and renderer additions)
- Radar (review community PR #1453), candlestick
- Image export, animated transitions on update, web component

**Out of scope (proposal)**

- React Native, canvas rendering, heavy interactivity frameworks (zoom/pan beyond a plugin)

## Housekeeping

- 28 open community PRs, mostly 2015–2020 and against 0.x code. Close them with a thank-you plus a link to the v2 tracking issue, and cherry-pick the ideas into specs: #726, #406, #623, #736, #1453, #1430, #1243.
- Close stale questions and spam (#1458, #1459, #1469–#1471).
- Create a `v2` milestone and labels; open a pinned "Chartist v2 is coming" discussion so followers know the project is alive.

## Author decisions (2026-10-12)

The answers to the open questions are recorded in `docs/v2-high-level-plan.md` → "Product and architecture decisions". In short:

1. Vision: SVG virtual DOM + interchangeable renderers, an event-based extension system, composable charts and multi-axis, container-query responsiveness.
2. Zero breaking changes; a compat plugin covers 1.x behavior and legacy plugins.
3. Web components only, as a separate wrapper package.
4. Official plugins: only the author's own (accessibility, point labels, threshold; sketchy and tooltip to be confirmed). Others through compat.
5. As small as possible: stay the smallest charting library.
