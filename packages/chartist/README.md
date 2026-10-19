# Chartist

[![npm (next)][npm]][npm-url]
[![Downloads][downloads]][downloads-url]
[![Build status][build]][build-url]

[npm]: https://img.shields.io/npm/v/chartist/next.svg
[npm-url]: https://www.npmjs.com/package/chartist
[downloads]: https://img.shields.io/npm/dm/chartist.svg
[downloads-url]: https://www.npmjs.com/package/chartist
[build]: https://img.shields.io/github/actions/workflow/status/chartist-js/chartist/ci.yml?branch=main
[build-url]: https://github.com/chartist-js/chartist/actions

<p align="center">
  <a href="https://chartist.dev"><img width="480" alt="The Chartist Guy presents a line chart that draws itself on his easel." src="https://raw.githubusercontent.com/chartist-js/chartist/main/docs/assets/chartist-guy.gif"></a>
</p>

Simple, responsive charts, drawn in SVG and styled with CSS. Tiny, typed, and happy without a build step.

**[chartist.dev](https://chartist.dev)** · [Getting started](https://chartist.dev/docs/getting-started/) · [API](https://chartist.dev/api/) · [Examples](https://chartist.dev/examples/) · [Plugins](https://chartist.dev/plugins/) · [Changelog](https://github.com/chartist-js/chartist/blob/main/CHANGELOG.md)

> **Coming from Chartist 1?** Your code keeps working. [Coming from 1.x](https://chartist.dev/docs/coming-from-1x/) shows what's new, and the 1.x docs are at [chartist.dev/v1/](https://chartist.dev/v1/).

## Install

```sh
npm install chartist
```

```ts
import { lineChart } from 'chartist';
import 'chartist/styles.css';

lineChart('#chart', {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [
    [12, 9, 7, 8, 5],
    [2, 1, 3.5, 7, 3]
  ]
});
```

```html
<div id="chart" class="ct-golden-section"></div>
```

No bundler? Chartist is a native ES module:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.css"
/>
<div id="chart" class="ct-golden-section"></div>
<script type="module">
  import { lineChart } from 'https://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.js';

  lineChart('#chart', { series: [[1, 3, 2, 5]] });
</script>
```

## Why Chartist

- **Style it with CSS.** Plain SVG with predictable classes and custom properties for colors, lines and labels. No theme engine.
- **Responsive, two ways.** Options that change with media queries, or with the chart's own container.
- **Composed charts.** Bars and lines in one chart, on as many axes as you need.
- **Renders anywhere SVG does.** Render on a server, with real SVG text labels, for PDFs, email and images.
- **Extend everything.** Every element passes through an open pipeline you can hook into, and the community's plugins keep working.
- **Tiny and typed.** Written in TypeScript, no dependencies, and you ship only what you import.

## Coming from 1.x

Your 1.x code keeps working: the chart classes draw what they drew before. 1.x events and plugins work with `chartist/compat`. The classes are deprecated, and 3.0 removes them from `chartist`. [Coming from 1.x](https://chartist.dev/docs/coming-from-1x/) explains what changed and how to move to the functions.

## Community wrappers

Chartist needs no wrapper: a chart is a container and a function call, and [Charts in frameworks](https://chartist.dev/docs/frameworks/) has recipes for React, Vue, Angular and Svelte, with server rendering. If you'd rather use a component, the community wraps Chartist for these stacks. Thank you to everyone who built them!

| Stack         | Wrapper                                                                                         | Built for    |
| ------------- | ----------------------------------------------------------------------------------------------- | ------------ |
| React         | [react-chartist](https://github.com/fraserxu/react-chartist)                                    | Chartist 1.x |
| Angular       | [ng-chartist](https://github.com/willsoto/ng-chartist)                                          | Chartist 1.x |
| Vue           | [vue-chartist](https://github.com/Yopadd/vue-chartist)                                          | Chartist 0.x |
| Node.js       | [node-chartist](https://github.com/panosoft/node-chartist)                                      | Chartist 0.x |
| Ember         | [ember-cli-chartist](https://github.com/jherdman/ember-cli-chartist)                            | Chartist 0.x |
| Java (JSF)    | [ChartistJSF](https://github.com/hatemalimam/ChartistJSF)                                       | Chartist 0.x |
| Vue 2         | [v-chartist](https://github.com/lakb248/vue-chartist)                                           | Chartist 0.x |
| R             | [chartist](https://github.com/yutannihilation/chartist) (htmlwidget)                            | Chartist 0.x |
| Meteor        | [mfpierre:chartist-js](https://github.com/mfpierre/meteor-chartist-js)                          | Chartist 0.x |
| WordPress     | [TablePress Extension: Chartist](https://wordpress.org/plugins/charts-for-tablepress-chartist/) | Chartist 0.x |
| Blazor        | [UnlockedData.Chartist.Blazor](https://github.com/unlockeddataltd/UnlockedData.Chartist.Blazor) | Chartist 0.x |
| Angular       | [ngx-chartist](https://github.com/affilnost/ngx-chartist)                                       | Chartist 0.x |
| Ruby on Rails | [chartist-rails](https://github.com/AnthonyBobsin/chartist-rails)                               | Chartist 0.x |

Wrappers built for 1.x run on v2: see [Community wrappers](https://chartist.dev/docs/frameworks/#community-wrappers) for the npm `overrides` entry they need until they allow `chartist@2`. Maintain a wrapper that's missing here? Send a pull request.

## Supported by

[Cube](https://cube.dev) sponsors Chartist's maintenance. Thank you!

## License

Dual-licensed under [MIT](https://github.com/chartist-js/chartist/blob/main/LICENSE-MIT) or [WTFPL](https://github.com/chartist-js/chartist/blob/main/LICENSE-WTFPL), at your choice.
