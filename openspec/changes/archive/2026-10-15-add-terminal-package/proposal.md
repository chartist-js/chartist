# Proposal

## Why

Chartist's scene is renderer-independent, and a prototype (branch `feat/terminal-renderer`, `packages/terminal`) showed that a terminal renderer can draw line, bar and pie charts from it with Chartist's own layout, labels and colors, in braille dots and block characters. CLI tools have no simple way to show a real chart today, and this makes Chartist useful there; it is also the first package beyond `chartist`, so it sets how maintained packages are named, built and released under the new `@chartist-js` npm scope.

## What Changes

- New published package **`@chartist-js/terminal`** (`packages/terminal`):
  - a renderer from scene to text: ANSI for terminals (24-bit, 256 or 16 colors, or plain text) and HTML (a `<pre>` styled with classes and a shipped stylesheet that reads Chartist's `--ct-*` custom properties, so themes apply);
  - an API for CLI tools: `lineChart`, `barChart` and `pieChart` that take the 1.x data and options plus a size in columns and rows and return a string, a legend helper, color detection, and the low-level `renderToTerminal`, `renderToHtml` and `terminalSize`;
  - the **`ct-cli`** command, the finished version of the prototype's `chartist-term`: series from arguments, files or stdin (JSON, CSV or whitespace-separated), the 1.x chart options as flags, HTML output, help and version;
  - ESM and CommonJS builds with declarations for both, like `chartist`; the API entry runs in browsers too, the CLI needs Node.js.
- **`chartist` shares what renderers need through its public API** instead of each package copying it:
  - preset config builders `lineChartConfig`, `barChartConfig` and `pieChartConfig`: the 1.x data and options to a `ChartConfig`, without a container, so any renderer (and `toScene()` with `renderToString()`) gets the preset charts;
  - the default series colors as data (`seriesColors`), kept equal to `$ct-series-colors`;
  - the text metric SVG text labels are laid out with (`textAscent`), so renderers can place label lines.
- **The `@chartist-js` scope** is where future maintained packages go (plugins, wrappers). Its packages are released in lockstep with `chartist`: same version, same `v{version}` tag, same changelog and GitHub release, published by the same workflow.
- **Docs on chartist.dev:** the package's overview and guide (the CLI, the API and a live HTML example), in the package subsite that `add-packages-site` adds (`/packages/terminal/`).

No breaking changes vs 1.x: `chartist` only gains exports, and its output is unchanged.

## Out of scope

- Interactive or animated terminal charts (redraw on resize, live data, mouse).
- Chart types beyond line, bar and pie/donut, and custom layers beyond drawing their nodes by element.
- East Asian wide characters in labels (each character counts as one cell).
- Image protocols (sixel, kitty graphics); output is text only.
- A browser ESM/CDN build of `@chartist-js/terminal` (ESM and CJS for Node and bundlers only).
- Moving `chartist` itself into the scope, and other `@chartist-js` packages (plugins, web component wrapper); this change only sets the conventions they follow.
- Changes to the release workflow beyond adding packages to the release group.

## Capabilities

### New Capabilities

- `terminal-rendering`: turning a scene into terminal text (ANSI) or HTML: cell geometry, how each role is drawn, colors and color modes, label placement, and the chart functions and helpers for CLI tools.
- `terminal-cli`: the `ct-cli` command: chart types, input formats, options, output, colors and errors.
- `scoped-packages`: packages under the `@chartist-js` scope: naming, the module formats they ship, their dependency on `chartist`, and lockstep releases with it.

### Modified Capabilities

- `chart-rendering`: adds preset config builders that work without a container, and the series colors and text metrics as public data for renderers.

## Impact

- **New:** `packages/terminal` (sources, tests, tsdown build, stylesheet, README), rebuilt from the prototype on `feat/terminal-renderer`.
- **`chartist`:** new exports in `src/presets` and `src/render`/`src/styles`, doc comments, the export list in `test/api/exports/chartist.json`, public API tests, and a check that `seriesColors` matches `_settings.scss`.
- **Release:** `nx.json` release group gains `@chartist-js/terminal`; the changelog renderer keeps `terminal` commits. The release workflow and `release.mjs` stay as they are, since the version is shared. On npmjs.com, the author creates the `@chartist-js/terminal` package's trusted publisher (and the first publish if npm requires it) before the first release.
- **Docs:** the package's pages (in its subsite, see `add-packages-site`) and the playground resolving `@chartist-js/terminal` for their live examples.
- **Decisions:** `docs/decisions.md` records the scope, lockstep releases and sharing through `chartist`'s public API; "Only `chartist` is released" changes.
- **Coordination:** the active `release-v2-rc` change hard-codes `chartist` in its `release-process` spec. This change states the lockstep rule in `scoped-packages`, so either can be archived first; when both are archived, the `release-process` wording should name the release group instead of `chartist` alone.
