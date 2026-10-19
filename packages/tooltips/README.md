# @chartist-js/tooltips

Tooltips for Chartist charts: hover a point, tap a bar or tab to a slice, and a tooltip shows its label, series and value. It works with the mouse, touch and the keyboard, stays on its value while the chart updates, and takes its looks from CSS.

## Install

```sh
npm install @chartist-js/tooltips
```

It brings `chartist` along. Load its stylesheet after Chartist's, and add the plugin to a chart:

```ts
import 'chartist/styles.css';
import '@chartist-js/tooltips/styles.css';
import { lineChart } from 'chartist';
import { tooltips } from '@chartist-js/tooltips';

lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [{ name: 'Visitors', data: [1200, 1500, 1350, 1600, 1100] }]
  },
  { plugins: [tooltips()] }
);
```

### Without a bundler

The browser build imports nothing, so it works next to any copy of Chartist 2:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/chartist@2/dist/index.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@chartist-js/tooltips@2/dist/styles.css"
/>
<div id="chart"></div>
<script type="module">
  import { lineChart } from 'https://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.js';
  import { tooltips } from 'https://cdn.jsdelivr.net/npm/@chartist-js/tooltips@2/dist/index.min.js';

  lineChart('#chart', { series: [[5, 9, 7, 8, 5]] }, { plugins: [tooltips()] });
</script>
```

## Your own text

`numberFormat` sets how the default text writes values, as `Intl.NumberFormat` options, and `format` replaces the text. Return `null` for no tooltip:

```ts
import { barChart } from 'chartist';
import { tooltips } from '@chartist-js/tooltips';

barChart(
  '#chart',
  { labels: ['Q1', 'Q2', 'Q3'], series: [[1250, 1830, 1470]] },
  {
    plugins: [
      tooltips({ numberFormat: { style: 'currency', currency: 'CHF' } })
    ]
  }
);

barChart(
  '#other',
  { labels: ['Q1', 'Q2', 'Q3'], series: [[12, 18, 0]] },
  {
    plugins: [
      tooltips({
        format: item =>
          item.value === 0
            ? null
            : `${item.label}\n${String(item.value)} orders`
      })
    ]
  }
);
```

Content is text, never HTML, so data can't put markup into the page. For markup or a framework's template, `render` fills the tooltip yourself:

```ts
import { lineChart } from 'chartist';
import { tooltips } from '@chartist-js/tooltips';

lineChart(
  '#chart',
  { series: [[5, 9, 7]] },
  {
    plugins: [
      tooltips({
        render(content, item) {
          const value = document.createElement('strong');
          value.textContent = String(item.valueIndex);
          content.append('Value ', value);
          // Return a function to undo it, e.g. to unmount a component.
        }
      })
    ]
  }
);
```

## Options

| Option         | What it does                                                                       |
| -------------- | ---------------------------------------------------------------------------------- |
| `roles`        | The roles that get tooltips: `point`, `bar` and `slice` by default; any role works |
| `format`       | The text of a tooltip; `null` for none                                             |
| `render`       | Fills the tooltip with your own content; may return a cleanup                      |
| `numberFormat` | `Intl.NumberFormat` options for the values                                         |
| `position`     | `element` (default) at the value, or `pointer` to follow the mouse                 |
| `keyboard`     | One tab stop per chart and arrow keys between values; `false` to turn it off       |
| `className`    | Extra classes for the tooltip                                                      |

## Styling

The tooltip is `.ct-tooltip`, with `.ct-tooltip-title`, `.ct-tooltip-series` and `.ct-tooltip-value`. Change its look with custom properties, on the page or a chart's container:

```css
.my-chart {
  --ct-tooltip-background: navy;
  --ct-tooltip-color: white;
  --ct-tooltip-hide-delay: 500ms;
}
```

It shows in the top layer, so `overflow: hidden` and `z-index` don't cut it off, and it's placed with the CSSOM, so it works under a strict Content Security Policy.

## License

MIT or WTFPL, like Chartist. See [chartist.dev](https://chartist.dev/packages/tooltips/) for the guides.
