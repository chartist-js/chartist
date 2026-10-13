# Design

## Context

- `src/styles/index.scss` compiles 1.x rules from `!default` Sass variables in `_settings.scss`. `scripts/styles.cjs` runs Sass, then PostCSS (`postcss-preset-env` 6, `cssnano` 4) into `dist/index.css`, `dist/index.min.css` and `dist/chartist.min.css`, and copies the Sass sources.
- Series colors come from `.ct-series-<x> .ct-point, … { stroke: <color> }` rules per series (the `ct-chart-series-color` mixin).
- The design's `chartist.css` themes charts with `--ct-*` tokens: the same series names, plus `--ct-label-*`, `--ct-grid-*` and line, point, bar and donut sizes, and `--ct-color` per series.

## Decisions

### D1: `var()` with the Sass value as fallback

Each declaration becomes `prop: var(--ct-<name>, <sass value>)`. For example, `stroke: var(--ct-grid-color, rgba(0, 0, 0, 0.2))` and `stroke-width: var(--ct-line-width, 4px)`.

- **No `:root` defaults.** Setting a property anywhere wins, and unset properties fall back to the Sass value.
- **Sass users** who change `$ct-*` change the fallback.
- **Mixins** keep their parameters; values passed in become the fallbacks too.
- **Optional Sass values:** where Sass emits a declaration only conditionally (`$ct-line-dasharray: false`, `$ct-grid-dasharray`), the property always emits, with the fallback `none` when the Sass value is false. `stroke-dasharray: none` is the initial value, so the computed style is unchanged.

Rejected: defaults on `:root`. They would be global and leak into the page, and setting a property on an inner scope would be needed anyway.

### D2: Names follow the design tokens

The Sass names map to custom properties as follows:

- `$ct-text-color` and `$ct-text-size` become `--ct-label-color` and `--ct-label-size` (the design's names; they only style labels).
- Every other `$ct-<name>` keeps its name as `--ct-<name>`.
- The series colors are `--ct-series-<letter>`, per `$ct-series-names`, so a Sass build with more series gets more properties.

### D3: `--ct-color` per series, 1.x specificity

The per-series rules become:

```css
.ct-series-a {
  --ct-color: var(--ct-series-a, #d70206);
}
.ct-series-a .ct-point,
.ct-series-a .ct-line,
.ct-series-a .ct-bar,
.ct-series-a .ct-slice-donut {
  stroke: var(--ct-color);
}
.ct-series-a .ct-slice-pie,
.ct-series-a .ct-area {
  fill: var(--ct-color);
}
```

The selectors and their specificity are unchanged, so a 1.x override such as `.ct-series-a .ct-line { stroke: blue }` still wins by source order. Inline `style` overrides from plugins keep winning too.

There are two ways to recolor:

- **One series:** set `--ct-color` on the series group (e.g. from a `compose` listener).
- **Per chart or page:** set `--ct-series-<x>`.

### D4: The accessible theme with `light-dark()`

`themes/accessible.scss` → `dist/themes/accessible.css` and `.min.css`:

```css
.ct-theme-accessible {
  --ct-series-a: light-dark(#D7263D, #E5484D);
  …
}
```

- **Where the values come from:** the eight pairs are the design's CVD-validated values.
- **How light or dark is chosen:** `light-dark()` uses the element's used `color-scheme`. A page that sets `color-scheme: dark` (or `light dark` with a dark OS) gets the dark values, without knowing the site's dark class.
- **Support:** `light-dark()` is Baseline 2024. In older browsers the declaration is invalid at computed-value time, so the classic palette shows.
- **Build:** PostCSS must not transform it, which the tests check on the built file (D5).

### D5: Build

- **Theme output:** `styles.cjs` also compiles `themes/*.scss` to `dist/themes/`, readable and minified.
- **PostCSS:** `postcss-preset-env` 6 has `postcss-custom-properties` with `preserve: true`. It would add duplicate declarations with fallbacks resolved from `:root`; we have none, so it would emit nothing extra, but to be explicit the custom-properties plugin is disabled.
- **cssnano:** cssnano 4 keeps `var()` fallbacks as they are.
- **Checks:** the build test asserts on the output: `var(--ct-line-width, 4px)` is present, and `light-dark(` survives.

### D6: Verification

- **The 1.5 visual baselines (67) must stay pixel-identical.** That is the proof of D1.
- **New v2 examples:**
  - `styling/custom-properties`: a scoped override next to a default chart;
  - `styling/accessible-theme`: the theme in light and in `color-scheme: dark`, side by side on one page.
  - They are `v2` examples (new manifest type `styling`), so the 1.5 run skips them.
- **Unit tests** compile the Sass with a variable override and assert the fallback changes.
- **Size:** the readable CSS grows by the `var()` wrappers; the minified size budget is updated.

## Risks / Trade-offs

- **Custom-property support:** browsers without it ignore the declarations entirely; the fallback inside `var()` doesn't help them. All browsers Chartist supports have custom properties, so this only matters for a browser list we don't support. Documented.
- **Specificity of `--ct-color`:** a 1.x user who styled `.ct-series-a .ct-line` with `stroke` sees no change. One who styled `.ct-line { stroke: … }` globally (lower specificity than the series rule) was already overridden in 1.x and still is.
- **CSS size:** about +0.3 kB minified and gzipped for the `var()` wrappers, estimated; measured in the change.

## Implementation notes

- **Pixel-identical:** with the new CSS, all 74 screenshots of the v2 run (67 1.5 baselines plus 7 v2 examples) and the 1.5 run are unchanged.
- **Sass:** `ct-or-none()` turns unset optional settings (`false`) into `none` with an `@if` block; the Sass `if()` function is deprecated. The theme uses `sass:list` (new file, so the 1.x `@import` constraint doesn't apply). `ct-chart-series-color($color)` now sets `--ct-color: $color` on its selector, so Sass users calling it on their own selectors keep working.
- **Build:** `postcss-preset-env` runs with `features: { 'custom-properties': false }`; `cssnano` keeps the `var()` fallbacks and `light-dark()`. Themes compile to `dist/themes/<name>.css` and `.min.css` (no source maps), and their Sass sources are published in `dist/scss/themes/`.
- **Smoke tests:** the Sass override tests now expect the override as the fallback (`var(--ct-line-width, 7.5px)`); new tests check every property with its 1.x fallback, the 1.x series selectors with `--ct-color`, and `light-dark()` in both theme files.
- **Size:** `dist/index.min.css` 1.28 → 1.42 kB gzipped (+0.14 kB); the accessible theme is 0.18 kB.
