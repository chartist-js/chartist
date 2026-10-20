# @chartist-js/essentials

The Chartist additions people ask for most, as layers you add to a chart. They're kept out of the core, so charts that don't use them stay small, and they're made and released together with Chartist.

It holds `axisTitle()`, `targetLine()`, `trendLine()`, `valueLabels()` and `logAxis()` today. More layers and axes follow.

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

## Target and trend lines

`targetLine()` draws a line across the chart at a value, such as a goal or a limit, with an optional label. `trendLine()` fits a straight line through each series' values (least squares) and draws it in the series' color:

```ts
import { lineChart } from 'chartist';
import { targetLine, trendLine } from '@chartist-js/essentials';

lineChart(
  '#chart',
  {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [[620, 810, 740, 930, 880, 1020]]
  },
  {
    low: 0,
    layers: {
      above: [targetLine({ value: 1000, label: 'Goal' }), trendLine()]
    }
  }
);
```

A target line takes `value`, `label`, `className`, the `axis` it's on (a Y axis draws it across, an X axis up and down) and where its label sits. A trend line's node knows its `slope`, `intercept` and `correlation`. On a log axis it's fitted to the logarithms, so it's straight there. Style them with `--ct-target-line-color`, `--ct-target-line-width`, `--ct-target-line-dasharray`, `--ct-trend-line-width` and `--ct-trend-line-dasharray`.

## Value labels

`valueLabels()` writes each value next to its point or bar: above points, past the ends of bars, and in the middle of stacked segments. Labels that don't fit their bar or would leave the chart move to where they fit:

```ts
import { barChart } from 'chartist';
import { valueLabels } from '@chartist-js/essentials';

barChart(
  '#chart',
  { labels: ['Q1', 'Q2', 'Q3'], series: [[1250, 1830, 1470]] },
  {
    layers: {
      above: [
        valueLabels({
          locale: 'en-US',
          numberFormat: { style: 'currency', currency: 'USD' }
        })
      ]
    }
  }
);
```

`format(item)` gets the same item as the `format` of `@chartist-js/tooltips`: `undefined` keeps the default text, `null` draws no label, and `\n` starts a new line. `pointPosition`, `barPosition` and `offset` place the labels, `roles` and `series` pick what gets one. Style them with `--ct-value-label-color`, `--ct-value-label-inside-color` and `--ct-value-label-size`.

## Log axis

`logAxis()` is an axis type for values that span several orders of magnitude. Each power of the base is the same distance from the next, so 100, 1,000 and 10,000 are evenly spaced:

```ts
import { lineChart } from 'chartist';
import { logAxis } from '@chartist-js/essentials';

lineChart(
  '#chart',
  {
    labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
    series: [[120, 980, 4100, 36000, 210000, 850000]]
  },
  {
    axisY: {
      type: logAxis({ minorTicks: true }),
      labelTransform: value => value.toLocaleString('en-US')
    }
  }
);
```

| Option       | What it does                                                                               |
| ------------ | ------------------------------------------------------------------------------------------ |
| `base`       | The base of the logarithm, any number above 1 (default 10)                                 |
| `minorTicks` | Grid lines without labels between the ticks, styled with `--ct-grid-minor-*` (default off) |

The axis's own options work as on the core's axes: `low` and `high` set the range exactly, `ticks` sets the ticks by hand, and `labelTransform` formats the labels. Zero and negative values have no place on a log scale: they're drawn at the start of the axis. Use `null` for a gap. A `trendLine()` on a log axis is fitted to the logarithms, so it's straight on the chart.

## On the server

The layers and the log axis are part of the scene, so they render with `chartist/server` and hydrate like the rest of the chart:

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
