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
- **Line height:** the measured height of one line, from `measureText('Mg', { classes })`.
- **Baseline:** the first baseline sits 0.8 × the font size below the top of the line box. The font size is the line height / 1.2, matching `estimateText` and the 1.x label CSS line height.

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
