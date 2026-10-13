# Proposal

## Why

Chartist draws axis labels as HTML inside `foreignObject`, as 1.x does. That works in browsers, but tools that read SVG without an HTML engine drop every label. These include image converters (resvg/sharp, librsvg, Inkscape), PDF pipelines and email clients. That makes `toScene()` + `renderToString()`, the v2 server path, useless for exporting images. The `chart-rendering` spec already requires wrapped SVG text labels. This change implements them. Each renderer sets the default label mode (author decision 2026-10-13, option 3b), so browser charts keep the 1.x markup and string output works everywhere.

## API sketch

```ts
import {
  toScene,
  renderToString,
  chart,
  lineChart,
  axisLabels
} from 'chartist';

// String output: SVG text by default, wrapped into tspans.
const svg = renderToString(toScene(config, { width: 600, height: 300 }));

// DOM: HTML labels by default (1.x markup); opt into SVG text per chart…
chart('#chart', { ...config, labels: 'svg' });
lineChart('#chart', data, { labels: 'svg' });

// …or per label layer.
axisLabels({ labels: 'svg' });
```

## What Changes

- **Label mode per renderer.**
  - A renderer declares its default label mode: the DOM renderer `html`, and `toScene()` (the string path) `svg`.
  - The pipeline passes the mode to the layers in the layer context, so the scene stays plain SVG elements. Layers build either `foreignObject > span` or `text > tspan`.
- **`labels` option** (`'html' | 'svg'`):
  - on the `chart()` config, `toScene()`, `lineChart()` and `barChart()`, and on `axisLabels()`;
  - an explicit option overrides the renderer's default, and the layer option overrides the chart's.
- **SVG text labels:**
  - words wrap within the label's available width, measured with the renderer's `measureText` (estimated without a DOM);
  - one `tspan` per line;
  - the same classes as the HTML labels (`ct-label`, direction and side classes);
  - the same `labelOffset`, box and data context.
- **Computed alignment.**
  - The HTML labels are aligned by the 1.x flexbox CSS (`ct-align-justify`). SVG text can't be, so the layout computes `text-anchor` and line positions from the same rules, per chart type: line, bar and horizontal bar.
  - Defaults reproduce the 1.x CSS positions.
  - `axisLabels({ align })` overrides them.
- **CSS:** label color and size already apply to SVG text (the label mixin sets `fill`). The flexbox rules simply don't apply to `text`.
- **Pie is unchanged:** pie labels are SVG `text` in 1.x already.

## Out of scope

- Truncation with an ellipsis, `maxLines`, and hyphenation. A single word wider than the slot stays on its own line and overflows.
- Rotated labels and label collision handling.
- Rendering presets to a string (`lineChart` and `barChart` render to the DOM only). Their `labels: 'svg'` serves DOM charts that get serialized or exported (`XMLSerializer`, image downloads).
- The 1.x classes. They get no new features (author decision 2026-10-13) and always draw HTML labels.
- Container-query responsive options (`add-container-queries`, next).

## Breaking changes vs 1.x

None:

- the DOM default stays HTML labels with the 1.x markup, which the parity tests and the visual baseline verify;
- the 1.x classes are unchanged;
- the only behavior change is the default of `toScene()`, a v2 `@experimental` API: its labels become SVG text instead of `foreignObject`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chart-rendering`: label mode per renderer, the `labels` option, wrapping and alignment of SVG text labels.

## Impact

- `packages/chartist/src/`:
  - `render/` (a label mode on renderers, measurement in the chart container);
  - `pipeline/` (mode in the config and the layer context);
  - `chart/toScene.ts` (`labels` option, `svg` default);
  - `scales/grid.ts` (SVG label nodes, wrapping, alignment);
  - `layers/axes.ts` (`labels`, `align`);
  - `presets/` (the `labels` option, alignment per chart type, never set by the 1.x classes).
- Tests:
  - unit tests (wrapping, alignment table);
  - `test:api` (the defaults per path, the option precedence, string output without `foreignObject`);
  - a visual example `composed/svg-labels` and SVG-label variants of a line and a bar example, recorded from v2 and reviewed against the HTML baseline;
  - the parity suites unchanged.
