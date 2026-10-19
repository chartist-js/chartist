# essentials-package Specification

## Purpose

Defines `@chartist-js/essentials`, the official package for the axis types and layers people ask for most, so the core stays small: how it's built, styled, tested, loaded without a bundler, released and documented.

## Requirements

### Requirement: The essentials package

`@chartist-js/essentials` SHALL be a public package in the `@chartist-js` scope, built from `packages/essentials`, licensed `MIT OR WTFPL` like `chartist`. Its root entry SHALL export the package's layers and axis types and their option types; its `exports` map SHALL also expose `./styles.css` and `./package.json`, and nothing else. It SHALL ship ES module and CommonJS builds with declarations for both, depend only on `chartist`, and import only `chartist`'s root entry. Its layers and axis types SHALL use only `chartist`'s public API, the same API custom layers and axes use.

#### Scenario: Import and require

- **WHEN** an ES module imports `axisTitle` from `@chartist-js/essentials` and a CommonJS module requires it
- **THEN** both get a function that returns a layer, and TypeScript resolves its declarations in both module systems

#### Scenario: Only chartist

- **WHEN** the package's built entries are read
- **THEN** the only module they import or require is `chartist`, and they read no Node.js globals

### Requirement: Tree-shakeable essentials

Every layer and axis type SHALL be its own export, and the package SHALL declare only its stylesheet as having side effects, so a bundle that imports one of them contains none of the others.

#### Scenario: One layer

- **WHEN** an app imports only `axisTitle` from `@chartist-js/essentials` and is bundled
- **THEN** the bundle contains no code of the package's other layers or axis types

### Requirement: Essentials render everywhere charts render

The package's layers and axis types SHALL draw the same in the browser, in `toScene()` without a DOM, in `renderToString()` and `renderForHydration()` from `chartist/server`, and in `@chartist-js/terminal`. Server markup SHALL hydrate with no repaired values when the server and the browser get the same data and options.

#### Scenario: Server markup

- **WHEN** a chart with an `axisTitle()` layer is built with `toScene()` in Node.js and rendered with `renderToString()`
- **THEN** the markup contains the title, without a DOM and without errors

#### Scenario: Hydration

- **WHEN** a page hydrates server markup of a chart with an axis title, with the same data and options
- **THEN** the `hydrate` mount reports `repaired: 0`

### Requirement: The essentials stylesheet

The package SHALL ship `@chartist-js/essentials/styles.css`, which styles what its layers draw through `--ct-*` custom properties with defaults, and nothing else. The defaults SHALL match Chartist's labels: the same color and size, with the light text default for a dark `color-scheme` where `light-dark()` is supported. The layers SHALL write no `style` attributes. Charts SHALL keep drawing without the stylesheet, with the browser's defaults for SVG.

#### Scenario: Themed with a property

- **WHEN** a page loads `chartist/styles.css` and `@chartist-js/essentials/styles.css` and sets `--ct-axis-title-color: teal` on a chart's container
- **THEN** that chart's axis titles are teal

#### Scenario: Dark color scheme

- **WHEN** a chart with an axis title is in an element with `color-scheme: dark`
- **THEN** the title has the same light default color as the axis labels

#### Scenario: Server styles

- **WHEN** `applyStyles()` from `chartist/server` gets both stylesheets for a scene with an axis title
- **THEN** the title gets its fill and font size as presentation attributes

### Requirement: Essentials without a bundler

Pages without a bundler SHALL be able to load the package from a CDN as an ES module with an import map that maps `chartist` to Chartist's browser ESM build (`dist/index.min.js`) and `@chartist-js/essentials` to the package's `dist/index.js`, so the package and the page share one copy of Chartist. The package's docs SHALL show this import map and the stylesheet link. A smoke test SHALL load the built files that way in a real browser.

#### Scenario: Import map

- **WHEN** a plain HTML page with that import map, served from the built `dist` folders, imports `lineChart` from `chartist` and `axisTitle` from `@chartist-js/essentials`
- **THEN** the chart renders with its axis title, without page errors, and the browser loaded Chartist's core once

### Requirement: Essentials tested from the build

The package's unit tests SHALL run against its sources and import Chartist only through `chartist`'s published entries. Its tests SHALL also check the built entries (only `chartist` imported), the examples in its README, its stylesheet's defaults against Chartist's, and a packed tarball installed with `chartist` into an empty project and loaded with `import` and `require`. Its lint, typecheck, test, build, smoke and size checks SHALL run in the CI gate.

#### Scenario: A README example breaks

- **WHEN** the README shows an option that the package doesn't have
- **THEN** the README test fails

### Requirement: Essentials exports are recorded

The names the package's root entry exports SHALL be compared against a checked-in list, as `chartist`'s exports are. Adding or removing an export SHALL require updating the list. The package's exports SHALL be stable from its first release, 2.2.0, and SHALL NOT be marked experimental; an export added later MAY be marked experimental only when the list records it as such.

#### Scenario: A new layer

- **WHEN** a change adds a layer export without updating the recorded list
- **THEN** the package's tests fail and name the export

#### Scenario: Stable in 2.2.0

- **WHEN** the API page of `@chartist-js/essentials` 2.2.0 lists `axisTitle` and `AxisTitleOptions`
- **THEN** neither carries the experimental badge, and the recorded list has no experimental entry

### Requirement: Essentials size budget

The package SHALL be checked against gzip size budgets, without `chartist`, for each export on its own. A budget SHALL be raised only on purpose, with the reason in the commit.

#### Scenario: Budget exceeded

- **WHEN** a change makes a tree-shaken import of `axisTitle` larger than its budget
- **THEN** the package's size check fails and names the entry

### Requirement: Essentials released with chartist

`@chartist-js/essentials` SHALL be part of the release group of `chartist`: the same version, tag, changelog section and GitHub release, published by the same workflow with provenance from trusted publishing. Its first published version SHALL be the first `chartist` release after it's added. Before that release, the package SHALL have a trusted publisher on npmjs.com for the repository `chartist-js/chartist`, the workflow `release.yml` and the environment `release`.

#### Scenario: The 2.2.0 release

- **WHEN** the release workflow publishes `2.2.0`
- **THEN** `chartist`, `@chartist-js/terminal` and `@chartist-js/essentials` are published as `2.2.0`, and `@chartist-js/essentials` depends on `chartist` with `^2.2.0`

### Requirement: Essentials docs

The site SHALL document the package at `/packages/essentials/` like every package: an overview with what it adds, how to install it, the import map for pages without a bundler, how to load its stylesheet and a quick start; a guide per layer or axis type, each with at least one live example; and the API page. The packages showcase SHALL have a card for it with a preview the package draws at build time, and the landing page's news SHALL announce it. The site's playground SHALL resolve `@chartist-js/essentials` and its stylesheet, with types for editing.

#### Scenario: The overview

- **WHEN** a reader opens `/packages/essentials/`
- **THEN** it shows `npm install @chartist-js/essentials`, the import map, the stylesheet import, a quick start with `axisTitle()`, and links to the axis titles guide and the API page

#### Scenario: A live example

- **WHEN** a reader clicks "Edit" on an example that imports `@chartist-js/essentials`
- **THEN** the playground runs it, with completions for the package's exports

### Requirement: Plugins an official package replaces

A community plugin whose use case `@chartist-js/essentials` covers SHALL NOT be listed on the plugins page, and its page and live example SHALL be removed from the site without a redirect. Every link to its page, within the site, in its tests and in the redirect pages for the 0.x site, SHALL point to the guide of the layer or axis type that replaces it instead, or to the plugins overview when no guide fits, so no link of the site leads to a removed page.

#### Scenario: The axis title plugin

- **WHEN** the site is built
- **THEN** it has no page `/plugins/chartist-plugin-axistitle/` and no redirect page there, and the plugins overview has no tile for `chartist-plugin-axistitle`

#### Scenario: The 0.x axis title anchor

- **WHEN** the 0.x redirect table is read for the old plugins page's `#axis-title-plugin` anchor
- **THEN** its target is `/packages/essentials/axis-titles/`, a page of the built site
