# Design

## Context

- `trendLine()` (`src/layers/trendLine.ts`) and `targetLine()` (`src/layers/targetLine.ts`) are public in `chartist` since 2.0.0. Their only private import is `centerShift` from `src/layers/path.ts` (three lines: half a step on a step axis for `align: 'center'`). Everything else they use is public: `node`, `withFields`, `getMultiValue`, `isDataHoleValue`, `isNumeric`, `alphaNumerate`, `textAscent`, and the `Layer` and `AxisTransform` types.
- `band()` uses the line layer's private path code and the live renderer reads its edges back (`live/keyframes.ts`). It stays.
- The terminal renderer has no case for the two lines' roles: it draws them as `line` and `text` elements. The live renderer has none either.
- `@chartist-js/essentials` already declares a role through `NodeRoles` augmentation (`axisTitle`), ships plain CSS (`src/styles.css`), and has the terminal as a dev dependency.
- The precedent: 2.1.0 moved `renderToString()` to `chartist/server` without a re-export (`docs/decisions.md`, "One exception to additive minors"), as a manual release with a `feat(chartist)!:` commit.

## Goals / Non-Goals

**Goals:**

- One rule for the packages: the core draws the data (lines, areas, bands, bars, slices) with its axes, grid and labels; essentials adds what goes on top (trend and target lines, axis titles, value labels, legends).
- Code that adds `@chartist-js/essentials` and its stylesheet and changes the import draws exactly what it drew before.

**Non-Goals:**

- Moving `band()`, or making the core's path code public.
- Changing what the layers draw, their options, classes or roles.
- A deprecation period: there's no re-export from `chartist`.

## Decisions

### A break in a minor, as for renderToString()

The author decided on 2026-10-20 to accept the break in 2.2.0: 2.0.0 is four days old, last week's ~500 downloads of 2.0.0 and 2.1.0 look like experiments and scanners rather than production use, and the fix is an import and a stylesheet. A deprecated re-export would keep the code in every full build until 3.0, and a 3.0 just for this isn't planned.

- _Alternative, deprecate now and remove in 3.0 (proposed in the discussion):_ no break, but the core carries the code and the uneven structure for the whole 2.x line.

### band() stays

`band()` is a series layer: it draws from series (or constant edges) with the same paths and interpolation as `line()`'s areas, and the live renderer morphs it like them. That puts it with the data. Moving it would make `seriesPath`, `reversePath` and `interpolationOf` public API for one consumer, and the core's live renderer would still know the `band` role. The "Target lines and bands" guide keeps teaching both together; only the import differs.

### Roles move with the layers

`TrendLineContext`, `TargetLineContext` and `TargetLabelContext` and their `NodeRoles` entries move to essentials as an augmentation of `chartist`'s `NodeRoles`, as `axisTitle` does it. Code that imports `@chartist-js/essentials` gets the same types; code that only queries roles by name without importing it gets a type error for those names, which is the honest signal that the layer comes from essentials.

### Styles move as plain CSS, without the Sass settings

The essentials stylesheet is plain CSS. The rules move with the same custom properties and defaults (including the dark mode defaults, through `light-dark()` as in the core), so a page that loads both stylesheets looks the same. The Sass settings `$ct-target-line-*`, `$ct-trend-line-*` and their class name settings go away; Sass users theme the lines through the custom properties, which the theming guide already recommends.

- _Alternative, keep the rules in the core stylesheet:_ the core would style classes it never draws, which is the unevenness this change removes.
- **No Sass in the packages** (the author, 2026-10-20): the official packages ship plain CSS themed with custom properties. The core's Sass build stays only as a legacy some users still rely on, not as a model for new stylesheets.

### Docs follow the packages

The author decided on 2026-10-20 that the docs split like the code: the core's "Target lines and bands" guide becomes "Bands" at `/docs/bands/`, and target and trend lines get a page each in the essentials docs, `/packages/essentials/target-lines/` and `/packages/essentials/trend-lines/`, so each has room for its live examples (the author, 2026-10-20). The guides link each other where they meet (a band chart with a target line). The old URL isn't redirected: the site went live four days ago. The two links the site itself keeps to it, the redirect of the `chartist-plugin-targetline` page (`MOVED_PAGES`) and the 0.x site's target line anchors (`v0-redirects.ts`), point to the essentials guide. The guide file moves in a commit of its own before its edits, so git keeps its history as a rename.

- _Alternative, keep one guide in the core docs (first draft):_ keeps a published URL, but the core docs would teach a package's layers.

### Gallery examples move to the Essentials section

The examples check keeps examples that import essentials in `essentials/`. `composed/target-line`, `composed/trend-line` and `composed/scatter-regression` become `essentials/target-line`, `essentials/trend-line` and `essentials/scatter-regression`; their old gallery pages aren't redirected (the author, 2026-10-20: the site went live four days ago, so links to them are rare). The folder moves are their own commit (with the baseline renames), separate from the import edits, so git sees the renames. `composed/band-chart` stays.

### centerShift is copied

Essentials gets its own `centerShift` (three lines, a private helper) rather than the core exporting it.

### Commits

- `feat(chartist)!: move trendLine() and targetLine() to @chartist-js/essentials`, with a `BREAKING CHANGE:` footer naming the new import and stylesheet, and the measured sizes;
- `feat(essentials): add trendLine() and targetLine()`, which comes first, so every commit builds;
- the example moves, then the docs.

## Risks / Trade-offs

- [Someone on `^2.0.0` updates and the import fails] → it fails at build time or on load with a clear missing-export error; the changelog's breaking section and the release notes give the one-line fix.
- [Sass users who set `$ct-target-line-*` get an error from `@use … with`] → Sass reports the unknown variable; the changelog names the custom properties that replace them.
- [Pages that load only `chartist/styles.css` lose the line styles] → the lines still draw (SVG default stroke), unstyled; the guide and changelog say to load the essentials stylesheet.

## Migration Plan

```ts
// 2.0, 2.1
import { lineChart, trendLine, targetLine } from 'chartist';
// 2.2
import { lineChart } from 'chartist';
import { trendLine, targetLine } from '@chartist-js/essentials';
import '@chartist-js/essentials/styles.css';
```

`band()` keeps its import from `chartist`.
