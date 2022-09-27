---
slug: /docs/whats-new-in-v1
description: What's new in Chartist v1?
---

# What's new in v1?

## ESM

Now Chartist is truly an ES module and exposes its API through the exports, thus making Chartist [tree-shakable](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking).

### Migration from v0.11

- Each property of Chartist object now is named export.
- Chart classes were renamed.
- Easing object now is named export.

```js
const Chartist = require('chartist')

new Chartist.Bar(/* ... */);
new Chartist.Line(/* ... */);
new Chartist.Pie(/* ... */);
new Chartist.Svg(/* ... */);
Chartist.Svg.Easing
// ...

// ->

import { BarChart, LineChart, PieChart, Svg, easings } from 'chartist'

new BarChart(/* ... */)
new LineChart(/* ... */)
new PieChart(/* ... */)
new Svg(/* ... */)
easings
// ...
```

## TypeScript

Chartist was rewritten and fully typed with TypeScript.

### Some of exposed types

```ts
import type {
  BarChartData,
  BarChartOptions,
  LineChartData,
  LineChartOptions,
  PieChartData,
  PieChartOptions
} from 'chartist'
```
