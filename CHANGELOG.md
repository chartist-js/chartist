## 2.2.0 (2026-10-20)

### 🚀 Features

- **chartist:** let layers reserve room outside the drawing area ([#1528](https://github.com/chartist-js/chartist/issues/1528))
- **chartist:** give trend lines their correlation ([d163dae3](https://github.com/chartist-js/chartist/commit/d163dae3))
- **chartist:** add minor grid lines and axis transforms ([c6d9ddc9](https://github.com/chartist-js/chartist/commit/c6d9ddc9))
- ⚠️  **chartist:** move trendLine() and targetLine() to @chartist-js/essentials ([bd1ba658](https://github.com/chartist-js/chartist/commit/bd1ba658))
- **chartist:** let layers annotate what other layers drew ([9c650792](https://github.com/chartist-js/chartist/commit/9c650792))
- **essentials:** add @chartist-js/essentials with axisTitle() ([2899e0ee](https://github.com/chartist-js/chartist/commit/2899e0ee))
- **essentials:** add logAxis ([d931d754](https://github.com/chartist-js/chartist/commit/d931d754))
- **essentials:** add trendLine() and targetLine() ([558c6af6](https://github.com/chartist-js/chartist/commit/558c6af6))
- **essentials:** add valueLabels() ([69c641b4](https://github.com/chartist-js/chartist/commit/69c641b4))
- **essentials:** draw target lines 2 px wide by default ([dc0b1940](https://github.com/chartist-js/chartist/commit/dc0b1940))
- **terminal:** draw quarter-turned text vertically ([665254cf](https://github.com/chartist-js/chartist/commit/665254cf))
- **terminal:** leave out minor grid lines ([b92f92e8](https://github.com/chartist-js/chartist/commit/b92f92e8))
- **tooltips:** add @chartist-js/tooltips ([09388f28](https://github.com/chartist-js/chartist/commit/09388f28))

### 🩹 Fixes

- **chartist:** keep each value's meta with reverseData ([#1534](https://github.com/chartist-js/chartist/issues/1534))

### ⚠️  Breaking Changes

- **chartist:** move trendLine() and targetLine() to @chartist-js/essentials  ([bd1ba658](https://github.com/chartist-js/chartist/commit/bd1ba658))
  trendLine() and targetLine() are no longer exported
  from chartist. Import them from @chartist-js/essentials and load its
  stylesheet:
  import { trendLine, targetLine } from '@chartist-js/essentials';
  import '@chartist-js/essentials/styles.css';
  The types TrendLineOptions, TargetLineOptions, TrendLineContext,
  TargetLineContext and TargetLabelContext move with them. The Sass
  settings $ct-target-line-color, $ct-target-line-width,
  $ct-target-line-dasharray, $ct-trend-line-width,
  $ct-trend-line-dasharray, $ct-class-target-line, $ct-class-target-label
  and $ct-class-trend-line are gone; set the --ct-target-line-* and
  --ct-trend-line-* custom properties instead.

## 2.1.0 (2026-10-18)

### 🚀 Features

- **chartist:** style label spans and donut widths without inline styles ([134ac969](https://github.com/chartist-js/chartist/commit/134ac969))
- **chartist:** render charts to markup for hydration ([783706ef](https://github.com/chartist-js/chartist/commit/783706ef))
- **chartist:** let renderers adopt server markup ([2dadbc73](https://github.com/chartist-js/chartist/commit/2dadbc73))
- **chartist:** take server markup over in chart() ([27384933](https://github.com/chartist-js/chartist/commit/27384933))
- **chartist:** adopt server markup in liveDomRenderer() ([71a9412f](https://github.com/chartist-js/chartist/commit/71a9412f))
- **chartist:** add the chartist/server entry point ([d9e0fa89](https://github.com/chartist-js/chartist/commit/d9e0fa89))
- **chartist:** move renderForHydration() to chartist/server ([15db13c5](https://github.com/chartist-js/chartist/commit/15db13c5))
- ⚠️  **chartist:** move renderToString() to chartist/server ([2dd9a589](https://github.com/chartist-js/chartist/commit/2dd9a589))
- **chartist:** read stylesheets for applyStyles() ([7cb1ce45](https://github.com/chartist-js/chartist/commit/7cb1ce45))
- **chartist:** match selectors against the scene ([5ee9383c](https://github.com/chartist-js/chartist/commit/5ee9383c))
- **chartist:** resolve the cascade and values for applyStyles() ([74ec0eb8](https://github.com/chartist-js/chartist/commit/74ec0eb8))
- **chartist:** add applyStyles() to chartist/server ([c65c501f](https://github.com/chartist-js/chartist/commit/c65c501f))
- **chartist:** computeStyles() and other style engines for applyStyles() ([c9359545](https://github.com/chartist-js/chartist/commit/c9359545))

### 🩹 Fixes

- **chartist:** close empty HTML elements in renderToString() ([d93f24d3](https://github.com/chartist-js/chartist/commit/d93f24d3))
- **chartist:** replace Chartist svgs parsed from HTML ([519bc0eb](https://github.com/chartist-js/chartist/commit/519bc0eb))

### 🔥 Performance

- **chartist:** keep hydration mostly out of the core bundles ([de1c8e2c](https://github.com/chartist-js/chartist/commit/de1c8e2c))

### ⚠️  Breaking Changes

- **chartist:** move renderToString() to chartist/server  ([2dd9a589](https://github.com/chartist-js/chartist/commit/2dd9a589))
  renderToString() is no longer exported from chartist.
  Import it from chartist/server instead:
  import { renderToString } from 'chartist/server';

# 2.0.0 (2026-10-16)

### 🚀 Features

- **chartist:** add the v2 core pipeline, scene graph and renderers ([8dbc5c1c](https://github.com/chartist-js/chartist/commit/8dbc5c1c))
- **chartist:** add the v2 line chart preset with 1.x parity ([ee111143](https://github.com/chartist-js/chartist/commit/ee111143))
- **chartist:** LineChart wraps lineChart; add the compat plugin ([9e86f8c2](https://github.com/chartist-js/chartist/commit/9e86f8c2))
- **chartist:** add the v2 bar chart; BarChart wraps barChart ([d2b61e11](https://github.com/chartist-js/chartist/commit/d2b61e11))
- **chartist:** add the v2 pie chart; PieChart wraps pieChart ([39ee3d40](https://github.com/chartist-js/chartist/commit/39ee3d40))
- **chartist:** add composed charts with multiple axes ([f850f36d](https://github.com/chartist-js/chartist/commit/f850f36d))
- **chartist:** add SVG text labels ([7397a2cb](https://github.com/chartist-js/chartist/commit/7397a2cb))
- **chartist:** add container conditions to responsive options ([69224c3e](https://github.com/chartist-js/chartist/commit/69224c3e))
- **chartist:** theme charts with CSS custom properties ([33c07a4c](https://github.com/chartist-js/chartist/commit/33c07a4c))
- **chartist:** scene nodes typed by role ([45c4c035](https://github.com/chartist-js/chartist/commit/45c4c035))
- **chartist:** typed events, plugins and preset options ([7abe50bd](https://github.com/chartist-js/chartist/commit/7abe50bd))
- **chartist:** typed preset state and render output ([64afe593](https://github.com/chartist-js/chartist/commit/64afe593))
- **chartist:** export domRenderer, estimateText and ResponsiveWatcher ([#1480](https://github.com/chartist-js/chartist/issues/1480), [#1488](https://github.com/chartist-js/chartist/issues/1488))
- **chartist:** chart() gets a ct-chart-* class from its layers ([#1481](https://github.com/chartist-js/chartist/issues/1481))
- **chartist:** preset handles change options and take listeners ([#1477](https://github.com/chartist-js/chartist/issues/1477), [#1472](https://github.com/chartist-js/chartist/issues/1472), [#1478](https://github.com/chartist-js/chartist/issues/1478))
- **chartist:** animation events with compat ([#1489](https://github.com/chartist-js/chartist/issues/1489))
- **chartist:** stepAxis() without ticks steps through the data's labels ([#1475](https://github.com/chartist-js/chartist/issues/1475))
- **chartist:** layers report the extent they need; stacked bars fit their axis ([#1483](https://github.com/chartist-js/chartist/issues/1483))
- **chartist:** deprecate the 1.x API on the root entry ([dca2a58d](https://github.com/chartist-js/chartist/commit/dca2a58d))
- **chartist:** preset configs, series colors and text ascent for renderers ([6a2f020c](https://github.com/chartist-js/chartist/commit/6a2f020c))
- **chartist:** layer refinement and roles for target lines and bands ([ca804c49](https://github.com/chartist-js/chartist/commit/ca804c49))
- **chartist:** target line layer ([565bd2af](https://github.com/chartist-js/chartist/commit/565bd2af))
- **chartist:** band layer ([fc1280c9](https://github.com/chartist-js/chartist/commit/fc1280c9))
- **chartist:** mark values in and out of a band ([5eb30578](https://github.com/chartist-js/chartist/commit/5eb30578))
- **chartist:** extra layers on presets ([d3e88fdc](https://github.com/chartist-js/chartist/commit/d3e88fdc))
- **chartist:** one target line per layer, band edges as values ([13eb8dbf](https://github.com/chartist-js/chartist/commit/13eb8dbf))
- **chartist:** labelTransform, the new name of labelInterpolationFnc ([24b819c6](https://github.com/chartist-js/chartist/commit/24b819c6))
- **chartist:** line breaks in pie labels ([0552f1e0](https://github.com/chartist-js/chartist/commit/0552f1e0))
- **chartist:** offset for bar layers ([8d61374e](https://github.com/chartist-js/chartist/commit/8d61374e))
- **chartist:** label alignment per axis ([e89e27ef](https://github.com/chartist-js/chartist/commit/e89e27ef))
- **chartist:** trend line layer ([6f74442c](https://github.com/chartist-js/chartist/commit/6f74442c))
- **chartist:** hand renderers the previous render, with cleanup hooks ([2df48ea0](https://github.com/chartist-js/chartist/commit/2df48ea0))
- **chartist:** give an area's first point the data of its value ([dcc4d20a](https://github.com/chartist-js/chartist/commit/dcc4d20a))
- **chartist:** SMIL update animations for the live renderer ([c1e717d5](https://github.com/chartist-js/chartist/commit/c1e717d5))
- **chartist:** diffScenes matches two scenes by what their nodes stand for ([03def264](https://github.com/chartist-js/chartist/commit/03def264))
- **chartist:** liveDomRenderer patches a chart's SVG in place ([86f6be93](https://github.com/chartist-js/chartist/commit/86f6be93))
- **chartist:** update animations take 300 ms with ease-out by default ([e5dced16](https://github.com/chartist-js/chartist/commit/e5dced16))
- **chartist:** the core API is stable ([c91ff1ba](https://github.com/chartist-js/chartist/commit/c91ff1ba))
- **compat:** add the 0.x names of plugin scripts to the compat UMD global ([1f2017e0](https://github.com/chartist-js/chartist/commit/1f2017e0))
- **compat:** give converted plugins a 1.x chart of their chart type ([c1748142](https://github.com/chartist-js/chartist/commit/c1748142))
- **compat:** pass the 0.x bounds in the created event ([e3145633](https://github.com/chartist-js/chartist/commit/e3145633))
- **compat:** set up the global for plugin scripts in every compat build ([338121c0](https://github.com/chartist-js/chartist/commit/338121c0))
- **styles:** target line, label and band styles ([144f71bd](https://github.com/chartist-js/chartist/commit/144f71bd))
- **styles:** label and grid defaults for a dark color scheme ([77fa2854](https://github.com/chartist-js/chartist/commit/77fa2854))
- **terminal:** the @chartist-js/terminal package and ct-cli ([72e87afe](https://github.com/chartist-js/chartist/commit/72e87afe))
- **terminal:** shade bands ([a0bfa560](https://github.com/chartist-js/chartist/commit/a0bfa560))
- **terminal:** render text art as a DOM element ([2dc57f0d](https://github.com/chartist-js/chartist/commit/2dc57f0d))
- **terminal:** the API is stable ([99ff918e](https://github.com/chartist-js/chartist/commit/99ff918e))

### 🩹 Fixes

- **chartist:** make typecheck pass with TypeScript 5.9 ([01609698](https://github.com/chartist-js/chartist/commit/01609698))
- **chartist:** align the HTML labels of composed charts ([461c8486](https://github.com/chartist-js/chartist/commit/461c8486))
- **chartist:** resolve VISUAL_SNAPSHOTS from the working directory ([77c40e03](https://github.com/chartist-js/chartist/commit/77c40e03))
- **chartist:** let CSS set the donut width unless donutWidth is given ([#1474](https://github.com/chartist-js/chartist/issues/1474))
- **chartist:** donut labels follow labelPosition, overlap uses drawn text ([#1485](https://github.com/chartist-js/chartist/issues/1485), [#478](https://github.com/chartist-js/chartist/issues/478))
- **chartist:** Svg#remove() returns the parent it had ([#1490](https://github.com/chartist-js/chartist/issues/1490))
- **chartist:** measure text in the container's document ([ece6f550](https://github.com/chartist-js/chartist/commit/ece6f550))
- **chartist:** write px for numeric sizes in the size probe's style ([#1482](https://github.com/chartist-js/chartist/issues/1482))
- **chartist:** off(name) leaves the listeners of plugins alone ([#1486](https://github.com/chartist-js/chartist/issues/1486))
- **chartist:** roundWithPrecision rounds to whole numbers with 0 digits ([#1470](https://github.com/chartist-js/chartist/issues/1470))
- **chartist:** fixedScaleAxis with divisor puts a tick at high ([#1022](https://github.com/chartist-js/chartist/issues/1022))
- **chartist:** an axis's own low and high win over the reference value ([#1476](https://github.com/chartist-js/chartist/issues/1476))
- **chartist:** cartesianAxes({ x, y }) has the list form's defaults ([#1484](https://github.com/chartist-js/chartist/issues/1484))
- **chartist:** accumulate-relative stacks negative values down with an axis that fits ([#1473](https://github.com/chartist-js/chartist/issues/1473), [#1469](https://github.com/chartist-js/chartist/issues/1469))
- **chartist:** connect descending x values with monotone smoothing ([#1038](https://github.com/chartist-js/chartist/issues/1038))
- **chartist:** treat { x, y: null } as a hole in step and simple ([#1040](https://github.com/chartist-js/chartist/issues/1040))
- **chartist:** repair a value range that chart-level low or high empties ([#1057](https://github.com/chartist-js/chartist/issues/1057))
- **chartist:** size labels by the next tick even at position 0 ([#1471](https://github.com/chartist-js/chartist/issues/1471))
- **chartist:** apply a line chart's top-level referenceValue ([#1505](https://github.com/chartist-js/chartist/issues/1505))
- **chartist:** make SvgPath round, split, join, parse and transform consistently ([#1491](https://github.com/chartist-js/chartist/issues/1491))
- **chartist:** drop the stray xmlns attribute from HTML label spans ([#1217](https://github.com/chartist-js/chartist/issues/1217))
- **chartist:** schedule the 1.x classes' first render after the target check ([#1504](https://github.com/chartist-js/chartist/issues/1504))
- **chartist:** use the container's document and window ([#1492](https://github.com/chartist-js/chartist/issues/1492))
- **chartist:** make a detach() during the first render stick ([#929](https://github.com/chartist-js/chartist/issues/929))
- **chartist:** scale charts into the printed box ([#118](https://github.com/chartist-js/chartist/issues/118))
- **chartist:** stop setting xmlns on Svg.foreignObject content ([4c053b22](https://github.com/chartist-js/chartist/commit/4c053b22))
- **chartist:** merge an object option over a number ([#842](https://github.com/chartist-js/chartist/issues/842), [#903](https://github.com/chartist-js/chartist/issues/903), [#876](https://github.com/chartist-js/chartist/issues/876))
- **chartist:** draw a full-circle slice around the centre ([#1302](https://github.com/chartist-js/chartist/issues/1302))
- **chartist:** lay out a donut for the ring width the stylesheet draws ([#1493](https://github.com/chartist-js/chartist/issues/1493))
- **chartist:** colour series p to z ([#1456](https://github.com/chartist-js/chartist/issues/1456))
- **chartist:** set inline styles through the CSSOM ([9cdeb816](https://github.com/chartist-js/chartist/commit/9cdeb816))
- **chartist:** check element and attribute names in renderToString() ([e89640e6](https://github.com/chartist-js/chartist/commit/e89640e6))
- **chartist:** hand renderers the previous render's labels ([b72662b3](https://github.com/chartist-js/chartist/commit/b72662b3))
- **chartist:** key the built-in keyframes with each scene's labels ([b8ed7e38](https://github.com/chartist-js/chartist/commit/b8ed7e38))
- **chartist:** drop update animations that didn't start ([a071e9d9](https://github.com/chartist-js/chartist/commit/a071e9d9))
- **compat:** set chart.svg on the 1.x classes before the draw events ([4bc0433c](https://github.com/chartist-js/chartist/commit/4bc0433c))
- **terminal:** keep the HTML columns in any font ([86c74b50](https://github.com/chartist-js/chartist/commit/86c74b50))
- **terminal:** a font of its own for the HTML text art ([a88b8b5a](https://github.com/chartist-js/chartist/commit/a88b8b5a))
- **terminal:** draw a replaced node by its element ([d696aaeb](https://github.com/chartist-js/chartist/commit/d696aaeb))
- **terminal:** draw circles at their radius ([913a32ca](https://github.com/chartist-js/chartist/commit/913a32ca))

## 2.0.0-rc.3 (2026-10-16)

### 🚀 Features

- **chartist:** layer refinement and roles for target lines and bands ([ca804c49](https://github.com/chartist-js/chartist/commit/ca804c49))
- **chartist:** target line layer ([565bd2af](https://github.com/chartist-js/chartist/commit/565bd2af))
- **chartist:** band layer ([fc1280c9](https://github.com/chartist-js/chartist/commit/fc1280c9))
- **chartist:** mark values in and out of a band ([5eb30578](https://github.com/chartist-js/chartist/commit/5eb30578))
- **chartist:** extra layers on presets ([d3e88fdc](https://github.com/chartist-js/chartist/commit/d3e88fdc))
- **chartist:** one target line per layer, band edges as values ([13eb8dbf](https://github.com/chartist-js/chartist/commit/13eb8dbf))
- **chartist:** labelTransform, the new name of labelInterpolationFnc ([24b819c6](https://github.com/chartist-js/chartist/commit/24b819c6))
- **chartist:** line breaks in pie labels ([0552f1e0](https://github.com/chartist-js/chartist/commit/0552f1e0))
- **chartist:** offset for bar layers ([8d61374e](https://github.com/chartist-js/chartist/commit/8d61374e))
- **chartist:** label alignment per axis ([e89e27ef](https://github.com/chartist-js/chartist/commit/e89e27ef))
- **chartist:** trend line layer ([6f74442c](https://github.com/chartist-js/chartist/commit/6f74442c))
- **styles:** target line, label and band styles ([144f71bd](https://github.com/chartist-js/chartist/commit/144f71bd))
- **styles:** label and grid defaults for a dark color scheme ([77fa2854](https://github.com/chartist-js/chartist/commit/77fa2854))
- **terminal:** shade bands ([a0bfa560](https://github.com/chartist-js/chartist/commit/a0bfa560))
- **terminal:** render text art as a DOM element ([2dc57f0d](https://github.com/chartist-js/chartist/commit/2dc57f0d))

### 🩹 Fixes

- **chartist:** set inline styles through the CSSOM ([9cdeb816](https://github.com/chartist-js/chartist/commit/9cdeb816))
- **chartist:** check element and attribute names in renderToString() ([e89640e6](https://github.com/chartist-js/chartist/commit/e89640e6))
- **terminal:** draw circles at their radius ([913a32ca](https://github.com/chartist-js/chartist/commit/913a32ca))

## 2.0.0-rc.2 (2026-10-15)

### 🚀 Features

- **chartist:** deprecate the 1.x API on the root entry ([dca2a58d](https://github.com/chartist-js/chartist/commit/dca2a58d))
- **chartist:** preset configs, series colors and text ascent for renderers ([6a2f020c](https://github.com/chartist-js/chartist/commit/6a2f020c))
- **terminal:** the @chartist-js/terminal package and ct-cli ([72e87afe](https://github.com/chartist-js/chartist/commit/72e87afe))

### 🩹 Fixes

- **chartist:** connect descending x values with monotone smoothing ([#1038](https://github.com/chartist-js/chartist/issues/1038))
- **chartist:** treat { x, y: null } as a hole in step and simple ([#1040](https://github.com/chartist-js/chartist/issues/1040))
- **chartist:** repair a value range that chart-level low or high empties ([#1057](https://github.com/chartist-js/chartist/issues/1057))
- **chartist:** size labels by the next tick even at position 0 ([#1471](https://github.com/chartist-js/chartist/issues/1471))
- **chartist:** apply a line chart's top-level referenceValue ([#1505](https://github.com/chartist-js/chartist/issues/1505))
- **chartist:** make SvgPath round, split, join, parse and transform consistently ([#1491](https://github.com/chartist-js/chartist/issues/1491))
- **chartist:** drop the stray xmlns attribute from HTML label spans ([#1217](https://github.com/chartist-js/chartist/issues/1217))
- **chartist:** schedule the 1.x classes' first render after the target check ([#1504](https://github.com/chartist-js/chartist/issues/1504))
- **chartist:** use the container's document and window ([#1492](https://github.com/chartist-js/chartist/issues/1492))
- **chartist:** make a detach() during the first render stick ([#929](https://github.com/chartist-js/chartist/issues/929))
- **chartist:** scale charts into the printed box ([#118](https://github.com/chartist-js/chartist/issues/118))
- **chartist:** stop setting xmlns on Svg.foreignObject content ([4c053b22](https://github.com/chartist-js/chartist/commit/4c053b22))
- **chartist:** merge an object option over a number ([#842](https://github.com/chartist-js/chartist/issues/842), [#903](https://github.com/chartist-js/chartist/issues/903), [#876](https://github.com/chartist-js/chartist/issues/876))
- **chartist:** draw a full-circle slice around the centre ([#1302](https://github.com/chartist-js/chartist/issues/1302))
- **chartist:** lay out a donut for the ring width the stylesheet draws ([#1493](https://github.com/chartist-js/chartist/issues/1493))
- **chartist:** colour series p to z ([#1456](https://github.com/chartist-js/chartist/issues/1456))
- **terminal:** keep the HTML columns in any font ([86c74b50](https://github.com/chartist-js/chartist/commit/86c74b50))
- **terminal:** a font of its own for the HTML text art ([a88b8b5a](https://github.com/chartist-js/chartist/commit/a88b8b5a))
- **terminal:** draw a replaced node by its element ([d696aaeb](https://github.com/chartist-js/chartist/commit/d696aaeb))

## 2.0.0-rc.1 (2026-10-14)

### 🚀 Features

- **chartist:** add the v2 core pipeline, scene graph and renderers ([8dbc5c1c](https://github.com/chartist-js/chartist/commit/8dbc5c1c))
- **chartist:** add the v2 line chart preset with 1.x parity ([ee111143](https://github.com/chartist-js/chartist/commit/ee111143))
- **chartist:** LineChart wraps lineChart; add the compat plugin ([9e86f8c2](https://github.com/chartist-js/chartist/commit/9e86f8c2))
- **chartist:** add the v2 bar chart; BarChart wraps barChart ([d2b61e11](https://github.com/chartist-js/chartist/commit/d2b61e11))
- **chartist:** add the v2 pie chart; PieChart wraps pieChart ([39ee3d40](https://github.com/chartist-js/chartist/commit/39ee3d40))
- **chartist:** add composed charts with multiple axes ([f850f36d](https://github.com/chartist-js/chartist/commit/f850f36d))
- **chartist:** add SVG text labels ([7397a2cb](https://github.com/chartist-js/chartist/commit/7397a2cb))
- **chartist:** add container conditions to responsive options ([69224c3e](https://github.com/chartist-js/chartist/commit/69224c3e))
- **chartist:** theme charts with CSS custom properties ([33c07a4c](https://github.com/chartist-js/chartist/commit/33c07a4c))
- **chartist:** scene nodes typed by role ([45c4c035](https://github.com/chartist-js/chartist/commit/45c4c035))
- **chartist:** typed events, plugins and preset options ([7abe50bd](https://github.com/chartist-js/chartist/commit/7abe50bd))
- **chartist:** typed preset state and render output ([64afe593](https://github.com/chartist-js/chartist/commit/64afe593))
- **chartist:** export domRenderer, estimateText and ResponsiveWatcher ([#1480](https://github.com/chartist-js/chartist/issues/1480), [#1488](https://github.com/chartist-js/chartist/issues/1488))
- **chartist:** chart() gets a ct-chart-* class from its layers ([#1481](https://github.com/chartist-js/chartist/issues/1481))
- **chartist:** preset handles change options and take listeners ([#1477](https://github.com/chartist-js/chartist/issues/1477), [#1472](https://github.com/chartist-js/chartist/issues/1472), [#1478](https://github.com/chartist-js/chartist/issues/1478))
- **chartist:** animation events with compat ([#1489](https://github.com/chartist-js/chartist/issues/1489))
- **chartist:** stepAxis() without ticks steps through the data's labels ([#1475](https://github.com/chartist-js/chartist/issues/1475))
- **chartist:** layers report the extent they need; stacked bars fit their axis ([#1483](https://github.com/chartist-js/chartist/issues/1483))
- **compat:** add the 0.x names of plugin scripts to the compat UMD global ([1f2017e0](https://github.com/chartist-js/chartist/commit/1f2017e0))
- **compat:** give converted plugins a 1.x chart of their chart type ([c1748142](https://github.com/chartist-js/chartist/commit/c1748142))
- **compat:** pass the 0.x bounds in the created event ([e3145633](https://github.com/chartist-js/chartist/commit/e3145633))
- **compat:** set up the global for plugin scripts in every compat build ([338121c0](https://github.com/chartist-js/chartist/commit/338121c0))

### 🩹 Fixes

- **chartist:** make typecheck pass with TypeScript 5.9 ([01609698](https://github.com/chartist-js/chartist/commit/01609698))
- **chartist:** align the HTML labels of composed charts ([461c8486](https://github.com/chartist-js/chartist/commit/461c8486))
- **chartist:** resolve VISUAL_SNAPSHOTS from the working directory ([77c40e03](https://github.com/chartist-js/chartist/commit/77c40e03))
- **chartist:** let CSS set the donut width unless donutWidth is given ([#1474](https://github.com/chartist-js/chartist/issues/1474))
- **chartist:** donut labels follow labelPosition, overlap uses drawn text ([#1485](https://github.com/chartist-js/chartist/issues/1485), [#478](https://github.com/chartist-js/chartist/issues/478))
- **chartist:** Svg#remove() returns the parent it had ([#1490](https://github.com/chartist-js/chartist/issues/1490))
- **chartist:** measure text in the container's document ([ece6f550](https://github.com/chartist-js/chartist/commit/ece6f550))
- **chartist:** write px for numeric sizes in the size probe's style ([#1482](https://github.com/chartist-js/chartist/issues/1482))
- **chartist:** off(name) leaves the listeners of plugins alone ([#1486](https://github.com/chartist-js/chartist/issues/1486))
- **chartist:** roundWithPrecision rounds to whole numbers with 0 digits ([#1470](https://github.com/chartist-js/chartist/issues/1470))
- **chartist:** fixedScaleAxis with divisor puts a tick at high ([#1022](https://github.com/chartist-js/chartist/issues/1022))
- **chartist:** an axis's own low and high win over the reference value ([#1476](https://github.com/chartist-js/chartist/issues/1476))
- **chartist:** cartesianAxes({ x, y }) has the list form's defaults ([#1484](https://github.com/chartist-js/chartist/issues/1484))
- **chartist:** accumulate-relative stacks negative values down with an axis that fits ([#1473](https://github.com/chartist-js/chartist/issues/1473), [#1469](https://github.com/chartist-js/chartist/issues/1469))
- **compat:** set chart.svg on the 1.x classes before the draw events ([4bc0433c](https://github.com/chartist-js/chartist/commit/4bc0433c))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.5.0](https://github.com/chartist-js/chartist/compare/v1.4.0...v1.5.0) (2025-09-30)

### Features

- support for viewport in SVG only providing width and height ([#1403](https://github.com/chartist-js/chartist/issues/1403)) ([752f0a7](https://github.com/chartist-js/chartist/commit/752f0a780cbff77e18ed43c1f1f9b9b4c63507b6))

## [1.4.0](https://github.com/chartist-js/chartist/compare/v1.3.1...v1.4.0) (2025-06-27)

### Features

- add option to prevent overlapping labels ([#1428](https://github.com/chartist-js/chartist/issues/1428)) ([552bfca](https://github.com/chartist-js/chartist/commit/552bfca452c97a2733bbf813832cefb6dd10fddc))

### [1.3.1](https://github.com/chartist-js/chartist/compare/v1.3.0...v1.3.1) (2025-04-07)

### Bug Fixes

- add an error message when chart container is not found ([#1392](https://github.com/chartist-js/chartist/issues/1392)) ([6ee19be](https://github.com/chartist-js/chartist/commit/6ee19be3a1936a3c1761aa2f3651683a02495543))
- prototype pollution vulnerability in extend (CVE-2024-45435) ([#1433](https://github.com/chartist-js/chartist/issues/1433)) ([5a24b93](https://github.com/chartist-js/chartist/commit/5a24b933d2ab4a97c30a24e9fa1da21c9c8083f1)), closes [#1427](https://github.com/chartist-js/chartist/issues/1427)
- use clientWidth/clientHeight instead of getBoundingClientRect ([#1395](https://github.com/chartist-js/chartist/issues/1395)) ([1067900](https://github.com/chartist-js/chartist/commit/10679003a8cec24f9c1f559bdd0c241ec02319a4))

## [1.3.0](https://github.com/chartist-js/chartist/compare/v1.2.1...v1.3.0) (2022-11-03)

### Features

- accumulate-relative stacked bar chart stack mode ([#1375](https://github.com/chartist-js/chartist/issues/1375)) ([ce13067](https://github.com/chartist-js/chartist/commit/ce13067acec9cee050af979d323dae5e728292c4)), closes [#1167](https://github.com/chartist-js/chartist/issues/1167)

### Bug Fixes

- add dist exports ([#1374](https://github.com/chartist-js/chartist/issues/1374)) ([1438bad](https://github.com/chartist-js/chartist/commit/1438bad5b8754fe0744c4c1c8540c08a4c4e6862)), closes [#1368](https://github.com/chartist-js/chartist/issues/1368)
- add missing default for text-line-height ([#1373](https://github.com/chartist-js/chartist/issues/1373)) ([f94e559](https://github.com/chartist-js/chartist/commit/f94e559c2414d17002ee52421b860d91b6eae0af))

### [1.2.1](https://github.com/chartist-js/chartist/compare/v1.2.0...v1.2.1) (2022-10-05)

### Bug Fixes

- data normalization with alignment ([#1365](https://github.com/chartist-js/chartist/issues/1365)) ([fe11d2f](https://github.com/chartist-js/chartist/commit/fe11d2f6d9e55455286bc34d3eed93b587f1313c)), closes [#1235](https://github.com/chartist-js/chartist/issues/1235)
- reverse data correctly [#1250](https://github.com/chartist-js/chartist/issues/1250) ([#1364](https://github.com/chartist-js/chartist/issues/1364)) ([0223b1f](https://github.com/chartist-js/chartist/commit/0223b1ff2c69a919e3d776b58fb9b5cc96654987))

## [1.2.0](https://github.com/chartist-js/chartist/compare/v1.1.3...v1.2.0) (2022-10-03)

### Features

- dist scss styles sources ([#1362](https://github.com/chartist-js/chartist/issues/1362)) ([d0efcb0](https://github.com/chartist-js/chartist/commit/d0efcb00aa45e1d4611a16472da758ead8148f7b))
- remove legacy styles fallbacks ([#1363](https://github.com/chartist-js/chartist/issues/1363)) ([831673f](https://github.com/chartist-js/chartist/commit/831673f9dff080d1c762db2bc5da397eb0b55ab9))

### Bug Fixes

- SvgPath.parse fails on negative values ([#1360](https://github.com/chartist-js/chartist/issues/1360)) ([cf6831d](https://github.com/chartist-js/chartist/commit/cf6831d2f7e08dddb497d6b7ce5354e0976779ab))

### [1.1.3](https://github.com/chartist-js/chartist/compare/v1.1.2...v1.1.3) (2022-09-23)

### Bug Fixes

- B and I series have the same color value ([#1356](https://github.com/chartist-js/chartist/issues/1356)) ([6f5ad92](https://github.com/chartist-js/chartist/commit/6f5ad92795755b1e50775cf7b837d20700f3e334))
- label position fix ([#1357](https://github.com/chartist-js/chartist/issues/1357)) ([fbc13e2](https://github.com/chartist-js/chartist/commit/fbc13e22c334a46e9097f7115c1616fc0cc1077d)), closes [#1266](https://github.com/chartist-js/chartist/issues/1266)

### [1.1.2](https://github.com/chartist-js/chartist/compare/v1.1.1...v1.1.2) (2022-08-14)

### Bug Fixes

- add id field to AnimationDefinition interface ([#1351](https://github.com/chartist-js/chartist/issues/1351)) ([4012c43](https://github.com/chartist-js/chartist/commit/4012c43942e2dd243a4e5983f25bf4c22ea42d91))

### [1.1.1](https://github.com/chartist-js/chartist/compare/v1.1.0...v1.1.1) (2022-08-13)

### Bug Fixes

- add styles to side effects ([#1350](https://github.com/chartist-js/chartist/issues/1350)) ([053bf97](https://github.com/chartist-js/chartist/commit/053bf978d825c6285da93af3558b8c0667676212))

## [1.1.0](https://github.com/chartist-js/chartist/compare/v1.0.0...v1.1.0) (2022-08-13)

### Features

- add ResponsiveOptions type helper, add generic type to Svg#getNode method ([#1347](https://github.com/chartist-js/chartist/issues/1347)) ([7dd3ba2](https://github.com/chartist-js/chartist/commit/7dd3ba2992751976bfdff9603021afa8fad140d8))

### Bug Fixes

- add Date type to members of Multi type ([#1348](https://github.com/chartist-js/chartist/issues/1348)) ([9bd8679](https://github.com/chartist-js/chartist/commit/9bd867958dd457b26cb697cf6b4d101944443755))

## [1.0.0](https://github.com/chartist-js/chartist/compare/v0.11.4...v1.0.0) (2022-08-08)

### ⚠ BREAKING CHANGES

- [new exports names](https://github.com/chartist-js/chartist#esm)
- methods in EventEmitter were renamed: `addEventHandler` -> `on`, `removeEventHandler` -> `off` ([73e1c44](https://github.com/chartist-js/chartist/commit/73e1c44dc1abab4938dc623a3dc22caad92af6a8))

### Features

- [TypeScript support](https://github.com/chartist-js/chartist#typescript) ([ee4106e](https://github.com/chartist-js/chartist/commit/ee4106e04f3c081805dd79675340378f895c8290))
- [ESM support](https://github.com/chartist-js/chartist#esm)

v0.11.0 - 11 Apr 2017

- Added CSP compatibility by using CSSOM instead of style attributes (Francisco Silva)
- Added feature to render pie / donut chart as solid shape, allowing outlines (Sergey Kovalyov, Chris Carson)
- Fixed XMLNS for foreignObjet content (Alfredo Matos)

v0.10.0 - 23 Oct 2016
---------------------

- Added dominant-baseline styles for pie and donut charts (Gion Kunz)
- Added public getNode on SVG api (Gion Kunz)
- Added support for bar charts to have auto narrowing on AutoScaleAxis by overriding referenceValue (Jonathan Dumaine)
- Added amdModuleId for better integration into webpack (Chris)
- Added grid background to line and bar chart (hansmaad)
- Added new LTS node version and included NPM run scripts (Gion Kunz)
- Added correct meta data emission in events (Gion Kunz)
- Fixed rounding issues where raw value was added instead of rounded (Gion Kunz)
- Fixed step axis issue with axis stretch and series count 0 (Gion Kunz)
- Fixed label position of single series pie / donut charts to be centered (Gion Kunz)
- Fixed order or drawing pie and donut slices (Gion Kunz)
- Fixed calculations of stepLength to only stretch ticksLength if > 1 (Alexander van Eck)
- Fixed better handling of axisOptions.position and fallback to 'end' position (Alexander van Eck)
- Fixed handling of holes in interpolation for multi-value series (James Watmuff)
- Fixed function StepAxis() returning NaN (Joao Milton)
- Fixed NaN issues in SVG when rendering Pie chart with only 0s (Alexander van Eck)
- Fixed infinite loop in getBounds with a more robust increment (hansmaad)
- Fixed performance of Chartist.extend (cheese83)
- Fixed license reference issues in package.json (Jacob Quant)
- Cleanup of data normalization changes and allows Date objects and booleans as values (Gion Kunz)
- Cleanup refactoring for data management and normalization (Gion Kunz)

v0.9.8 - 22 Jun 2016
--------------------

- Added monotone cubic interpolation which is now the default interpolation for line charts (James Watmuff)
- Update zoom plugin to 0.2.1 (hansmaad)
- Bugfix: Prevent infinite loop in getBounds if bounds.valueRange is very small, fixes #643 (hansmaad)
- Bugfix: Correct update events during media changes (Rory Hunter)
- Bugfix: prevent negative value for foreignObject width attribute (Jose Ignacio)
- Fixed example line chart in getting started documentation (Robin Edbom)
- Updated development pipeline dependencies (Gion Kunz)
- Updated chartist tooltip plugin and example styles (Gion Kunz)
- Fixed WTFPL License issue (Gion Kunz)

v0.9.7 - 23 Feb 2016
--------------------

- Fixed bug with label and grid rendering on axis, fixes #621

v0.9.6 - 22 Feb 2016
--------------------

- Added dual licensing WTFPL and MIT, built new version (Gion Kunz)
- Adding unminified CSS to dist output, fixes #506 (Gion Kunz)
- Refactored namespaced attribute handling, fixes #584 (Gion Kunz)
- Allow charts to be created without data and labels, fixes #598, fixes #588, fixes #537, fixes #425 (Gion Kunz> <Carlos Morales)
- Removed onlyInteger setting from default bar chart settings, fixes #423 (Gion Kunz)
- Removed serialization of values on line chart areas, fixes #424 (Gion Kunz)
- Removed workaround and fallback for SVG element width and height calculations, fixes #592 (Gion Kunz)
- Render 0 in ct:value attribute for line graphs (Paul Salaets)
- Allow empty pie chart values to be ignored (Stephen)
- Fix #527 Pie render issue with small angles. (hansmaad)
- Small fix for stacked bars with 'holes' in the data (medzes)

v0.9.5 - 14 Nov 2015
--------------------

- Added 'fillHoles' option for line graphs, which continues the line smoothly through data holes (Thanks to Joshua Warner !)
- Added option to use relative donut width values (Thanks to hansmaad !)
- Added stackMode for bar charts to create overlapping charts or bipolar stacked charts (Thanks to Douglas Mak !)
- Fixed issue with unordered ticks in fixed scale axis, fixes #411 (Thanks Carlos !)
- Fixed left navigation in examples was not using valid anchors, fixes #514 (Thanks Carlos !)
- Internal refactoring and cleanup (Thanks to hansmaad !)

v0.9.4 - 06 Aug 2015
--------------------

- Added axes to all events where they are available in context to provide better API convenience when developing plugins
- Consider additional parameters of SVG elem when called with DOM node

v0.9.3 - 05 Aug 2015
--------------------

- Added better check for undefined values in bar chart, fixes #400
- Fixed issue with SVG feature check within Svg module (Thanks to Markus Gruber !)

v0.9.2 - 02 Aug 2015
--------------------

- Enabled bar charts to use dynamic axes fixes #363, fixes #355
- Added axis title plugin to plugins page (Thanks to @alexstanbury !)
- Added a label group for Pie charts to prevent occlusion by slices (Thanks to Anthony Jimenez!)
- Added better handling for multi values when writing custom attributes, fixes #379

v0.9.1 - 24 Jun 2015
--------------------

- Fixed bug with areaBase narrowing process in area charts, fixes #364
- Fixed bug on bar chart where wrong offset was used (axis offset), fixes #347 (Thanks to @amsardesai !)
- Fixed bug with namespace attributes that caused duplication of SVG element on updates in old browsers (Thanks to @radist2s !)

v0.9.0 - 10 Jun 2015
--------------------

- Major refactoring of axis and projection code, added possibility to configure axes when creating a chart
- Added areaBase to series options override in line chart, fixes #342
- Throwing up in infinite loop for edge cases and during development
- Documentation: Added documentation for axis configuration and getting started guide for custom axes

v0.8.3 - 07 Jun 2015
--------------------

- Greatly reduced CSS selector complexity and split slice into slice-pie and slice-donut
- Added more robust detach mechanism that takes async initialization into account
- Added better handling for area drawing with segmented paths, fixes #340
- Documentation: Added getting started guide for styling charts

v0.8.2 - 02 Jun 2015
--------------------

- Fixed broken release 0.8.1

v0.8.1 - 02 Jun 2015 (BROKEN!)
------------------------------

- Added new option labelPosition for Pie charts to have better control over label placement, fixes #315
- Added default styles for alignment-baseline
- Added better support for undefined values in bar charts
- Refactored getHighLow to use recursion in order to enable more dynamic array structures and better edge case management
- Fixed issue with Chartist.rho that caused endless loop when called with 1, fixes #318

v0.8.0 - 10 May 2015
--------------------

- Added new option to bar charts to allow a series distribution and use a simple one dimensional array for data (#209)
- Added option for label placement and refactored label positioning code (#302)
- Added option to only use integer numbers in linear scale axis (#77)
- Added possibility to add series configuration on line chart to override specific options on series level (#289, #168)
- Added functionality to handle holes in line charts (#294)
- Added step interpolation for line charts
- Added default styles for bar and horizontal bar labels that make more sense (#303)
- Added series data and meta information to events (#293)
- Changed line chart behavior to draw points from interpolated values (#295)
- Removed restriction to SVGElements so Chartist.Svg can be used for HTML DOM elements (#261)
- Refactored and simplified axis creation, also includes updated CSS label handling
- Refactored getDataArray for simplification and fixed type conversion issue with data arrays for pie charts
- Centralized high/low calculations in getHighLow() method and added support for empty charts. Thanks @scthi !
- Fixed bug in pie chart where meta was only added when series name was specified
- Fixed bug where special condition to check single value should also include object value notation (#265)
- Fixed bug with Chartist.extend when null property is extended
- Fixed bug with Firefox dying with a DOM exception when calling getBBox() on an invisible node. Thanks @scthi !
- Switched from object literal accessor definition to regular function (#278)

v0.7.4 - 19 Apr 2015
--------------------

- Enhanced documentation site (Accessibility plugin, live example eval, fixed path to Sass settings, better HTML example of how to include Chartist, example how to include multiple charts on one page)
- Added Arc to Chartist.Svg.Path
- Refactored Chartist.Pie to make use of Svg.Path and expose path in events
- Closing path of Pie if not a donut for correct strokes
- Exposing axis objects in created event
- Changed grid event to use axis object instead of string

v0.7.3 - 27 Feb 2015
--------------------

- Fixed bugs in the chart.update method
- Fixed rounding precision issues in order of magnitude calculation
- Fixed bug in Chartist.extend which caused merge problems from object properties into non-objects
- Added possibility to use chartPadding with a padding object that contains top, right, bottom and left properties

v0.7.2 - 12 Feb 2015
--------------------

- Added new line smoothing / interpolation module for configurable line smoothing
- Added simple line smoothing. Thanks @danieldiekmeier !
- Removed some unused internal code

v0.7.1 - 02 Feb 2015
--------------------

- Bug fix where some files where not included in dist version of Chartist which made v0.7.0 unusable.

v0.7.0 - 01 Feb 2015
--------------------

- This version introduces a new option in the bar charts to draw them horizontally
- Underlying changes for axis model that allows flexible value projection and removes code duplication
- Added SVG Path API for manipulating SVG paths. This can be used in animations or to transform the output by Chartist further.
- The fullWidth and centerBars options were removed from the bar chart
- Updating chart after options update enables the use of 'print' media query in responsive options to have a quick redraw before printing. This only works in Chrome 40 so far
- Fixed issues with 0 values in series object data notation

v0.6.1 - 23 Jan 2015
--------------------

- Fixed bug that prevented data events to be captured
- Fixed bug with update function called in the same call stack as chart constructor

v0.6.0 - 17 Jan 2015
--------------------

- Added 14 default colors for colored series
- Added data event that allows you to transform the data before it gets rendered in Chartist. This is also useful for plugin authors that would like to create plugins which modify data.
- Possibility to specify meta data in the data object passed to Chartist that will be written to custom attributes into the DOM.
- Possibility to specify options when calling chart.update in order to override the current options with new ones
- Fixed some missing entries in the bower ignore section to exclude the documentation site as well as the grunt tasks
- Fixed issue when Chartist is initialized in a container that already contains SVG

v0.5.0 - 14 Dec 2014
--------------------

- Added new option for line and bar chart to use full width of the chart area by skipping the last grid line
- Added new option for bar chart to create stacked bar charts
- All chart update functions now accepts an optional data parameter that allows to update an existing chart with new data
- Fix for an error when charts get re-constructed on the same element and in the same call stack

v0.4.4 - 11 Dec 2014
--------------------

- Fixed NS_ERROR_FAILURE error in Firefox and added graceful handling of unsupported SMIL animations (i.e. in foreignObjects)

v0.4.3 - 27 Nov 2014
--------------------

- Updated plugin architecture for convenience reasons and better support for modularization

v0.4.2 - 27 Nov 2014
--------------------

- Included first version of Chartist.js Plugin mechanism
- Major refactoring of development stack (thanks @Autarc !)
- Removed unused functions in Chartist.Core

v0.4.1 - 21 Nov 2014
--------------------

- Added more functionality to Chartist.Svg: select child elements, parent, root as well as a Svg list wrapper with delegation functions
- Fixed bug in strip unit
- Added classes to the label and grid gorups
- Added this as return value so calls to chart can be chained up easily

v0.4.0 - 17 Nov 2014
--------------------

- Added new animation API for SMIL animations
- Added possibility to add event handlers with asterisk that will be triggerd on all events including the event name in the cb function
- Added possibility to pass DOM node to SVG constructor so you can wrap existing SVG nodes into a Chartist.Svg element
- Fixed svg recycling on re-creation
- Fixed resize listener detach that wasn't working properly
- Refactored Chartist.Svg to use Chartist.Class
- Including event when line and area is drawn
- Changed default scaleMinSpace to 20 to be more mobile friendly
- Fixed bug with line area base
