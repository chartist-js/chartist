# Design

## Context

- **Labels today:** axis labels come from `axisNodes()` in `scales/grid.ts`, as `foreignObject` (the 1.x box: position, label length, `offset - 10`) holding a `span` with the label, direction and side classes.
- **1.x alignment:** the CSS aligns the span inside the box with flexbox (`ct-align-justify(align-items, justify-content)`), with rules per chart type.
- **Renderers:**
  - the DOM renderer (`domRenderer()`) builds elements and measures text in the document;
  - `toScene()` builds a scene without a renderer, with `estimateText` by default, and `renderToString()` serializes any scene.
- **Scene:** nodes are named after SVG elements, and renderers interpret nothing.
- **Pie:** labels are SVG `text` in 1.x already and stay as they are.

## Decisions

### D1: The mode is chosen before compose; the scene stays plain SVG

The author chose option 3b: no abstract label node.

- `Renderer` gets `labels?: 'html' | 'svg'`; `domRenderer()` sets `html`.
- `toScene()` uses `svg` unless its config or options say otherwise.
- The chart config gets `labels?`, which overrides the renderer.
- The pipeline resolves the mode once and passes it to the layers as `LayerContext.labels`.
- Label layers build the matching nodes.

Listeners (`compose`, `scene`, `mount`) therefore see exactly what is rendered.

Rejected: an abstract `label` node lowered by each renderer. It breaks "scene = SVG", and listeners would see a node that is never rendered.

### D2: Precedence

The order is: layer option (`axisLabels({ labels })`), then the chart config or preset option (`labels`), then the `toScene()` option, then the renderer default.

- The presets pass their `labels` option to their internal label layer.
- `PresetChart` (the 1.x classes) never sets it, and drops a `labels` key from the 1.x options, so classes always draw HTML.

### D3: SVG label nodes

The SVG label mirrors the HTML one, with the same box (the `foreignObject` rectangle):

```svg
<text class="ct-label ct-horizontal ct-end" x=".." y=".." text-anchor="start|middle|end">
  <tspan x=".." y="..">first line</tspan>
  …
</text>
```

- **Role and context:** the role is `label`, and the context (`axis`, `index`, `text`, box `x/y/width/height`) is the same, so compose listeners can treat both modes alike.
- **Positions:** each `tspan` carries an absolute `x` and `y`, with no `dy` or `dominant-baseline`, because converters handle those inconsistently.
- **Line height and baseline:** see the implementation notes (one font size per line, the first baseline at 0.85 em).

### D4: Wrapping

Words split on whitespace and are added greedily while `measureText(line)` fits the box width:

- X labels fit the step length;
- Y labels fit `offset - 10`.

A single word that's too wide stays on its own line. Empty labels produce no `text` node, as the HTML labels produce no text node. Measurement uses the label's classes; in the DOM it runs inside the chart container, so chart-type CSS (font size) applies (D6).

### D5: Alignment table

Horizontal anchor and vertical placement inside the box reproduce the default CSS:

| Chart               | Label          | Vertical     | Horizontal  |
| ------------------- | -------------- | ------------ | ----------- |
| line / composed     | X start (top)  | bottom       | start       |
| line / composed     | X end (bottom) | top          | start       |
| line / composed     | Y start (left) | bottom       | end         |
| line / composed     | Y end (right)  | bottom       | start       |
| bar                 | X start / end  | bottom / top | middle      |
| bar, horizontalBars | Y start / end  | middle       | end / start |
| bar, horizontalBars | X start / end  | bottom / top | start       |

- The `top`/`middle`/`bottom` placement moves the whole block of lines.
- `axisLabels({ align: { horizontal?, vertical? } })` overrides the table, and the presets choose their row.
- CSS can still restyle color and font, but not alignment. The docs say so.

### D6: Measuring in the container

The DOM renderer's `measureText` measures in a probe `svg` in `document.body`, so chart-type selectors (`.ct-chart-bar .ct-label`) don't match. The DOM host already measures the chart size with a probe in the container, and text measurement gets the same probe: `measureText` receives an optional `container` from the host. The estimate is kept as the fallback (jsdom, a zero box).

### D7: Size

The SVG label code (wrapping, alignment table, `text` nodes) lives in its own module. `axisNodes()` takes it as a function, as with `place` in `add-composed-charts`, so it is only bundled when `labels: 'svg'` is possible.

But the presets accept `labels`, so `lineChart` and `barChart` bundle it anyway; the expected cost is ~0.4 kB gzip. `chart()` without `axisLabels` doesn't bundle it.

## Risks / Trade-offs

- **Renderer output differs:** the DOM and string output of one config differ in their labels. That's intended (author decision); the docs explain the `labels` option.
- **Estimated metrics on the server:** wrapping is approximate, and a long label may wrap differently than in a browser.
- **Baseline approximation:** the 0.8 em ascent is a typical font ascent. The visual review of the new baselines checks it against the HTML labels in the same chart; differences of 1–2 px are accepted.
- **Converted 1.x plugins:** with `labels: 'svg'` and compat, the 1.x `draw` events for labels carry an `Svg` wrapper of the `text` element instead of the `foreignObject`. 1.x plugins that read the span don't work in this mode (documented).

## Implementation notes

- **Line pitch is one font size, not 1.2.** The 1.x label CSS sets `line-height: 1`. The DOM measurement reports the computed font size (`TextMetrics.fontSize`); the first baseline sits 0.85 em below the top of the block. With this, `line/svg-labels` matches `line/simple` pixel for pixel.
- **Re-layout when web fonts load.** Charts render before web fonts finish loading, so measured widths would come from the fallback font; HTML labels reflow, SVG text doesn't. `chart()` lays out again on `document.fonts` `loadingdone` when the last render measured text (only SVG text labels measure), until `detach()`. HTML-label charts and the 1.x classes never render twice.
- **Wrap width rounded to px**, as the 1.x span style rounds the HTML label width; otherwise borderline labels wrapped in SVG but not in HTML.
- **Composed HTML labels were misaligned** (found while comparing): the 1.x CSS enables the flexbox alignment only under `.ct-chart-line`/`.ct-chart-bar`, and composed charts have neither class, so their HTML labels sat at the top of their boxes, one step above the grid line. `foreignObject > .ct-label` now gets `display: flex` too; 1.x output is unchanged. The `composed/*` baselines were re-recorded, and `bar-and-line` no longer needs extra top padding.
- **The 1.x classes** drop `labels` in a `resolve` listener of their internal plugin, which covers `update()` and responsive options.
- **v2 test-only examples** need no 1.x story in the manifest check.
