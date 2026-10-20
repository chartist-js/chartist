## Why

`trendLine()` and `targetLine()` went into the core in 2.0, before `@chartist-js/essentials` existed. Since 2026-10-19 the rule is that new layers go to essentials and the core keeps what it shipped in 2.0. That leaves the structure uneven: a target line is in the core, a value label or an axis title next to it in essentials. The author decided on 2026-10-20 to move the two lines to essentials in 2.2.0, as a breaking change in a minor, like the move of `renderToString()` to `chartist/server` in 2.1.0: 2.0.0 is four days old, last week's 2.0.0 and 2.1.0 downloads (about 500) look like experiments and scanners rather than users, and the fix is one import path. The cleaner rule outlasts the cost: the core draws the data, essentials adds what you put on top of it.

`band()` stays in the core. It draws from series data like `line()`'s areas, shares their path code (`seriesPath`, `reversePath`, `interpolationOf`, which aren't public) and has its own handling in the live renderer (`live/keyframes.ts`, which morphs a band's two edges). Moving it would mean making that path code public and leaving the `band` role in the core anyway.

## What Changes

- **BREAKING: `trendLine()` and `targetLine()` move from `chartist` to `@chartist-js/essentials`,** with their option types (`TrendLineOptions`, `TargetLineOptions`) and context types (`TrendLineContext`, `TargetLineContext`, `TargetLabelContext`). `chartist` no longer exports them; there's no deprecated re-export, which would keep the code in the core until 3.0. Behavior, options, classes, roles and output are unchanged, the log axis transform and the trend line's `correlation` included.
- **BREAKING: their styles move to the essentials stylesheet.** `.ct-target-line`, `.ct-target-label` and `.ct-trend-line` and their custom properties (`--ct-target-line-color`, `--ct-target-line-width`, `--ct-target-line-dasharray`, `--ct-trend-line-width`, `--ct-trend-line-dasharray`) leave `chartist/styles.css` for `@chartist-js/essentials/styles.css`, with the same names and defaults. The Sass settings `$ct-target-line-*` and `$ct-trend-line-*` and the `$ct-class-target-*` and `$ct-class-trend-line` names go away: the essentials stylesheet is plain CSS, themed with the custom properties.
- **The roles `trendLine`, `targetLine` and `targetLabel`** are declared by `@chartist-js/essentials` through `NodeRoles` augmentation, as `axisTitle` is. Code that imports essentials sees them as before; `@chartist-js/tooltips`' role narrowing keeps working for them.
- **`band()` stays in `chartist`**, with its styles, the `band` role and `mark`.
- **The core keeps what any layer uses:** `AxisTransform`, `ExtentContext.transforms`, `minorTicks`, `inset()`. Doc comments that named `trendLine` as the example of a transform's use keep naming it, from essentials.
- **Docs:** the core's "Target lines and bands" guide becomes "Bands" at `/docs/bands/`. Target and trend lines get a page each in the essentials docs, "Target lines" at `/packages/essentials/target-lines/` and "Trend lines" at `/packages/essentials/trend-lines/`, with room for live examples (the trend line had none), listed on the essentials overview; the pages and the bands guide link each other. The home page's news row for essentials names some of its layers. The old URL isn't redirected (the site went live four days ago); the redirect of the `chartist-plugin-targetline` page and the 0.x site's target line anchors point to the new essentials guide. Every doc comment, sample and guide that imports them from `chartist` (line, bar and composed chart guides, the terminal and tooltips docs, the log axis guide) imports from essentials.
- **Gallery examples:** `composed/target-line`, `composed/trend-line` and `composed/scatter-regression` move to the "Essentials" section (`essentials/target-line`, `essentials/trend-line`, `essentials/scatter-regression`), since the examples check keeps essentials examples there. Their old gallery pages aren't redirected: the site went live four days ago. Their visual baselines are renamed, not re-recorded.
- **Tests:** the layers' unit tests move with them; core tests that used them (`phases.spec.ts`, `lineChart.spec.ts`, `keyframes.spec.ts`) use a layer of their own or `band()`. The API recordings drop the exports from `chartist` and add them to essentials; the 1.5.0 API test is unaffected, since 1.x had neither.
- **Size:** the full browser builds of `chartist` lose about 1.1 kB gzipped (measured: the two layers add 1,146 B to a bundle of `lineChart` and `barChart`), and the core stylesheet loses their rules. The budgets go down to the new sizes.

## Capabilities

### New Capabilities

- `reference-lines`: the `trendLine()` and `targetLine()` layers in `@chartist-js/essentials`: what they draw, their roles and contexts, trend lines on transformed axes, their styles in the essentials stylesheet, and where they're documented.

### Modified Capabilities

- `chart-composition`: the target line, trend line and trend-on-transformed-axes requirements move to `reference-lines`.
- `chart-theming`: the target line and trend line styles leave the default stylesheet; the band styles stay.
- `scene-graph`: the `targetLine` and `targetLabel` roles leave the core's built-in roles; the `band` role stays.
- `log-axis`: the layer list points to `reference-lines` for trend lines.
- `docs-site`: the guide list has "Bands" instead of "Target lines and bands", and the target line plugin's redirect leads to the essentials guide.

## Impact

- `packages/chartist`: `src/layers/trendLine.ts`, `targetLine.ts` and their specs leave; `src/layers/index.ts`, `src/scene/roles.ts` (`TrendLineContext`, `TargetLineContext`, `TargetLabelContext`, their `NodeRoles` entries), `src/scene/index.ts`, `src/styles/index.scss` and `_settings.scss`, doc comments that import them (`presets/preset.ts`, `scales/axis.ts`), the tests that used them, `test/api/exports/`, `.size-limit.json`.
- `packages/essentials`: `src/trendLine.ts`, `src/targetLine.ts` (with a private copy of the core's three-line `centerShift`), their specs, the role augmentation, `src/styles.css`, the entry, `test/exports.json`, README, size budgets.
- `packages/tooltips`: tests and doc comments import the lines from essentials (a dev dependency).
- `packages/terminal`: tests import the target line from essentials (already a dev dependency); the renderer draws the lines by their element, unchanged.
- `packages/examples` and `packages/visual`: three examples move to `essentials/`, their baselines are renamed.
- `apps/docs`: `docs/target-lines-and-bands.mdx` becomes `docs/bands.mdx` (a move, then edits) and the target and trend line sections become `packages/essentials/target-lines.mdx` and `trend-lines.mdx`, with their examples; the docs navigation; the guides and samples above; the essentials overview; `integrations/redirects.mjs` (`MOVED_PAGES` for the target line plugin) and `src/lib/v0-redirects.ts` with their tests; the API pages.
- **Release:** a manual `2.2.0` release with the move in the changelog's breaking section; the commits that remove the exports are `feat(chartist)!:` with a `BREAKING CHANGE:` footer naming the new import.
