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

> **Chartist 2 is in release candidates.** Install it with `npm install chartist@next`. Plain `npm install chartist` installs Chartist 1 until 2.0.0 is out. The 1.x docs are at [chartist.dev/v1/](https://chartist.dev/v1/).

## Install

```sh
npm install chartist@next
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
  href="https://cdn.jsdelivr.net/npm/chartist@next/dist/index.min.css"
/>
<div id="chart" class="ct-golden-section"></div>
<script type="module">
  import { lineChart } from 'https://cdn.jsdelivr.net/npm/chartist@next/dist/index.min.js';

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

Your 1.x code keeps working: the chart classes draw what they drew before. 1.x events and plugins work with `chartist/compat`. [Coming from 1.x](https://chartist.dev/docs/coming-from-1x/) explains what changed and how to move to the functions.

## Supported by

[Cube](https://cube.dev) sponsors Chartist's maintenance. Thank you!

## Contributing

This repository holds the library (`packages/chartist`), its docs site at chartist.dev (`apps/docs`), the examples and the playground, in an Nx and pnpm monorepo. Clone it, run `pnpm install`, and run tasks through Nx, for example `pnpm nx test chartist` or `pnpm nx dev docs`. [CONTRIBUTING.md](CONTRIBUTING.md) has the setup, the tests and the submission guidelines.

## License

Dual-licensed under [MIT](LICENSE-MIT) or [WTFPL](LICENSE-WTFPL), at your choice.
