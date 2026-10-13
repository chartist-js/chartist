# Proposal

## Why

The landing page is Chartist's marketing instrument (author decision 2026-10-13). It should be immersive, show instead of tell, and convince a developer within a minute. The prototype in the design canvas (`docs/visual-design`: `Landing`, `LandingStory`, `ComparisonTable`, `ScrollStage`, snapshot `1791919724-153a`) is ready. `add-docs-site` left a minimal hero in its place.

## What Changes

The full landing page, built from the prototype with real charts and real facts.

### Sections

- **Chapter navigation:** sticky, with a scroll progress bar on a CSS scroll timeline.
- **Hero:**
  - the mascot presenting a live chart;
  - install tabs (npm and `<script type="module">`) and calls to action;
  - the npm and GitHub numbers.
- **Release banner:** the only version-specific line on the page; its content comes from site data.
- **Numbers band:** monthly npm downloads, dependents, GitHub stars, years since 2014, and a **"Used by"** row (see below).
- **Scroll story:** a sticky easel stage. The mascot's board shows a real line, bar, donut and composed chart in turn as the chapters scroll past, each drawing in, and he reacts. Every chapter has a "Show it on the easel" button and a code sample.
- **Features**, each with a live mini demo:
  - CSS custom properties (a swatch picker sets `--ct-series-a`);
  - media and container responsiveness;
  - composed charts;
  - SVG labels and server rendering;
  - tree-shaken sizes (measured);
  - the accessible palette;
  - a closing list: typed functional API, zero dependencies, 1.x code keeps working.
- **Bend it to your will:**
  - the real pipeline phases (resolve, prepare, layout, compose, scene, render, mount) with their hooks;
  - a demo with three small v2 plugins (lollipop bars, value labels, a threshold color), toggled on one bar chart and built on `compose` events.
- **Gallery:** six real charts that draw in as they scroll into view.
- **Edit it, watch it redraw:** a reusable **`LiveExample`** island, an inline editor on `@chartist/playground` that re-renders as you type. Getting started gets one too. The gallery's playground links and the full-screen playground stay in `add-docs-examples`.
- **Responsive:**
  - a resizable container (with a keyboard range input) whose `container()` conditions switch the label format;
  - one chart in a narrow and a wide card;
  - marked experimental, using the `match-container` polyfill bundled with the site.
- **Animations:** line draw-in, bars growing, donut sweep (CSS) and a SMIL morph, each with a static alternative under reduced motion.
- **Comparison** with Chart.js, ApexCharts and Highcharts (see below).
- **Ecosystem:** framework wrappers, listed only with verified v2 compatibility notes.
- **Community and sponsor:** contributor count, links, the Cube slot.
- **Finale:** the mascot celebrating.

### Facts come from sources, never typed in

- **A committed, dated snapshot.** `pnpm nx run docs:facts` fetches the npm and GitHub numbers and writes a dated `src/data/facts.json`, which is committed (author decision). Builds stay offline and reproducible; the snapshot is refreshed before each release, and the page shows its date.
- **"Used by"** (author decision): the snapshot also mirrors GitHub's dependents list for `chartist-js/chartist`, filtered to organization accounts with notable repositories, minus a manual exclude list. Each entry shows the organization's name and GitHub avatar and links to the public repository that depends on Chartist. The term "Used by" is GitHub's own, so the page relays a verifiable fact rather than claiming an endorsement.
- **Comparison values:**
  - bundle sizes (a line chart with each library's recommended import, minified and gzipped with the same bundler settings) are measured by the same script at pinned versions;
  - feature and license rows come from each library's documentation, with a source link per cell;
  - the table shows "Measured on <date>" and a "How we measured" note.

### Copy matches the real API

The prototype's samples are corrected:

- `chart()` with `bar`, `line` and `cartesianAxes([...])`;
- v2 plugins on `compose` events;
- `toScene(config, size)` + `renderToString` for server rendering, shown with `chart()` configs;
- the license as "MIT or WTFPL".

## Out of scope

- The examples gallery page, the full-screen playground, the API reference, search and OG cards (later changes).
- Logos with company permission; "Used by" relies on GitHub's public data only.
- Fetching facts at build time.

## Breaking changes vs 1.x

None. Site only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `docs-site`: the landing page, sourced facts and "Used by", the comparison, the inline live editor, motion with reduced-motion alternatives.

## Impact

- `apps/docs`:
  - new components (`ChapterNav`, `ScrollStage`, `FeatureCard`s, `PluginDemo`, `LiveExample`, `ResizeDemo`, `ComparisonTable`, `UsedBy`);
  - more mascot poses (`celebrate`) and board scenes;
  - `src/data/` (facts, comparison, ecosystem, release banner);
  - `scripts/facts.ts` and the `facts` target;
  - e2e tests.
- Dev dependencies of `docs`: `@chartist/playground` (workspace), `match-container` (bundled, MIT), and Chart.js, ApexCharts and Highcharts plus the bundler, for measuring only (never shipped).
