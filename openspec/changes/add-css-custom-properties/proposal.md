# Proposal

## Why

"Style with CSS" is Chartist's promise, but the default stylesheet bakes every value in at Sass compile time. Changing the series colors, the grid or the line width needs Sass or selectors that out-specify the defaults, and dark mode needs a full set of overrides. The v2 brand (`docs/visual-design`) and the docs site build on charts themed by CSS custom properties: the site switches charts to dark mode and shows an opt-in, color-blind-safe palette. The library needs that capability before the site can use it (author decision 2026-10-13: library change first).

## API sketch

```css
/* Any scope: the page, a container, one chart. */
.revenue-chart {
  --ct-series-a: #0544d3;
  --ct-line-width: 2px;
  --ct-grid-dasharray: none;
}

/* Dark pages: the classic palette stays; labels and grid follow the page. */
.dark {
  --ct-label-color: rgb(255 255 255 / 0.6);
  --ct-grid-color: rgb(255 255 255 / 0.2);
}
```

```ts
import 'chartist/styles.css';
import 'chartist/themes/accessible.css'; // opt-in color-blind-safe palette
```

```html
<div class="ct-theme-accessible"><div id="chart"></div></div>
```

## What Changes

- **Custom properties in the default CSS.**
  - Every themable value reads a custom property, with the 1.x value as its fallback: the series colors `--ct-series-a` … `--ct-series-o`, plus `--ct-label-color`, `--ct-label-size`, `--ct-grid-color`, `--ct-grid-width`, `--ct-grid-dasharray`, `--ct-grid-background-fill`, `--ct-line-width`, `--ct-line-dasharray`, `--ct-point-size`, `--ct-point-shape`, `--ct-area-opacity`, `--ct-bar-width` and `--ct-donut-width`.
  - The names follow the design tokens.
  - Without any property set, the computed styles are exactly the 1.x ones.
- **Per-series color:** each `.ct-series-x` group sets `--ct-color` from its series property. Points, lines, bars, areas and slices use it, so one property recolors a series, and custom layers can use `var(--ct-color)` too.
- **Sass keeps working:** the `$ct-*` variables become the fallbacks, so Sass overrides still change the defaults. The mixins keep their parameters.
- **Opt-in accessible theme** `chartist/themes/accessible.css`: the CVD-validated palette from the design as `.ct-theme-accessible`, eight series. Light and dark values are chosen with `light-dark()` by the element's `color-scheme`, so the theme follows `color-scheme: dark` pages without knowing a site's dark-mode class. Also in the `dist/themes/` folder and as minified CSS.
- **Exports:** `./themes/*` for the theme files.

## Out of scope

- A dark default for the classic palette, or any `color-scheme` handling in the default CSS. Existing charts must look the same on every page, including pages that set `color-scheme: dark`. The design's lifted dark values for series e, g and h stay site tokens; the docs show them as an example.
- New themes beyond the accessible one, a theme builder, and themes for the 1.x responsive container classes.
- Changing the default palette (author decision recorded in the design: the classic palette stays).

## Breaking changes vs 1.x

None in rendering: without custom properties set, every element computes the 1.x styles, as the 1.5 visual baselines verify. The CSS text changes (`var()` with fallbacks). Two edge cases are listed in the design:

- **Selector specificity is unchanged**, so 1.x overrides keep winning.
- **Old browsers:** browsers without custom-property support (none that Chartist supports) would ignore the declarations. The fallbacks are inside `var()`, so those browsers would lose the styles, not get the 1.x ones.

## Capabilities

### New Capabilities

- `chart-theming`: custom properties of the default styles, per-series color, the accessible theme.

### Modified Capabilities

- `library-distribution`: `./themes/*` in the exports map and the theme files in `dist/themes/`.

## Impact

- `packages/chartist/src/styles/` (`index.scss`, `_settings.scss`, new `themes/accessible.scss`), `scripts/styles.cjs` (theme output), `package.json` (`exports`, `files`).
- Tests: a visual check that the 1.5 baselines stay identical; new visual examples for custom properties and the accessible theme (light and `color-scheme: dark`); `test:api`/`test:smoke` for the exports; CSS size budget.
- Docs (website changes): styling guide, accessible theme. The site's design tokens feed these properties.
