# @chartist-js/terminal

Chartist charts in the terminal. Line, bar and pie charts with Chartist's own layout, labels and series colors, drawn in braille dots and block characters:

<img width="634" alt="A terminal window with a chart of response times over a day: the median as a line, the 10th to 90th percentile as a band around it, a dotted target line labeled SLO at 200 ms, and the points over the target marked in yellow, all in braille dots, with a legend below." src="https://raw.githubusercontent.com/chartist-js/chartist/main/packages/terminal/assets/readme.png">

It renders the scene Chartist builds for any chart (`toScene()`), the same one the SVG renderers get. So a terminal chart takes the options you know from `lineChart()`, `barChart()` and `pieChart()`, and the same chart can also come out as text-art HTML.

There are two ways to use it: the `ct-cli` command, and an API for your own CLI tools.

## Install

```sh
npm install @chartist-js/terminal@next
```

It depends on `chartist`, which npm installs with it. The command needs Node.js 22 or later; the API runs in any JavaScript runtime, browsers included.

## The command

```sh
npx @chartist-js/terminal demo
```

Installed globally (`npm install -g @chartist-js/terminal@next`), the command is `ct-cli`. Give it a chart type and the series, each a comma-separated list of numbers:

```sh
ct-cli line 12,9,7,8,5 2,1,3.5,7,3 --labels Mon,Tue,Wed,Thu,Fri --names Visitors,Sign-ups --smooth --area
ct-cli bar 5,4,3,7 3,2,9,5 --labels Q1,Q2,Q3,Q4 --stack
ct-cli bar 5,3,8 --labels Bananas,Apples,Kiwis --horizontal
ct-cli pie 20,10,30 --labels Bananas,Apples,Kiwis --donut
```

An empty value is a hole: `1,,3`.

### Data from files and pipes

Without series arguments, the data comes from `--data <file>` or from stdin. JSON works as `{ "labels": [...], "series": [...] }` or as a plain array:

```sh
echo '{"labels":["Bananas","Apples","Kiwis"],"series":[20,10,30]}' | ct-cli pie --donut
```

Anything else is read as rows of values, one series per row, separated by commas, semicolons, tabs or spaces. A first row that isn't numbers is the labels, and a first column that isn't numbers is the series names:

```sh
printf ',Mon,Tue,Wed\nVisitors,3,5,4\nSign-ups,1,2,3\n' | ct-cli bar --stack
```

### Options

| Option                  | What it does                                                  |
| ----------------------- | ------------------------------------------------------------- |
| `-d, --data <file>`     | Reads the data from a file                                    |
| `-l, --labels <a,b,c>`  | Labels of the values, or of the slices                        |
| `-n, --names <a,b>`     | Series names, shown in a legend                               |
| `-w, --width <columns>` | Width in columns; your terminal's width by default            |
| `-h, --height <rows>`   | Height in rows; 20 by default                                 |
| `--low`, `--high <n>`   | The value axis range                                          |
| `--smooth`              | Line: smooths the lines                                       |
| `--area`                | Line: fills the area below the lines                          |
| `--no-points`           | Line: hides the points                                        |
| `--stack`               | Bar: stacks the series                                        |
| `--horizontal`          | Bar: draws horizontal bars                                    |
| `--donut`               | Pie: draws a donut                                            |
| `--no-labels`           | Pie: hides the slice labels                                   |
| `--palette <#hex,…>`    | Series colors, first series first                             |
| `--no-legend`           | Leaves out the legend                                         |
| `--color <mode>`        | `auto`, `truecolor`, `256`, `16` or `none`; `auto` by default |
| `--html`                | Prints HTML instead of text                                   |
| `--standalone`          | With `--html`: a complete page, styles included               |
| `--help`, `--version`   | What you'd expect                                             |

`-h` is the height. Help is `--help`.

Colors follow your terminal: 24-bit when `COLORTERM` says so, 256 colors otherwise, none when the output goes to a file or a pipe, when `NO_COLOR` is set or `TERM` is `dumb`. `FORCE_COLOR` (`0` to `3`) overrides that, and `--color` overrides everything.

## In your CLI tool

`lineChart()`, `barChart()` and `pieChart()` take the data and options of Chartist's presets, plus a size in columns and rows, and return the chart as a string:

```ts
import { detectColorMode, legend, lineChart } from '@chartist-js/terminal';

const data = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [
    { name: 'Visitors', data: [12, 9, 7, 8, 5] },
    { name: 'Sign-ups', data: [2, 1, 3.5, 7, 3] }
  ]
};
const color = detectColorMode(process.stdout, process.env);

console.log(
  lineChart(data, {
    columns: 60,
    rows: 14,
    showArea: true,
    lineSmooth: true,
    color
  })
);
console.log(legend(data, { columns: 60, color }));
```

The Chartist options work as they do in the browser: `stackBars`, `horizontalBars`, `low` and `high`, `axisY.labelInterpolationFnc`, `donut` and the others. The terminal options are:

- `columns` and `rows`: the size in cells, 80 × 20 by default;
- `color`: `truecolor` (default), `256`, `16` or `none` for plain text;
- `palette`: series colors as hex, first series first, Chartist's colors by default;
- `format`: `text` (default) or `html`.

`detectColorMode(stream, env)` picks the color mode the way the command does; pass it `process.stdout` and `process.env`.

### Any chart, any scene

The chart functions are shortcuts. For a composed chart, or a scene a plugin changed, lay it out with `terminalSize()` and render it yourself:

```ts
import { barChartConfig, toScene } from 'chartist';
import { renderToTerminal, terminalSize } from '@chartist-js/terminal';

const scene = toScene(
  barChartConfig({ labels: ['Q1', 'Q2', 'Q3'], series: [[5, 4, 3]] }),
  terminalSize(40, 10)
);
console.log(renderToTerminal(scene, { color: 'none' }));
```

A cell stands for 8 × 16 px, so a braille dot is 4 × 4 px and circles stay round; `terminalSize()` measures text one cell per character, so labels land on the character grid. Nodes a plugin adds are drawn by their element: `line` and `path` as lines, `circle` as a point, `text` as a label.

## HTML output

`renderToHtml(scene)`, or `format: 'html'`, gives the same chart as a `pre` element with classes instead of colors: `ct-series-a`, `ct-grid`, `ct-label` and so on. Load the stylesheet to color it:

```ts
import '@chartist-js/terminal/styles.css';
```

Every character sits in a cell 0.6 × 1 em, and the stylesheet brings a small font of its own (embedded, under 5 kB) for the braille dots, the grid and the bar blocks, drawn to fill a cell edge to edge. Fonts on the reader's system rarely have all of those, so the text art looks the same in every browser. Letters and digits use a monospace font: JetBrains Mono when the page loads it, else the system's. The stylesheet reads Chartist's custom properties (`--ct-series-a` to `--ct-series-o`, `--ct-grid-color`, `--ct-label-color`), so your Chartist theme colors the text art too. `ct-cli --html --standalone` writes a complete page.

## Fonts

In a terminal, braille and box-drawing characters need a font that has them. Most terminal fonts do; on Windows, Cascadia Mono works. If the dots look scattered or the grid has gaps, your font is missing them. HTML output brings its own font for them, so it doesn't depend on the reader's fonts.

## Limits

- Line, bar and pie charts, and the nodes listed above. Other layers draw what their nodes are made of, or nothing.
- Each character of a label is one cell, so wide characters (CJK, emoji) shift the columns after them.
- No animation, no interaction: it prints a chart and is done.

## License

MIT or WTFPL, like Chartist. See [chartist.dev](https://chartist.dev/docs/terminal-rendering/) for the guide.
