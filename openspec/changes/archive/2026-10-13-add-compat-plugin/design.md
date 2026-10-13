# Design

## Context

- **`lineChart()`** renders 1.x output from the v2 core (`add-line-chart`). Grid, label, series, point, line and area nodes carry roles and contexts, and `mount` gives `elementOf(node)`.
- **1.x `LineChart`** (`src/charts/LineChart/LineChart.ts`, `BaseChart.ts`):
  - defers the first render with `setTimeout(0)`;
  - keeps one chart per container (an instances map) and re-renders on window `resize`;
  - `update(data, options, override)` extends the defaults, or the current options when `override` is set;
  - `detach()` stops resize and media listening but leaves the svg in place;
  - emits `data` with its own (mutable) data object, `draw` while building, then `created`;
  - runs plugin functions with the chart instance.
- **Popular 1.x plugins** (tooltip, legend, axis title, point labels) use `chart.on`, `chart.container`, `chart.svg`, `chart.data`, `chart.options` and `chart.update`.
- **`getSeriesOption`** is exported from the 1.x `LineChart` module and is part of the recorded export surface.
- **Author decisions (2026-10-13):**
  - `draw` events come after rendering;
  - 1.x plugins receive the 1.x chart object;
  - the functional API accepts only v2 plugins; the 1.x class API accepts 1.x plugin functions (with `compat`), and `fromLegacyPlugin()` converts a 1.x plugin into a v2 plugin;
  - the legacy surface moves after bar and pie.

## Goals / Non-Goals

**Goals:**

- `new LineChart(...)` behaves like 1.5 for everything the contract suites observe: the 1.x unit tests and `test:api` with compat, `test:visual` without changes to the baseline.
- The compat plugin is the only place with 1.x event semantics. The core gains only generic extension points.

**Non-Goals:**

- Exact 1.x draw timing (elements created one by one), and the 1.x stacking order for elements appended by handlers.
- Bar and pie (step 5).

## Decisions

### D1 A preset controller shared by `lineChart()` and the wrapper

`presets/lineChart.ts` gets an internal `createLineChart(target, data, options, responsiveOptions, plugins)` that returns:

- `handle`;
- `setData(data)`;
- `setOptions(options, override)`, which re-merges with the 1.x rule: defaults, or the current options when `override` is set;
- `options()` and `data()`.

`lineChart()` returns its `handle`. The preset passes `ResolvedConfig.preset = { options, update(data?, options?, override?) }` to the pipeline, an opaque field that the compat plugin reads (1.x options, and 1.x-style updates for the chart object it gives 1.x plugins). On media changes the preset emits a `responsive` event `{ previousOptions, currentOptions }`, a generic v2 event that compat maps to `optionsChanged`.

### D2 Generic core extension points

```ts
interface ChartPlugin {
  name; install(chart, options?);
  provides?: readonly string[];          // custom event names
}
interface ChartHandle { …; emit(name, payload): void; detach(): ChartHandle }
```

- **The functional API accepts only v2 plugins** (author decision 2026-10-13). The `plugins` types allow only plugin objects and `[plugin, options]` pairs. At runtime, a function in `plugins` throws an error that names `fromLegacyPlugin` from `chartist/compat`. This replaces the skip-with-warning from `add-core-pipeline`.
- `emit` rejects phase names. It notifies listeners and `'*'`.
- `on(name)` for one of the six 1.x event names warns once per name and page unless an installed plugin `provides` it. That list of names is the only 1.x knowledge in the core (define-core-architecture D6).
- `detach()`: disconnects the `ResizeObserver` (and, in presets, the media listeners); keeps output and listeners. `destroy()` = `detach()` + remove output + clear listeners.
- _Alternative considered:_ an `adoptPlugin` hook through which a v2 plugin takes over plain-function plugins, plus `ChartConfig.owner` for the object plugins see. Rejected by the author: it mixes 1.x and v2 plugins in the v2 API. Keeping the two plugin kinds apart per API is simpler to explain and leaves the core without function-plugin handling.

### D3 The compat plugin

`src/compat/index.ts` exports:

- `compat`: the v2 plugin `{ name: 'compat', provides: [the six names], install }` that turns on the 1.x events for a chart;
- `fromLegacyPlugin(plugin, options?)`: converts a 1.x plugin function into a v2 plugin (below).

The 1.x events:

- **`data`** (in a `resolve` listener):
  - when `config.data` is a different object than in the previous run, compat emits `data` with `{ type: 'initial' | 'update', data: copy }`. The copy is mutable: plain arrays and objects are copied, other values (meta, `Date`) are kept by reference.
  - The listener returns the config with the copy, so 1.x mutations reach `prepare`.
  - Re-renders on resize don't run `resolve`, and option-only updates keep the data object, so neither emits `data`, as in 1.x.
- **`optionsChanged`:** emitted from the preset's `responsive` event.
- **1.x axes and `chartRect`:**
  - In an observing `layout` listener, compat captures the final area and padding, and builds the 1.x `chartRect` (`x1`, `x2`, `y1`, `y2`, `padding`, `width()`, `height()`).
  - At `mount`, it constructs real 1.x axis instances (`StepAxis` with the labels and `fullWidth`, `AutoScaleAxis` with `high`/`low`, or the configured class) from `presetOptions`, the data normalized with `reverseData`, and that `chartRect`, exactly as 1.x `createChart` does. So `instanceof` checks and `axis.projectValue` work.
- **`draw` and `created`** (in a `mount` listener):
  - Compat walks the scene by role in the 1.x order: per axis, X then Y, for each tick its `grid`, then its `label`; then `gridBackground`; then per series its `point` nodes, the `line` and the `area` nodes, in creation order.
  - It builds the 1.x payloads from the node contexts and `new Svg(elementOf(node))`. `group` is the grids group, the labels group or the series group.
  - Field sets equal 1.5's (the `test:api` events tests check them).
  - `created` follows with `{ chartRect, axisX, axisY, svg: new Svg(svg), options }`.
  - If the output has no `elementOf`/`svg` (a non-DOM renderer), compat throws the specified error.
- **`animationBegin` / `animationEnd`:** emitted when user code passes the chart's `eventEmitter` to `Svg.animate`, as in 1.x. The 1.x chart object's `eventEmitter` is a bridge: `on`/`off` go to the handle, and `emit` goes to `handle.emit`.
- **Once per chart:** compat keeps a `WeakSet` of the handles it is installed on, so `compat` and any number of converted plugins turn the events on only once.

Running 1.x plugins:

- **`fromLegacyPlugin(plugin, options?)`** returns `{ name: plugin.name || 'legacy-plugin', provides: [the six names], install(chart) }`. `install` turns on the 1.x events for the chart, then calls `plugin(chartObject, options)`.
  - For the functional API, `chartObject` is a 1.x-style facade built from the handle and `ResolvedConfig.preset`: `container`, `data`, `options`, `svg` (updated on each mount), `eventEmitter`, `on`, `off`, `update` (1.x semantics through `preset.update`) and `detach`.
- **`compat.legacyPlugin(plugin, options, chartObject)`** does the same with a given chart object. The `LineChart` class uses it to pass itself (D4).

### D4 The `LineChart` wrapper

- **Constructor:**
  - resolves the target synchronously, throwing the 1.x error before scheduling anything (this fixes the 1.5 bug of a timer firing after the throw);
  - detaches the previous instance of the container;
  - schedules `init` with `setTimeout(0)`.
- **Before `init`:** `on`/`off` are queued, and `update` only stores data and options, as in 1.x.
- **Plugins:** the class splits `options.plugins` into v2 plugin objects and 1.x plugin functions.
  - If `compat` is in the list, each function becomes `compat.legacyPlugin(fn, options, this)`, so 1.x plugins receive the `LineChart` instance as `chart`. The class finds `compat` by duck typing (a plugin with a `legacyPlugin` function), so it never imports the compat module and its bundle doesn't grow.
  - Without `compat`, the class skips function plugins with a one-time warning that says to add `compat`.
- **`init`** calls `createLineChart(..., plugins)` with the v2 plugins and the converted ones. A first internal plugin registers the queued listeners, so they receive the first render. `init` then adds the 1.x window `resize` listener.
- **`update(data?, options?, override = false)`:** `setData` and/or `setOptions`, then render.
- **`detach()`:** clears the pending timer, or removes the resize listener and calls `handle.detach()`. It removes the instance from the instances map.
- **Fields:** `container`, `data`, `options` and `svg` (an `Svg` of the current root, updated on mount) are getters over the controller, and `eventEmitter` is the bridge from D3. `getSeriesOption` stays exported from the module, unchanged.
- **Resizing:** in browsers both the window `resize` listener (1.x) and the `ResizeObserver` fire. The observer skips the render when the size is unchanged, so a window resize renders once.

### D5 Packaging

- **The compat entry** (`src/compat/index.ts`) imports only from the package root (`../index`). tsdown builds it as an extra entry with the root as an external dependency, and rewrites the specifier per format:
  - `./index.js` for `dist/compat.js`;
  - `./index.cjs` for `dist/compat.cjs`;
  - `./index.min.js` for `dist/compat.min.js`;
  - for `dist/compat.umd.js`, the global `Chartist`, with output into `Chartist.compat` (UMD `extend`).
- **Declarations:** `dist/compat.d.ts` and `.d.cts`.
- **Exports map:** gains `"./compat"`.
- **Smoke tests:** `test:smoke` checks Node resolution of `chartist/compat`, the same core instance (`compat`'s `Svg` is `chartist`'s `Svg`), and both browser paths.

### D6 Tests

- **`LineChart.spec.ts`:** the `createChart` helpers add `plugins: [compat]`. The tests stay otherwise unchanged; that is the contract (define-core-architecture D8).
- **`test:api`:**
  - the 1.x behavior files add `compat` where they use 1.x events;
  - `test/api/vitest.config.ts` aliases `chartist/compat` to `../../dist/compat.js` (local) or to a no-op function plugin (v1; 1.5 runs plugin functions harmlessly);
  - new `compat.v2.api.ts` tests the warnings, the plugin facade and the mixed plugins scenario.
- **Parity:**
  - `test/parity/line.spec.ts` compares against `chartist-v1`'s `LineChart`;
  - a new `test/parity/line-events.spec.ts` compares the `draw`/`created` sequences (type, index, seriesIndex, field names, `element` outerHTML) for the same fixtures.
- **Visual:**
  - the four line event examples import `compat` from `chartist/compat`;
  - the harness aliases it per mode (the local build, or a no-op for v1);
  - `test:visual:v2` and its shim are removed.

## Implementation notes

Differences from the decisions above, found while implementing (2026-10-13):

- **`LineChart` still extends `BaseChart`.** The public API suite checks this, and `BaseChart` is a 1.x export that bar and pie still use. The wrapper overrides `initialize`, `update`, `detach`, `on` and `off`. As a consequence, the 1.5 bug stays: `BaseChart` schedules the first render in a class field, before its constructor can throw for a missing target. The design's "throw before scheduling" fix needs the class to stop extending `BaseChart`, which can happen with step 5.
- **The class doesn't import `Svg`.** Compat keeps the `svg` field of a 1.x chart instance current when it runs 1.x plugins with it. Without that, `import { LineChart }` would include the whole `Svg` class (12.69 instead of 11.15 kB).
- **The DOM host measures like 1.x.** A probe `<svg>` with the chart's `width`/`height` attributes and style is added to the container, measured and removed. The fallback order is `viewBox`, the measured svg, the fixed size option, then the container. Measuring the container directly differed from 1.x in jsdom tests that mock SVG sizes (one 1.x LineChart test failed), and `width: '50%'` now works as in 1.x.
- **`'*'` on the class:** 1.x wildcard listeners receive only chart events, so the class filters out the v2 phase events. The v2 handle's `'*'` still observes everything.
- **`ChartHandle.container`:** 1.x plugins such as tooltips use `chart.container` while they install, so the handle exposes its container. The facade for the functional API uses it.
- **1.x plugin calls:** plugins without options are called with the chart only (`plugin(chart)`), as in 1.x.
- **The 1.x `plugins` option type** also accepts v2 plugin objects (such as `compat`). The 1.x `BaseChart` skips them, because the bar and pie implementations emit their events natively.
- **UMD:** `dist/compat.umd.js` adds `compat` and `fromLegacyPlugin` to the global `Chartist` (rolldown `extend`). Its CommonJS and AMD branches load `./index.umd.js`.

## Risks / Trade-offs

- [The `draw` timing differs from 1.x (all elements exist)] → Accepted by the author. Documented in the migration guide and the spec. Parity tests check order and payloads; only handlers that depend on missing later elements or on stacking order can notice.
- [`import { LineChart }` grows: the wrapper plus `lineChart` plus `Svg`] → Measured and re-baselined. The goal (1.x size) moves to v2.0, when the 1.x chart code is gone.
- [Copying data for `data` handlers costs on large data sets] → Only when a `data` listener is registered. Compat registers its `resolve` listener lazily, on the first `on('data')`.
- [The `getSeriesOption` export moves with the wrapper] → It stays in the same module and is checked by the export lists.

## Migration Plan

Commits:

1. The wrapper replaces the 1.x line implementation in the same file (a content edit).
2. Core extension points and the compat plugin.
3. Packaging.
4. Tests.

Rollback means reverting the merge. The other chart types are untouched.
