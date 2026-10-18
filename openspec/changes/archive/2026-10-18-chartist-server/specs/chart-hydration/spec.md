## MODIFIED Requirements

### Requirement: Hydration markup

`chartist/server` SHALL export `renderForHydration(config, size)`; `chartist` SHALL NOT. It builds the chart's scene without a DOM, as `toScene()` does, with the size's `width`, `height`, optional `measureText` and optional `labels`, and returns markup for the browser to take over. In that markup, the root SHALL:

- carry a `data-ct-hydrate` attribute with what the browser needs to build the same scene again: the layout width and height, the label mode, whether text was measured with the built-in estimate or a custom `measureText`, and whether the root got a scaling `viewBox`;
- have the `width` and `height` that `chart()` gives the root for the same config (`100%` unless the config sets a size);
- unless the config sets a `viewBox`, have a `viewBox` of the layout size, so the drawing scales into its container until the browser lays it out.

Labels SHALL default to HTML, as `chart()` draws them; a `labels` option still decides.

The markup SHALL have no `style` attributes:

- declarations an SVG presentation attribute can express SHALL be written as that attribute (a label `foreignObject`'s `overflow`, a donut slice's `stroke-width`);
- a label span's size and the root's inline size style SHALL be left out, since the stylesheet and the root's attributes give the same layout;
- any other declarations, such as styles a `scene` listener added, SHALL be left out, and are applied when the browser takes the markup over.

`toScene()` and `renderToString()` SHALL stay unchanged by this: their markup is a self-contained SVG image and keeps its inline styles.

#### Scenario: Marked root

- **WHEN** a line chart config is passed to `renderForHydration()` with `{ width: 600, height: 300 }`
- **THEN** the root svg has `width="100%"`, `height="100%"`, `viewBox="0 0 600 300"` and a `data-ct-hydrate` attribute recording 600 × 300, HTML labels, the estimate and the scaling `viewBox`, and the labels are `foreignObject` elements

#### Scenario: The config sets a viewBox

- **WHEN** a config with `viewBox: { width: 400, height: 200 }` is passed to `renderForHydration()`
- **THEN** the root's `viewBox` is the config's, and the marker records that it isn't a scaling `viewBox`

#### Scenario: No style attributes

- **WHEN** `renderForHydration()` renders a line chart with HTML labels, a preset config, and a donut with `donutWidth: 20`
- **THEN** none of the markup has a `style` attribute, the label `foreignObject` elements have `overflow="visible"`, and the donut's slices have `stroke-width="20"`

#### Scenario: The self-contained image is unchanged

- **WHEN** the same configs are rendered with `toScene()` and `renderToString()`
- **THEN** the markup has no `data-ct-hydrate` attribute and has the inline styles it had before this change

#### Scenario: Same look as after the takeover

- **WHEN** a page with Chartist's stylesheet shows the hydration markup of a line chart and of a donut with `donutWidth: 20` in containers of the server's size, without JavaScript
- **THEN** the labels have the boxes and the slices the stroke width they have after the chart took the markup over

#### Scenario: Visible without JavaScript

- **WHEN** a page shows the hydration markup of a 600 × 300 line chart in a 343 px wide container with an `aspect-ratio` of 2 / 1, with Chartist's CSS and without JavaScript
- **THEN** the whole chart is visible, scaled into the container, and the page doesn't scroll horizontally
