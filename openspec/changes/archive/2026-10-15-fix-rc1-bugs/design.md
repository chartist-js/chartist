# Design

## Context

Every bug here was reproduced against the published 2.0.0-rc.1 and traced to its cause; the 1.x ones were also reproduced against `chartist@1.5.0`. No fix changes a committed example's rendering, so the visual baselines stay. Where a fix changes what a 1.x class produces, it's a 1.x bug being corrected, and it's recorded in `v1-compatibility` "1.x behaviors v2 corrects" and in "Coming from 1.x".

## Decisions

### Merging objects over numbers (#842, #903)

`utils/extend.ts` recurses into the target value whatever it is, so `extend(5, { top: 10 })` assigns to a number. It now recurses only into a non-null object target and otherwise starts from `{}`: an object replaces a number, as a number already replaces an object. That fixes every path that merges options, including the classes' responsive options and `setOptions()`. The pie default `chartPadding: 5` becomes `{ top: 5, right: 5, bottom: 5, left: 5 }`, so a partial object fills the other sides with the pie's 5, not the line and bar defaults.

Considered: expanding a numeric `chartPadding` to an object before each merge, as #903 suggests, so `chartPadding: 20` under a responsive `{ top: 0 }` keeps 20 on the other sides. It special-cases one option in the generic merge; not done. The merge rule is "an object replaces a number".

### Full-circle slices (#1302)

`layers/pie.ts` clamps a full slice to 359.99° and draws one arc between endpoints 0.02 px apart. `SvgPath` rounds to 3 decimals, which tilts that chord and moves the arc's centre (up to 5.8 px at 34°). A full slice is drawn as two half-circle arcs through opposite points. Their midpoint is the centre, so rounding can't move it. Pies keep their `L center Z`. This changes the `d` of `PieChart` for one value: the 1.x-ported assertions in `PieChart.spec.ts` and the parity fixtures for single values are updated, with the reason in the parity spec's exceptions.

### Donut width from CSS (#1493)

The living spec already says donut widths come from CSS, but the layout assumes 60 px. Renderers get an optional `measureStyle(property, { classes, rootClass })`. `domRenderer` implements it with the probe it uses for text: a `path.ct-slice-donut` inside an `svg.ct-chart-donut` in the container, reading the computed `stroke-width`. That sees `--ct-donut-width` at any scope and plain 1.x `stroke-width` overrides. Only `<n>px` values count; anything else (jsdom's unresolved `var()`, percentages) falls back to 60. `chart()` passes it to the pipeline next to `measureText`, and the pie layer uses it when `donut` is set and `donutWidth` isn't. Server rendering keeps 60 or `donutWidth`, and the docs say to set `donutWidth` there.

Considered: reading `--ct-donut-width` off the container in `chart()`. It's smaller, but it misses properties set below the container and `stroke-width` overrides, and it puts a pie property into `chart()`.

### Series p to z (#1456)

`$ct-series-names` becomes `a` to `z`, matching what `alphaNumerate` produces. The 15 colours cycle: in the Sass loop the colour index is `i % length(colors)`. For a series past the colours, `--ct-color` falls back to the property of the series it repeats, then to the colour: `.ct-series-p { --ct-color: var(--ct-series-p, var(--ct-series-a, #d70206)); }`. So themes carry over, and `--ct-series-p` still wins. The gzipped CSS grows from about 1420 to 1730 bytes, so its size budget rises from 1.5 to 1.8 kB.

Considered: one shared stroke/fill rule for all series, which would make the CSS smaller than today. It rewrites every series rule and needs a full visual review; not in a bug-fix change.

### Descending x (#1038, #1075)

The default smoothing is monotone cubic, which splits a line wherever x doesn't increase (`interpolation/monotoneCubic.ts`, `splitIntoSegments` with `increasingX`). The curve only needs x strictly monotonic within a piece, and a decreasing piece gives the same curve as the sorted data. Monotone cubic now breaks only where x repeats or changes direction. A zigzag still breaks, because a monotone curve can't go back. The public `splitIntoSegments` keeps its options.

### Object holes (#1040)

`interpolation/step.ts` and `simple.ts` check `value !== undefined`, but an object hole is `{ x, y: undefined }`. Both use `getMultiValue(value) !== undefined`, as `none`, `cardinal` and `splitIntoSegments` do.

### Empty range after overrides (#1057)

`getHighLow` repairs a range where high equals low, but `presets/barChart.ts` (and compat's copy) applies the chart-level `low`/`high` after that. With `low` equal to the stacked high, the range is empty again. `getBounds` then gets `-Infinity` and `NaN`, and `gcd(NaN, NaN)` never ends. The repair moves into a helper that runs again after the overrides. `rho` returns early and `gcd` loops at most a bounded number of times on non-finite input, so bad input fails visibly instead of hanging.

### Next tick at 0 (#1471)

`axes/Axis.ts` and `scales/grid.ts` test `projectedValues[index + 1] ?`, so a next tick projected at 0 counts as missing. It shows with a tick below the axis range, e.g. bar labels drawn on top of each other with `ticks: [0, 10, 20, 30]` over data from 10 to 30. Both test `index + 1 < length`.

### Line chart reference value (new issue)

`presets/lineChart.ts` maps the chart-level `high`/`low` onto the default Y axis but not `referenceValue`. In 1.5 it only ever worked for bars, but its type and docs promise it for every chart. It's applied to the default Y axis type, like `high`/`low`, and `axisY.referenceValue` wins, consistent with "an axis's own `low` and `high` win" for bars.

### Arrays from another realm (#876)

`extend` uses `!Array.isArray(sourceProp)` instead of `instanceof Array`. The only other `instanceof` checks against globals are in `Svg` (next decision).

### The container's document and window (#1492, rest of #1424)

- **`Svg`** tests the node kind (`nodeType === 1`, `namespaceURI` for SVG) instead of `instanceof Element`/`SVGElement`, which fails without globals and across frames.
- **Responsive options** match media queries against `container.ownerDocument.defaultView`.
- **`chart()` and responsive containers** create their `ResizeObserver` from that window.
- **The 1.x classes** add and remove their resize listener on it.
- **`createLabel`** creates its span with the group's document.

The deprecated `optionsProvider` gets no element, so it keeps the global window.

### Detach during the first render (#929)

- **`chart()`** subscribes to the `ResizeObserver` and the font events before the first render, so a `detach()` during it unsubscribes them. The observer's first callback compares sizes, so it doesn't render twice.
- **The preset** declares its handle before creating the inner chart and reads the inner chart lazily. A `detach()` during the first render sets a flag that detaches the inner chart once it exists, instead of throwing on an uninitialized binding.
- **`PresetChart.initialize()`** adds the window resize listener before creating the controller (as 1.5 did). `detach()` sets a flag that detaches the controller once it exists.

### Printing (#118)

In Chromium, `beforeprint` fires while the layout is still at screen size, and changes made in it reach the print. The print media query changes at the print size, but changes made there don't reach the print, and no `ResizeObserver` callback fires. So a re-layout for print isn't reliable across browsers. Instead, `chart()`'s DOM host listens for `beforeprint` on the container's window and gives the SVG a `viewBox` of its layout size. The drawing then scales into whatever box print CSS gives it. On `afterprint`, it removes the `viewBox` again. A `viewBox` from the config is left alone, and `detach()` removes the listeners. Text scales with the chart; containers with an aspect-ratio class keep their ratio and fit exactly.

### Missing target (new issue)

`BaseChart` schedules the first render in a field initializer, which runs before the constructor's target check throws. The half-built object then crashes on the timer. The timer is set at the end of the constructor, after the check.

### `SvgPath` (#1491)

- **Rounding:** `accuracy` rounds whenever it's a number, so 0 means integers; `accuracy: false` turns rounding off (the 0.x intent).
- **`splitByCommand`:** pieces copy their commands, keep the options, and set their position to their end. Only the last piece of a closed path keeps `close`, matching where the `Z` is.
- **`join`:** copies commands and sets the position to the end.
- **`parse`:** gets a tokenizer for numbers with exponents and signs, adjacent decimals and implicit repeats, plus descriptors for H, V, Q, S and T.
- **`scale` and `translate`:** map an arc's radii and end point to their axes, and leave its rotation and flags alone. Charts don't scale or translate arcs, so no chart output changes.

### Label span namespace (#1217)

`scales/grid.ts` and `Svg.foreignObject` set `xmlns="http://www.w3.org/2000/xmlns/"` on HTML label spans, "for identical 1.x DOM". It's the namespace of namespace declarations, not XHTML, so serialized output doesn't parse. Both stop setting it. The DOM parity comparison ignores `xmlns` attributes, since the elements' namespaces are compared anyway.

### Docs

- **"Coming from 1.x" and the class doc comment:** the classes redraw when the window or their container resizes.
- **The axes guide:** `low`/`high` set the range, and the auto scale rounds its ends out to a step; `fixedScaleAxis()` gives exact ends.
- **The server rendering guide:** `lineChart()` and `barChart()` take `labels`; `pieChart()` and the 1.x classes don't.

## Tests

- **Unit tests** next to each fix: `extend.spec.ts` (new: objects over numbers, realm arrays), `pie.spec.ts`, the interpolation specs, bounds, `grid.spec.ts`, `Axis.spec.ts`, `SvgPath.spec.ts`, `Svg.spec.ts`, `chart.spec.ts` (style measurement pass-through, detach during render, print listeners), `preset` and compat specs.
- **API tests:** shared files assert the corrected behavior and branch on the v1 target where 1.5.0 has the bug; v2-only cases go into `*.v2.api.ts`. A Node-environment API test uses JSDOM without globals.
- **In a browser:** donut width from `--ct-donut-width`, the 16th series' colour, iframe media queries, and the print `viewBox` around `page.pdf()`. These are Playwright checks, not new visual examples, so no new baselines need recording on the host.
- **Size:** the CSS budget rises to 1.8 kB; the other budgets must hold.

## Risks / Trade-offs

- **Print scaling shrinks text** with the chart. It's still better than a clipped chart, and a re-layout can follow if browsers converge.
- **`measureStyle` adds a probe per donut render** (one style read, like text measurement).
- **Parity fixtures for single-value pies change.** The exception is documented with its reason.
- **Iframe charts' media queries now follow the iframe:** a correction, but a visible change for 1.x users who relied on the top window.

## Migration

Nothing to do for users. "Coming from 1.x" lists the corrections.
