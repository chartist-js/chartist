# Design

## Context

- **The prototype:** `docs/visual-design/project/Landing.dc.html` (scroll story), `LandingStory.dc.html` (storyboard with timings), `ScrollStage.dc.html`, `ComparisonTable.dc.html`, and `chartist.css` (landing styles: `.chapter-nav`, `.scroll-progress`, `.story*`, `.feature`, `.resizable`, `.cq`, `.compare`, `.stat`, `.pipeline`, `.reveal`, scroll/view timelines). Its mock `Chart` component is replaced by real charts.
- **From `add-docs-site`:** `Chart` (lazy, reserved box), `Mascot` (hero, point, lost), the draw-in plugin, tokens and components.
- **`@chartist/playground`:** `createPlayground()`, `compile()` (sucrase type stripping, import map to the workspace build), CodeMirror lazy-loaded.

## Decisions

### D1: Sections as components, data in `src/data/`

Each section is an Astro component in `src/components/landing/`; copy and lists live in typed data modules:

- `story.ts`, `features.ts`, `pipeline.ts`, `gallery.ts`, `ecosystem.ts`, `release.ts`;
- `facts.json` and `comparison.ts`.

The page composes them. Interactive parts are small scripts (vanilla TypeScript, no framework).

### D2: The story stage

- **Layout:** `ScrollStage` is sticky (CSS) and holds the hero-pose mascot. Its board renders one of five scenes: the hero line chart, bars, donut, composed (bar + line, two axes), and the v2 sign for the finale.
- **Switching:** an IntersectionObserver on the chapters sets the active scene. The scene's chart is created once with the functional API and reused, and it draws in when it becomes active.
- **Reactions:** the mascot changes pose per scene (curious, proud), with CSS transitions.
- **Without scrolling:** the dots and "Show it on the easel" buttons switch scenes for keyboard and pointer users.
- **Reduced motion:** scenes switch instantly with no draw-in.

### D3: Scroll-driven motion

- **Mechanism:** `.reveal`, chart draw-in on view, and the progress bar use `animation-timeline: view()` / `scroll()` inside `@supports` and `prefers-reduced-motion: no-preference`, as in the prototype.
- **Fallback:** browsers without scroll timelines show everything static (no JS fallback needed).
- **Chapter nav:** the current section is marked by an IntersectionObserver (`aria-current`).

### D4: Facts snapshot

`apps/docs/scripts/facts.ts` (target `docs:facts`, not part of `build`) writes `src/data/facts.json`:

```ts
{
  generatedAt, npm: { monthlyDownloads }, github: { stars, contributors, dependents },
  usedBy: [{ org, avatar, repo, repoStars }],
  sizes: { chartist: { lineChart, core }, chartjs, apexcharts, highcharts, method, versions }
}
```

- **npm:** the downloads API (`api.npmjs.org/downloads/point/last-month/chartist`).
- **GitHub:** the REST API for stars and contributors (anonymous, or `GITHUB_TOKEN` when set). The dependents count and list are parsed from `github.com/chartist-js/chartist/network/dependents`, which has no API.
- **"Used by" filter:** organization accounts, repository stars ≥ 50 (tunable), at most 12 entries, minus `src/data/used-by-exclude.json`.
- **Avatars:** downloaded into `src/assets/used-by/`, so the page makes no third-party requests.
- **Sizes:** each library's recommended line-chart entry is bundled with `esbuild` (minify, ESM, browser), then gzipped. The library versions are pinned as dev dependencies of `docs`. Chartist is measured from the workspace build.
- **Safety:** the build validates `facts.json` with a schema and fails on missing values.
- **Pages:** the date is shown wherever numbers appear.

### D5: Comparison rows

`comparison.ts` has one row per criterion, and each cell a value plus a source URL:

- rendering;
- styling with CSS;
- no build step (ESM CDN);
- SSR to SVG;
- TypeScript types;
- license for commercial use;
- chart types;
- built-in interactions (tooltips, zoom);
- bundle size (from facts).

Cells are reviewed by hand when the snapshot is refreshed. Rows where others offer more stay in. Copy follows the voice guide: no mocking.

### D6: `LiveExample`

`<LiveExample example="line/simple" />` or inline files.

- **Layout:** the editor and the live output side by side.
- **Before interaction:** a static code block plus the rendered chart, so the page works without loading CodeMirror.
- **On first focus:** CodeMirror loads lazily (the playground's editor).
- **Rendering:** each change re-runs `compile()`, debounced, in a sandboxed iframe like the playground. Errors show a status dot and message; the last good chart stays.
- **Actions:** copy and reset. "Open full-screen" and "share" come with `add-docs-examples`.
- **Where it's used:** the landing's live-edit section and Getting started.

### D7: Plugin demo

Three v2 plugins in `src/demos/plugins.ts`, toggled on one `barChart`:

- **Lollipop:** a `compose` listener that thins the bar and adds a `circle` node at its end.
- **Value labels:** adds a `text` node above each bar.
- **Threshold:** swaps the series class above a value.

The code panel shows the real source of the active plugins. This replaces the prototype's 1.x-style snippet.

### D8: Responsive demo

- **Polyfill:** the site bundles `match-container` (imported by this section's script only).
- **Resizable container:** `container-type: inline-size`, CSS `resize: horizontal`, plus a keyboard range input. Its `barChart` uses three `container()` entries for the label format, and the code panel names the active entry.
- **Two cards:** one chart config with `responsive(...)`.
- **Labeling:** marked "experimental, needs a polyfill today", as required by the plan.

### D9: Mascot poses and scenes

`Mascot` gains:

- the `celebrate` pose (confetti, flying hat; static under reduced motion);
- `reaction` (curious, proud).

The board slot can hold any scene. Ported from `Mascot.dc.html`.

### D10: Tests

E2E:

- each section renders;
- no third-party requests and no placeholders (`[N]`, `[MEASURED]`, `[DATE]`, `[LOGO`);
- the numbers equal `facts.json`;
- the story scene switches when chapters are scrolled into view or picked;
- the plugin toggles change the chart;
- `LiveExample` re-renders after an edit;
- the responsive demo's active rule changes with the width;
- reduced motion: no running animations, the static SMIL alternative shown;
- axe in both themes;
- the landing's code samples run against the local build.

Unit tests:

- the facts parsers (from fixtures);
- the `usedBy` filter.

## Risks / Trade-offs

- **Dependents parsing:** GitHub's dependents page can change; the script fails loudly and the last snapshot stays.
- **Avatars are marks:** shown as GitHub shows them, linked to evidence, removable via the exclude list (author decision).
- **Comparison accuracy decays:** dated, with sources and an issue link; refreshed per release.
- **Page weight:** many charts on one page. They render lazily, Chartist is shared, CodeMirror loads on demand only, and the polyfill only loads with the responsive section's script.
