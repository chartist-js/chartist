# server-rendering Specification

## Purpose

Defines `chartist/server`, the entry point for turning charts into markup without a DOM, with `computeStyles()` and `applyStyles()`, which bake CSS (or the styles of another engine) into a scene so its markup draws the same in tools that read SVG on its own, such as rasterizers and PDF libraries.

## Requirements

### Requirement: The server entry point

Chartist SHALL ship an entry point `chartist/server` that exports `renderToString`, `renderForHydration`, `computeStyles` and `applyStyles`, and re-exports `toScene` and the `SceneSize` type from `chartist`. It SHALL work without a DOM, in Node.js, in server bundles and in workers, and in the browser too. It SHALL use the same core module instance as `chartist`, so scenes, layers, plugins and configs from `chartist` work with it. `renderToString`, `renderForHydration`, `computeStyles` and `applyStyles` SHALL be marked experimental. `chartist` SHALL NOT export `renderToString` or `renderForHydration`.

#### Scenario: Rendering on a server

- **WHEN** a Node.js script imports `lineChartConfig` and `toScene` from `chartist` and `renderToString` from `chartist/server`, and renders a line chart at 600 × 300
- **THEN** it gets SVG markup with the series paths, and no `window` or `document` is accessed

#### Scenario: One import for server code

- **WHEN** server code imports `toScene` from `chartist/server`
- **THEN** it is the same function as `toScene` from `chartist`

#### Scenario: The old import path

- **WHEN** code imports `renderToString` from `chartist`
- **THEN** TypeScript reports that `chartist` has no such export, and the changelog of the release names the new path

### Requirement: Computed styles

`computeStyles(scene, css, options)` SHALL compute, for every SVG element of the scene, the values the given CSS gives the CSS properties SVG has presentation attributes for, and return them as a function from a scene node to its values (property to value), or nothing for a node that gets none. `css` SHALL be one stylesheet's text or a list of them, applied in order, as if the later ones came later in the page. It is Chartist's own small CSS engine, made for chart styles, and it SHALL say what it doesn't support instead of guessing.

Which rules apply SHALL follow the cascade: a rule applies to an element when one of its selectors matches the element in the scene's tree, and among the rules that set a property, the one with the higher specificity wins, then the later one. A node's own `style` attribute SHALL win over the CSS, and an `!important` declaration over both, as in a browser. The scene SHALL be matched as if it were in a page: above its root are an `html` and a `body` element, so rules for `:root`, `html` and `body` apply to them, their custom properties are inherited by the scene, and the inherited properties they set (such as `color` and the font properties) reach the root.

Values SHALL be resolved so the result needs no CSS support:

- `var()` SHALL be replaced by the custom property's value on the element, inherited from its ancestors as in a browser, or by the `var()` fallback when the property isn't set; a declaration whose value can't be resolved SHALL be left out;
- `light-dark()` SHALL be replaced by its light or dark value, as the `colorScheme` option says (`light` by default);
- rules in `@media (prefers-color-scheme: …)` SHALL apply when they match that color scheme, rules in `@supports` blocks SHALL apply unless the condition starts with `not`, rules in `@layer` blocks SHALL apply in place, and rules in other at-rules SHALL be left out.

The values SHALL contain no `var()` and no `light-dark()`. Elements inside a `foreignObject` (HTML labels) SHALL get none.

What it leaves out SHALL be reported to an optional `onSkip` callback, once per stylesheet part, with the part's text and the reason: an at-rule other than the ones above, a selector it can't match (other pseudo-classes, sibling combinators, ids), a nested rule, the `font` shorthand, and a declaration whose value doesn't resolve. Rules for the other color scheme and selectors with pseudo-elements (`::before`), which style nothing in SVG, SHALL NOT be reported.

#### Scenario: Chartist's stylesheet on a line chart

- **WHEN** a line chart's scene with SVG labels and Chartist's compiled stylesheet are passed to `computeStyles()`
- **THEN** the first series' line gets `stroke: #d70206`, `fill: none` and the stylesheet's line width, the grid lines and labels get their colors, and no value contains `var(` or `light-dark(`

#### Scenario: Your own custom properties

- **WHEN** the CSS list is Chartist's stylesheet followed by `.ct-series-a { --ct-color: teal; }`
- **THEN** the first series' line, point and area get `teal`, and the other series keep their default colors

#### Scenario: A theme on the root

- **WHEN** the CSS list is Chartist's stylesheet followed by `:root { --ct-series-a: teal; }`, or the same rule for `html`
- **THEN** the first series' line gets `teal`

#### Scenario: Inherited from the page

- **WHEN** the CSS sets `body { font-family: Georgia; color: teal; }`
- **THEN** the root svg gets `font-family: Georgia` and `color: teal`, unless a rule for the svg sets them

#### Scenario: Dark color scheme

- **WHEN** the same scene is passed with `{ colorScheme: 'dark' }`
- **THEN** the grid lines and labels get the dark values of the stylesheet's `light-dark()` colors

#### Scenario: Specificity and order

- **WHEN** the CSS sets `.ct-line { stroke-width: 2px }` and then `.ct-series-a .ct-line { stroke-width: 6px }` and then `.ct-line { stroke-width: 3px }`
- **THEN** the first series' line gets `stroke-width: 6px`, and the other lines `3px`

#### Scenario: What it skips

- **WHEN** the CSS has `.ct-series:nth-child(2) .ct-line { stroke: teal }`, `.ct-label { font: 14px Georgia }` and `@media print { .ct-line { stroke: black } }`, and `onSkip` is given
- **THEN** none of them applies, and `onSkip` is called once for each, with its text and the reason: the selector, the shorthand and the at-rule

#### Scenario: Chartist's stylesheet is fully read

- **WHEN** Chartist's compiled stylesheet is passed with `onSkip`, for a line, a bar and a donut chart
- **THEN** `onSkip` isn't called

### Requirement: Styles applied as attributes

`applyStyles(scene, styles, options)` SHALL return a copy of the scene in which every SVG element carries, as presentation attributes, the values `styles` gives it for properties SVG has presentation attributes for. `styles` SHALL be a function from a scene node to its values, as `computeStyles()` returns it, so another style engine can be used, or the CSS itself, which is then computed with `computeStyles()` and `options` (`colorScheme`, `onSkip`). Values for other properties SHALL be left out. When a node's `style` attribute sets a property to another value than `styles` gives, the attribute SHALL be written and the declaration removed from `style`, so the result shows `styles`' value; when it's the same value, nothing SHALL be written for it. The given scene SHALL NOT be changed, and classes SHALL stay, so the markup can still be styled by a page. Elements inside a `foreignObject` SHALL be left as they are.

#### Scenario: CSS in one call

- **WHEN** a line chart's scene is passed to `applyStyles()` with Chartist's compiled stylesheet
- **THEN** the result is the same as with `applyStyles(scene, computeStyles(scene, css))`, the first series' line has `stroke="#d70206"` as an attribute, and the markup contains no `var(` and no `light-dark(`

#### Scenario: Another style engine

- **WHEN** `applyStyles()` gets a function that gives every line `{ stroke: 'teal', 'align-items': 'center' }`
- **THEN** every line has `stroke="teal"`, and no `align-items` attribute

#### Scenario: Markup for a rasterizer

- **WHEN** the styled scene is rendered with `renderToString()` and drawn by an SVG rasterizer without CSS support
- **THEN** the lines, points, grid and labels have the colors and widths a browser gives the same chart with Chartist's stylesheet

### Requirement: Styles from trusted CSS only

`applyStyles()` SHALL write CSS values only as escaped attribute values, never as elements or attribute names, so a value can't add markup. The CSS SHALL be treated as code: the docs SHALL say to pass only stylesheets the application controls.

#### Scenario: Markup in a value

- **WHEN** a rule sets `fill: "><script>alert(1)</script>` on `.ct-line`
- **THEN** the markup from `renderToString()` has no `script` element, and the value is an escaped attribute value or left out
