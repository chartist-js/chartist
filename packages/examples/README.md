# @chartist/examples

The Chartist examples, shared by the docs site, the live playground and the visual regression tests (`packages/visual`). Private, never published.

## Example format

Each example is a folder laid out like an `npm create vite` vanilla TypeScript starter (minus `package.json`):

```
<type>/<name>/
  index.html     the chart container and <script type="module" src="/src/main.ts">
  src/main.ts    imports 'chartist/styles.css' and the chart from 'chartist'
  src/style.css  optional, imported from src/main.ts
```

Copy a folder into a Vite app that has `chartist` installed and it runs unchanged. Examples contain only code a user would write for that chart:

- no harness, test or docs code;
- only erasable TypeScript syntax (no enums, namespaces, parameter properties or decorators), with type-only imports marked `type`;
- CSS imported from TypeScript (`chartist/styles.css`, relative `./style.css`), and no Vite-specific features (`import.meta.glob`, `?raw`, path aliases);
- seeded randomness (an inlined `mulberry32`) instead of `Math.random()`, so every render is identical.

`src/main.ts` uses the functional API (`lineChart()`, `chart()`, v2 plugins) and teaches v2: when JavaScript would only style an element, it uses the custom properties (`--ct-bar-width`, `--ct-color`, …) or a class and a rule in `src/style.css`.

Each example has an entry in the manifest, `index.ts` (title, a one-sentence `description` for the gallery card and the example's page, viewports, sizing, settle time). `pnpm nx check examples` keeps the manifest and the folders in sync.

## Classic entries

Every example that came from 1.x also has `src/main.classic.ts`, its original 1.x code (`classic: true` in the manifest; `compat: true` when that code needs the compat plugin). Never edit a classic file, comments included: it's the 1.x original. The docs show it behind the example's v2 / 1.x switch.

The visual tests screenshot both entries against one baseline image, recorded from Chartist 1.5.0 with the classic code, which proves that the functions draw what the classes drew. When the two differ:

1. Suspect the functional code first: an option in the wrong place, a different default, a node replaced at a different position, attributes in a different order.
2. If v2 draws it differently on purpose, give the entry a reason in the manifest and a baseline from the local build: `ownBaseline` when only the functional entry differs, `localBaseline` when v2 changes the chart for both APIs (the 1.5.0 run then skips it).
3. If it's a library bug, fix the library (with a GitHub issue labeled `v2`), not the example.

New examples have no 1.x code (`v2: true`); their baselines come from the local build, and the 1.5.0 run skips them. Baselines are recorded only on the reference platform (see "Visual regression" in `docs/decisions.md`).

## Commands

- `pnpm nx typecheck examples`: type-checks every example in strict mode against the built `chartist` declarations (builds `chartist` first).
- `pnpm nx check examples`: validates the manifest against the folders.
- `pnpm nx run visual:test:visual`: screenshots every example (see `packages/visual`).

## Coverage of the 1.x examples

The 32 1.x CodeSandbox examples (`sandboxes/` at the `v1.5.0` tag) moved here in the Vite format. Their history follows the files: `git log --follow <type>/<name>/src/main.ts` for the functional code, which was rewritten in place, and `git log --follow -C` on `src/main.classic.ts`, a copy of the 1.x code.

Every 1.x Storybook story (`src/charts/*/*.stories.ts`) maps to an example. A story was merged into a sandbox example only if its data, options and event handlers are identical (same values and same behavior). All other stories became test-only examples (`docs: false`), with these changes:

- the detached `root` element became the `#chart` container;
- `faker` (story `LineChart/Scatter`) became an inlined seeded `mulberry32`, still drawing whole numbers from 0 to 100;
- `new Date()` (story `PieChart/OverlappingLabels`) became a fixed date;
- `PieChart/GaugeDonut` and `PieChart/RelativeDonutWidth` draw a fixed 500×500 chart, so their container has no fixed height and the tests keep its size (`size: 'viewport'`).

`LineChart/PathAnimation` skipped its animation in storyshots; `line/path-animation` animates and the tests screenshot its end state. The viewports column lists the story's storyshots viewports (iPad → `tablet`, iPhone X → `mobile`, iPhone X landscape → `mobile-landscape`); `pnpm nx check examples` asserts that this table matches the manifest.

| Story                                          | Example                                        | Viewports                                 | Mapping                                                          |
| ---------------------------------------------- | ---------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| LineChart/Default                              | line/simple                                    | default                                   | merged                                                           |
| LineChart/AutoScale                            | line/auto-scale                                | default                                   | test-only                                                        |
| LineChart/Labels                               | line/labels                                    | default                                   | test-only                                                        |
| LineChart/MultiSeries                          | line/multi-series                              | default                                   | test-only                                                        |
| LineChart/Holes                                | line/data-holes                                | default                                   | merged                                                           |
| LineChart/FilledHoles                          | line/data-fill-holes                           | default                                   | merged                                                           |
| LineChart/OnlyWholeNumbers                     | line/only-integer                              | default                                   | merged                                                           |
| LineChart/NoInterpolationWithHoles             | line/no-interpolation-with-holes               | default                                   | test-only                                                        |
| LineChart/CardinalInterpolationWithHoles       | line/cardinal-interpolation-with-holes         | default                                   | test-only                                                        |
| LineChart/MonotoneCubicInterpolationWithHoles  | line/monotone-cubic-interpolation-with-holes   | default                                   | test-only                                                        |
| LineChart/SimpleInterpolationWithHoles         | line/simple-interpolation-with-holes           | default                                   | test-only                                                        |
| LineChart/StepInterpolationWithHoles           | line/step-interpolation-with-holes             | default                                   | test-only                                                        |
| LineChart/StepNoPostponeInterpolationWithHoles | line/step-no-postpone-interpolation-with-holes | default                                   | test-only                                                        |
| LineChart/SeriesOverrides                      | line/series-override                           | default                                   | merged                                                           |
| LineChart/ReverseData                          | line/reverse-data                              | default                                   | test-only                                                        |
| LineChart/FullWidth                            | line/full-width                                | default                                   | test-only                                                        |
| LineChart/Scatter                              | line/scatter                                   | default                                   | test-only (integer data, unlike line/scatter-random)             |
| LineChart/Area                                 | line/area                                      | default                                   | merged                                                           |
| LineChart/BiPolarArea                          | line/bipolar-area                              | default                                   | merged                                                           |
| LineChart/CustomPoints                         | line/modify-drawing                            | default                                   | merged                                                           |
| LineChart/PathAnimation                        | line/path-animation                            | default                                   | merged                                                           |
| LineChart/ViewBox                              | line/view-box                                  | default                                   | test-only                                                        |
| BarChart/Default                               | bar/auto-scale                                 | default                                   | test-only                                                        |
| BarChart/BiPolar                               | bar/bi-polar-interpolated                      | default                                   | merged                                                           |
| BarChart/Labels                                | bar/labels                                     | default                                   | test-only                                                        |
| BarChart/MultilineLabels                       | bar/multiline                                  | default                                   | merged                                                           |
| BarChart/LabelsPlacement                       | bar/label-position                             | default                                   | merged                                                           |
| BarChart/MultiSeries                           | bar/multi-series                               | default                                   | test-only                                                        |
| BarChart/DistributedSeries                     | bar/distributed-series                         | default                                   | merged                                                           |
| BarChart/ReverseData                           | bar/reverse-data                               | default                                   | test-only                                                        |
| BarChart/Stack                                 | bar/stacked                                    | default                                   | merged                                                           |
| BarChart/Horizontal                            | bar/horizontal                                 | default                                   | merged                                                           |
| BarChart/Adaptive                              | bar/adaptive                                   | default, tablet, mobile-landscape, mobile | test-only (hides labels, unlike bar/extreme-responsive's `noop`) |
| BarChart/OverlappingBarsOnMobile               | bar/overlapping-bars-on-mobile                 | default, mobile                           | test-only (other data and breakpoints than bar/overlapping-bars) |
| BarChart/PeakCircles                           | bar/with-circle-modify-drawing                 | default                                   | merged                                                           |
| BarChart/AccumulateRelativeStack               | bar/stacked-accumulate-relative                | default                                   | merged                                                           |
| BarChart/ViewBox                               | bar/view-box                                   | default                                   | test-only                                                        |
| PieChart/Default                               | pie/fixed-size                                 | default                                   | test-only                                                        |
| PieChart/Labels                                | pie/labels                                     | default                                   | test-only                                                        |
| PieChart/OverlappingLabels                     | pie/overlapping-labels                         | default                                   | test-only                                                        |
| PieChart/LabelInterpolation                    | pie/label-interpolation                        | default                                   | test-only (fixed size, unlike pie/simple)                        |
| PieChart/StartAngle                            | pie/start-angle                                | default                                   | test-only                                                        |
| PieChart/SmallSlices                           | pie/small-slices                               | default                                   | test-only                                                        |
| PieChart/IgnoreEmptyValues                     | pie/ignore-empty-values                        | default                                   | test-only                                                        |
| PieChart/Donut                                 | pie/donut                                      | default                                   | test-only                                                        |
| PieChart/GaugeDonut                            | pie/gauge-donut                                | default                                   | test-only (fixed size and padding, unlike pie/simple-gauge)      |
| PieChart/RelativeDonutWidth                    | pie/relative-donut-width                       | default                                   | test-only                                                        |
| PieChart/Solid                                 | pie/donut-chart                                | default                                   | merged                                                           |
| PieChart/ViewBox                               | pie/view-box                                   | default                                   | test-only                                                        |
