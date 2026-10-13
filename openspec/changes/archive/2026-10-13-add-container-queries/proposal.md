# Proposal

## Why

Charts often sit in sidebars, cards and grid cells whose width has little to do with the viewport. 1.x responsive options only react to window media queries, so a chart in a 350 px sidebar on a wide screen gets its desktop options. The `responsive-options` spec already asks for a container mode. The platform is about to provide the matching API: the CSSWG resolved to add `Element.matchContainer()`, the `@container` counterpart of `window.matchMedia()` ([csswg-drafts#6205](https://github.com/w3c/csswg-drafts/issues/6205); a spec PR and a flagged Chromium prototype exist). The [`match-container`](https://github.com/teetotum/match-container) polyfill provides it today. Building on that API instead of a home-made query parser gives the real `@container` syntax for free, and users can reuse the conditions they already write in their CSS.

## API sketch

```ts
import 'match-container'; // polyfill, until browsers ship matchContainer()
import { chart, container, lineChart, responsive } from 'chartist';

// Presets: container and media conditions mixed per entry, merged in order.
lineChart('#chart', data, { showArea: true }, [
  ['screen and (min-width: 1200px)', { showPoint: true }],
  [
    container('(width < 400px)'),
    { showPoint: false, axisX: { showLabel: false } }
  ]
]);

// chart(): the same entries with partial configs (composed charts).
chart('#chart', {
  ...config,
  responsive: responsive([
    [container('(width < 400px)'), { labels: 'svg', padding: 5 }]
  ])
});
```

```css
/* The chart container (or an ancestor) is the queried container. */
.sidebar .ct-chart {
  container-type: inline-size;
}
```

## What Changes

- **`container(query)`** marks a responsive entry as a container condition. Each entry decides between `@media` (a plain string, as in 1.x) and `@container` (`container(...)`), so both can be mixed. All matching entries are merged in order, as in 1.x.
- **Evaluation with `Element.matchContainer()`**, native or polyfilled, from a stable element inside the chart container. The chart container or an ancestor must be a CSS container (`container-type`), exactly as for `@container` rules; Chartist doesn't set it.
- **Re-evaluation:** on container resizes (`ResizeObserver`) and on `change` events where the query list provides them. The chart re-renders only when the set of matching entries changes, and emits `responsive` as it does for media queries.
- **Without `matchContainer()`:** a one-time console warning names the polyfill, and container entries don't match (base and media options apply). `toScene()` and other DOM-less paths treat container entries as not matching, without a warning.
- **`chart()` gets responsive overrides:** `responsive: responsive([[condition, Partial<ChartConfig>], …])`, with media and container conditions. Matching overrides are shallow-merged over the config in order. Composed charts can now respond to size.
- **The 1.x classes are unchanged:** they keep media queries only (no new features) and ignore `container()` entries.
- **Recorded in the plan:** the standard and its implementations become a monitored dependency, and the docs must mark container conditions as experimental and polyfill-dependent.

## Out of scope

- Writing our own `@container` parser or polyfill, or bundling the polyfill.
- Setting `container-type` automatically (size containment changes layout).
- Style and scroll-state queries are whatever the API supports, but they are not tested or documented: Chartist only re-evaluates on resize and `change` events.
- Container conditions in the 1.x classes.

## Breaking changes vs 1.x

None. Plain string entries keep the 1.x window media query behavior, the 1.x classes are unchanged, and `chart()`'s `responsive` is a new optional key.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `responsive-options`: per-entry `container()` conditions evaluated with `Element.matchContainer()`, fallback without the API, condition errors, responsive overrides for `chart()`.

## Impact

- `packages/chartist/src/`: a new `responsive/` module (`container()`, evaluation and watching shared by presets and `chart()`), `presets/preset.ts` (entries of both kinds), `chart/chart.ts` and `chart/types.ts` (`responsive`), `charts/PresetChart.ts` (drops container entries).
- Dev dependency `match-container` for the visual harness and the browser examples; jsdom tests use a fake `matchContainer()`.
- Tests: unit tests (merge order, change detection, fallback warning), `test:api`, a visual example `composed/container-queries` rendered at two container widths in one viewport.
- `docs/v2-high-level-plan.md`: a "Standards to monitor" entry and a docs requirement.
