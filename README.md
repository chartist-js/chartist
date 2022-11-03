# Big welcome by the Chartist Guy

[![NPM version][npm]][npm-url]
[![Downloads][downloads]][downloads-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]
[![Bundle size][size]][size-url]
[![Join the chat at https://gitter.im/gionkunz/chartist-js][chat]][chat-url]

[npm]: https://img.shields.io/npm/v/chartist.svg
[npm-url]: https://www.npmjs.com/package/chartist

[downloads]: https://img.shields.io/npm/dm/chartist.svg
[downloads-url]: https://www.npmjs.com/package/chartist

[build]: https://img.shields.io/github/workflow/status/chartist-js/chartist/CI.svg
[build-url]: https://github.com/chartist-js/chartist/actions

[coverage]: https://img.shields.io/codecov/c/github/chartist-js/chartist.svg
[coverage-url]: https://app.codecov.io/gh/chartist-js/chartist

[size]: https://img.shields.io/bundlephobia/minzip/chartist
[size-url]: https://bundlephobia.com/package/chartist

[chat]: https://badges.gitter.im/gionkunz/chartist-js.svg
[chat-url]: https://gitter.im/gionkunz/chartist-js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge

<p align="center">
  <img width="400" alt="The Chartist Guy" src="https://raw.github.com/chartist-js/chartist/main/website/static/img/chartist-guy.gif">
</p>

Chartist is a simple responsive charting library built with SVG. There are hundreds of nice charting libraries already
out there, but they are either:

- use the wrong technologies for illustration (canvas) 
- weighs hundreds of kilobytes
- are not flexible enough while keeping the configuration simple
- are not friendly to designers
- more annoying things

That's why we started Chartist and our goal is to solve all of the above issues.

<hr />
<a href="#quickstart">Quickstart</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="#what-is-it-made-for">What is it made for?</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="#whats-new-in-v1">What's new in v1?</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="#examples">Examples</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="#contribution">Contribution</a>
<hr />

## Quickstart

Install this library using your favorite package manager:

```sh
pnpm add chartist
# or
yarn add chartist
# or
npm i chartist
```

Then, just import chart you want and use it:

```js
import { BarChart } from 'chartist';

new BarChart('#chart', {
  labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
  series: [
    [1, 2, 4, 8, 6, -2, -1, -4, -6, -2]
  ]
}, {
  high: 10,
  low: -10,
  axisX: {
    labelInterpolationFnc: (value, index) => (index % 2 === 0 ? value : null)
  }
});
```

<br />

Need an API to fetch data? Consider [Cube](https://cube.dev/?ref=eco-chartist), an open-source API for data apps.

<br />

[![supported by Cube](https://user-images.githubusercontent.com/986756/154330861-d79ab8ec-aacb-4af8-9e17-1b28f1eccb01.svg)](https://cube.dev/?ref=eco-chartist)

## What is it made for?

Chartist's goal is to provide a simple, lightweight and unintrusive library to responsively craft charts on your website. 
It's important to understand that one of the main intentions of Chartist is to rely on standards rather than providing 
it's own solution to a problem which is already solved by those standards. We need to leverage the power of browsers 
today and say good bye to the idea of solving all problems ourselves.

Chartist works with inline-SVG and therefore leverages the power of the DOM to provide parts of its functionality. This 
also means that Chartist does not provide it's own event handling, labels, behaviors or anything else that can just be 
done with plain HTML, JavaScript and CSS. The single and only responsibility of Chartist is to help you drawing "Simple 
responsive Charts" using inline-SVG in the DOM, CSS to style and JavaScript to provide an API for configuring your charts.

## What's new in v1?

### ESM

Now Chartist is truly an ES module and exposes its API through the exports, thus making Chartist [tree-shakable](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking).

<details>
  <summary>Migration from v0.11</summary>

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

</details>

### TypeScript

Chartist was rewritten and fully typed with TypeScript.

<details>
  <summary>Some of exposed types</summary>

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

</details>

## Examples

<details>
  <summary>Bar Chart</summary>

- [Bi-polar bar chart](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/bar/bi-polar-interpolated)
- [Distributed series](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/bar/distributed-series)
- [Extreme responsive configuration](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/bar/extreme-responsive)
- [Horizontal bar chart](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/bar/horizontal)
- [Label placement](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/bar/label-position)
- [Multi-line labels](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/bar/multiline)
- [Overlapping bars on mobile](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/bar/overlapping-bars)
- [Stacked bar chart](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/bar/stacked)
- [Stacked bar chart with accumulate-relative stack mode](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/bar/stacked-accumulate-relative)
- [Add peak circles using the draw events](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/bar/with-circle-modify-drawing)

</details>

<details>
  <summary>Line Chart</summary>

- [Line chart with area](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/area)
- [Auto scale axis](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/axis-auto)
- [Fixed and auto scale axis](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/axis-fixed-and-auto)
- [Bi-polar Line chart with area only](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/bipolar-area)
- [Filled holes in data](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/data-fill-holes)
- [Holes in data](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/data-holes)
- [Using events to replace graphics](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/modify-drawing)
- [Only whole numbers](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/only-integer)
- [SVG Path animation](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/path-animation)
- [Line scatter diagram with responsive settings](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/scatter-random)
- [Series Overrides](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/series-override)
- [Simple line chart](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/simple)
- [Simple responsive options](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/simple-responsive)
- [Line Interpolation / Smoothing](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/simple-smoothing)
- [Simple SMIL Animations](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/simple-svg-animation)
- [Advanced SMIL Animations](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/svg-animation)
- [Timeseries](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/line/timeseries)

</details>

<details>
  <summary>Pie Chart</summary>

- [Pie chart with custom labels](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/pie/custom-labels)
- [Animating a Donut with Svg.animate](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/pie/donut-animation)
- [Donut chart](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/pie/donut-chart)
- [Simple pie chart](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/pie/simple)
- [Gauge chart](http://codesandbox.io/s/github/chartist-js/chartist/main/sandboxes/pie/simple-gauge)

</details>

## Plugins

Coming soon.

<details>
  <summary>For v0.11</summary>

Some features aren't right for the core product
but there is a great set of plugins available
which add features like:

* [Axis labels](http://gionkunz.github.io/chartist-js/plugins.html#axis-title-plugin)
* [Tooltips at data points](https://gionkunz.github.io/chartist-js/plugins.html#tooltip-plugin)
* [Coloring above/below a threshold](https://gionkunz.github.io/chartist-js/plugins.html#threshold-plugin)

and more.

See all the plugins [here](https://gionkunz.github.io/chartist-js/plugins.html).

</details>

## Contribution

We are looking for people who share the idea of having a simple, flexible charting library that is responsive and uses
modern and future-proof technologies. The goal of this project is to create a responsive charting library where developers
have their joy in using it and designers love it because of the designing flexibility they have. Please contribute
to the project if you like the idea and the concept and help us to bring nice looking responsive open-source charts
to the masses.

Contribute if you like the Chartist Guy!
