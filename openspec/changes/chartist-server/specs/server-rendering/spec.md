## Purpose

Defines `chartist/server`, the entry point for turning charts into markup without a DOM, and `applyStyles()`, which bakes CSS into a scene so its markup draws the same in tools that read SVG on its own, such as rasterizers and PDF libraries.

## ADDED Requirements

### Requirement: The server entry point

Chartist SHALL ship an entry point `chartist/server` that exports `renderToString`, `renderForHydration` and `applyStyles`, and re-exports `toScene` and the `SceneSize` type from `chartist`. It SHALL work without a DOM, in Node.js, in server bundles and in workers, and in the browser too. It SHALL use the same core module instance as `chartist`, so scenes, layers, plugins and configs from `chartist` work with it. `renderToString`, `renderForHydration` and `applyStyles` SHALL be marked experimental. `chartist` SHALL NOT export `renderToString` or `renderForHydration`.

#### Scenario: Rendering on a server

- **WHEN** a Node.js script imports `lineChartConfig` and `toScene` from `chartist` and `renderToString` from `chartist/server`, and renders a line chart at 600 × 300
- **THEN** it gets SVG markup with the series paths, and no `window` or `document` is accessed

#### Scenario: One import for server code

- **WHEN** server code imports `toScene` from `chartist/server`
- **THEN** it is the same function as `toScene` from `chartist`

#### Scenario: The old import path

- **WHEN** code imports `renderToString` from `chartist`
- **THEN** TypeScript reports that `chartist` has no such export, and the changelog of the release names the new path

### Requirement: Styles applied as attributes

`applyStyles(scene, css, options)` SHALL return a copy of the scene in which every SVG element carries, as presentation attributes, the values of the CSS properties SVG has presentation attributes for that the given CSS sets on it. `css` SHALL be one stylesheet's text or a list of them, applied in order, as if the later ones came later in the page. The given scene SHALL NOT be changed. Classes SHALL stay, so the markup can still be styled by a page.

Which rules apply SHALL follow the cascade: a rule applies to an element when one of its selectors matches the element in the scene's tree, and among the rules that set a property, the one with the higher specificity wins, then the later one. A node's own `style` attribute SHALL win over the CSS, and an `!important` declaration over both, as in a browser. Declarations of properties SVG has no presentation attribute for SHALL be left out.

Values SHALL be resolved so the result needs no CSS support:

- `var()` SHALL be replaced by the custom property's value on the element, inherited from its ancestors in the scene as in a browser, or by the `var()` fallback when the property isn't set; a declaration whose value can't be resolved SHALL be left out;
- `light-dark()` SHALL be replaced by its light or dark value, as the `colorScheme` option says (`light` by default);
- rules in `@media (prefers-color-scheme: …)` SHALL apply when they match that color scheme, rules in `@supports` blocks SHALL apply unless the condition starts with `not`, rules in `@layer` blocks SHALL apply in place, and rules in other at-rules SHALL be left out.

The result SHALL contain no `var()` and no `light-dark()`. Elements inside a `foreignObject` (HTML labels) SHALL be left as they are.

#### Scenario: Chartist's stylesheet on a line chart

- **WHEN** a line chart's scene with SVG labels is passed to `applyStyles()` with Chartist's compiled stylesheet
- **THEN** the first series' line has `stroke="#d70206"`, `fill="none"` and the stylesheet's line width as attributes, the grid lines and labels have their colors as attributes, and the markup contains no `var(` and no `light-dark(`

#### Scenario: Your own custom properties

- **WHEN** the CSS list is Chartist's stylesheet followed by `.ct-series-a { --ct-color: teal; }`
- **THEN** the first series' line, point and area get `teal`, and the other series keep their default colors

#### Scenario: Dark color scheme

- **WHEN** the same scene is passed with `{ colorScheme: 'dark' }`
- **THEN** the grid lines and labels get the dark values of the stylesheet's `light-dark()` colors

#### Scenario: Specificity and order

- **WHEN** the CSS sets `.ct-line { stroke-width: 2px }` and then `.ct-series-a .ct-line { stroke-width: 6px }` and then `.ct-line { stroke-width: 3px }`
- **THEN** the first series' line gets `stroke-width="6px"`, and the other lines `3px`

#### Scenario: A selector it can't match

- **WHEN** a rule's only selector uses a pseudo-class that depends on the page, such as `:hover`
- **THEN** the rule applies to no element

#### Scenario: Markup for a rasterizer

- **WHEN** the styled scene is rendered with `renderToString()` and drawn by an SVG rasterizer without CSS support
- **THEN** the lines, points, grid and labels have the colors and widths a browser gives the same chart with Chartist's stylesheet

### Requirement: Styles from trusted CSS only

`applyStyles()` SHALL write CSS values only as escaped attribute values, never as elements or attribute names, so a value can't add markup. The CSS SHALL be treated as code: the docs SHALL say to pass only stylesheets the application controls.

#### Scenario: Markup in a value

- **WHEN** a rule sets `fill: "><script>alert(1)</script>` on `.ct-line`
- **THEN** the markup from `renderToString()` has no `script` element, and the value is an escaped attribute value or left out
