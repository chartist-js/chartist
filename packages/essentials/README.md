# @chartist-js/essentials

The Chartist additions people ask for most, as layers you add to a chart. They're kept out of the core, so charts that don't use them stay small, and they're made and released together with Chartist.

It holds `axisTitle()` today. More layers and axes follow.

## Install

```sh
npm install @chartist-js/essentials
```

It depends on `chartist`, which npm installs with it. Load its stylesheet after Chartist's:

```ts
import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
```

### Without a bundler

Map both packages in an import map, so the package and your page share one copy of Chartist:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/chartist@2/dist/index.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@chartist-js/essentials@2/dist/styles.css"
/>
<script type="importmap">
  {
    "imports": {
      "chartist": "https://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.js",
      "@chartist-js/essentials": "https://cdn.jsdelivr.net/npm/@chartist-js/essentials@2/dist/index.js"
    }
  }
</script>
<script type="module">
  import { lineChart } from 'chartist';
  import { axisTitle } from '@chartist-js/essentials';
</script>
```

## Axis titles

`axisTitle()` names an axis. It reserves the room the title needs next to the axis labels, so you don't have to guess a padding, and the title never overlaps the labels:

```ts
import { lineChart } from 'chartist';
import { axisTitle } from '@chartist-js/essentials';

lineChart(
  '#chart',
  { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], series: [[12, 9, 7, 8, 5]] },
  {
    layers: {
      above: [
        axisTitle({ axis: 'x', text: 'Day' }),
        axisTitle({ axis: 'y', text: 'Visits' })
      ]
    }
  }
);
```

One layer draws one title. On the presets the axes are `x` and `y`; in a composed chart, use the ids you gave the axes:

```ts
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  cartesianAxes,
  chart,
  line,
  stepAxis
} from 'chartist';
import { axisTitle } from '@chartist-js/essentials';

chart('#chart', {
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    series: [
      [120, 150, 170, 210],
      [135, 160, 190, 230]
    ]
  },
  axes: cartesianAxes([
    { id: 'month', side: 'bottom', type: stepAxis() },
    { id: 'eur', side: 'left', type: autoScaleAxis() },
    { id: 'usd', side: 'right', type: autoScaleAxis() }
  ]),
  layers: [
    axisGrid({ axes: ['month', 'eur'] }),
    line({ series: [0], x: 'month', y: 'eur' }),
    line({ series: [1], x: 'month', y: 'usd' }),
    axisLabels(),
    axisTitle({ axis: 'month', text: 'Month', align: 'end' }),
    axisTitle({ axis: 'eur', text: 'EUR' }),
    axisTitle({ axis: 'usd', text: 'USD', flip: true })
  ]
});
```

| Option       | What it does                                                                             |
| ------------ | ---------------------------------------------------------------------------------------- |
| `axis`       | The id of the axis to name                                                               |
| `text`       | The title; an empty text draws nothing                                                   |
| `align`      | `start`, `middle` (default) or `end` along the axis; the start of a Y axis is its bottom |
| `flip`       | Left and right titles read from top to bottom instead of from bottom to top              |
| `gap`        | Space between the title and the axis labels, in px (default 4)                           |
| `className`  | Extra classes for the title                                                              |
| `classNames` | `{ title }` replaces the class `ct-axis-title`                                           |

Titles on the same side stack outward in the order of `layers`.

### Styling

The title is an SVG `text` with the classes `ct-axis-title`, `ct-horizontal` or `ct-vertical`, and `ct-start` or `ct-end`. It looks like the axis labels until you say otherwise:

```css
.ct-axis-title {
  --ct-axis-title-color: #555;
  --ct-axis-title-size: 0.875rem;
  font-weight: 600;
}
```

## On the server

The layers are part of the scene, so they render with `chartist/server` and hydrate like the rest of the chart:

```ts
import { lineChartConfig } from 'chartist';
import { renderToString, toScene } from 'chartist/server';
import { axisTitle } from '@chartist-js/essentials';

const config = lineChartConfig(
  { labels: ['Mon', 'Tue', 'Wed'], series: [[12, 9, 7]] },
  { layers: { above: [axisTitle({ axis: 'y', text: 'Visits' })] } }
);
console.log(renderToString(toScene(config, { width: 600, height: 300 })));
```

`@chartist-js/terminal` draws them too, vertical titles in a column.

## License

MIT or WTFPL, like Chartist. See [chartist.dev](https://chartist.dev/packages/essentials/) for the guides.
