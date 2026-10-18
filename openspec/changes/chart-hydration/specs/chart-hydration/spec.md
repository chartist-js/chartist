## Purpose

Defines how a chart rendered to markup on a server is taken over in the browser: what the server's markup records, how the browser keeps its elements and gives them Chartist's full runtime, and what happens when the markup can't be kept.

## ADDED Requirements

### Requirement: Hydration markup

`toScene()` SHALL take a `hydrate` option. With it, the scene's root SHALL:

- carry a `data-ct-hydrate` attribute with what the browser needs to build the same scene again: the layout width and height, the label mode, whether text was measured with the built-in estimate or a custom `measureText`, and whether the root got a scaling `viewBox`;
- have the `width` and `height` that `chart()` gives the root for the same config (`100%` unless the config sets a size);
- unless the config sets a `viewBox`, have a `viewBox` of the layout size, so the drawing scales into its container until the browser lays it out;
- for a preset config (`lineChartConfig()`, `barChartConfig()`, `pieChartConfig()`), have the inline size style the preset draws in the browser.

With `hydrate`, labels SHALL default to HTML, as `chart()` draws them; a `labels` option still decides. Without `hydrate`, `toScene()` SHALL build the same scene as before.

#### Scenario: Marked root

- **WHEN** a line chart config is passed to `toScene()` with `{ width: 600, height: 300, hydrate: true }` and rendered with `renderToString()`
- **THEN** the root svg has `width="100%"`, `height="100%"`, `viewBox="0 0 600 300"` and a `data-ct-hydrate` attribute recording 600 × 300, HTML labels, the estimate and the scaling `viewBox`, and the labels are `foreignObject` elements

#### Scenario: The config sets a viewBox

- **WHEN** a config with `viewBox: { width: 400, height: 200 }` is passed to `toScene()` with `hydrate`
- **THEN** the root's `viewBox` is the config's, and the marker records that it isn't a scaling `viewBox`

#### Scenario: A preset config

- **WHEN** `lineChartConfig(data)` is passed to `toScene()` with `hydrate`
- **THEN** the root has the inline size style `lineChart()` gives it in the browser

#### Scenario: Without hydrate

- **WHEN** the same config is passed to `toScene()` without `hydrate`
- **THEN** the markup has no `data-ct-hydrate` attribute and is the same as before this change

#### Scenario: Visible without JavaScript

- **WHEN** a page shows the hydration markup of a 600 × 300 line chart in a 343 px wide container with an `aspect-ratio` of 2 / 1, with Chartist's CSS and without JavaScript
- **THEN** the whole chart is visible, scaled into the container, and the page doesn't scroll horizontally

### Requirement: Taking over server markup

When `chart()` or a preset draws into a container whose direct child is an svg with a `data-ct-hydrate` attribute, and the chart's renderer can adopt markup, the chart SHALL take that svg over instead of drawing a new one:

- it builds the scene the server drew again, from the config without responsive overrides, at the recorded size and label mode, with the built-in text estimate;
- the renderer binds that scene to the svg's elements;
- `render` and `mount` run for it with the cause `hydrate`.

The svg and its elements SHALL stay in the page. Afterwards, the chart SHALL behave as one that drew its svg itself: updates, resizes, responsive options, plugins and destroying work the same.

`liveDomRenderer()` SHALL adopt markup; `domRenderer()` SHALL NOT.

#### Scenario: Same elements

- **WHEN** the hydration markup of a line chart is in a container, and `lineChart()` is called on it with the same data and `renderer: liveDomRenderer()`
- **THEN** the container holds one svg, the same element the page had, and its points are the same elements

#### Scenario: Equal size

- **WHEN** the container's size equals the size the server recorded
- **THEN** `render` and `mount` run once, with the cause `hydrate`, and no other render follows

#### Scenario: Equal to a fresh chart

- **WHEN** a chart has taken server markup over
- **THEN** its svg has the same elements, attributes, classes and texts as a chart drawn fresh with the same config in the same container, apart from namespace declarations

#### Scenario: Updates after taking over

- **WHEN** a chart that took server markup over is updated with new data
- **THEN** it patches the adopted elements, as a chart with `liveDomRenderer()` patches its own

### Requirement: Layout at the real size

After taking server markup over, the chart SHALL lay itself out at its container's real size, with responsive overrides and measured text. If that scene differs from the server's, the chart SHALL render again with the cause `resize`, keeping the elements of nodes that stay. If it's the same, no render SHALL follow. The scaling `viewBox` and the `data-ct-hydrate` attribute SHALL be removed with this step, and not before the `hydrate` render's `mount` has run.

#### Scenario: A different size

- **WHEN** the server recorded 600 × 300 and the container is 343 px wide
- **THEN** `mount` runs with `hydrate`, then with `resize`, the svg is the same element, laid out at 343 px wide, and it has no scaling `viewBox` and no `data-ct-hydrate` attribute

#### Scenario: Responsive overrides

- **WHEN** a chart with a responsive override that matches the browser's viewport takes server markup over
- **THEN** the chart ends up drawn with the override applied

#### Scenario: Geometry during the hydrate mount

- **WHEN** a `mount` listener reads the size of an element during the `hydrate` mount of a chart whose container differs from the recorded size
- **THEN** the svg still has its scaling `viewBox`, so the server's layout is shown scaled, as before the takeover

### Requirement: Adoption makes the markup a fresh render

A renderer that adopts markup SHALL require the structure to match the scene: the same element names, namespaces and number of child elements throughout. It SHALL make everything else match what a fresh render draws:

- it sets attributes, classes and texts that differ, and removes attributes the scene doesn't have;
- it sets `ct:` attributes, which the HTML parser leaves without their namespace, in the Chartist namespace;
- it applies the scene's styles through the CSSOM where the element's applied style differs from the scene's, also when a style policy blocked the markup's `style` attribute.

#### Scenario: Attributes from the HTML parser

- **WHEN** a chart takes over markup that the browser parsed as HTML
- **THEN** each point's `ct:value` is an attribute in the Chartist namespace, once, with the value the server wrote

#### Scenario: An extra attribute

- **WHEN** an element of the server markup has an attribute the scene doesn't have
- **THEN** the attribute is removed when the chart takes the markup over

#### Scenario: Styles a policy blocked

- **WHEN** a page with `style-src 'self'` shows the hydration markup of a line chart with HTML labels, and the chart takes it over
- **THEN** the labels' `foreignObject` and `span` elements have the styles a fresh chart gives them, and the labels sit where they do without the policy

### Requirement: Differences from the server

The `render` and `mount` events with the cause `hydrate` SHALL carry `hydration: { repaired }`: the number of attributes, classes, texts and styles that differed between the server's markup and the scene the browser built, and were set. It SHALL be 0 when the server and the browser drew the same data and options:

- the root's size and inline size style SHALL NOT count, since the host sets them;
- a style that was in the markup with the scene's value, but blocked by a policy and applied again, SHALL NOT count.

Differences alone SHALL NOT log anything.

#### Scenario: The same data

- **WHEN** the server and the browser draw the same data and options
- **THEN** the `hydrate` events carry `hydration.repaired` 0, also on a page with `style-src 'self'`

#### Scenario: Other values, same structure

- **WHEN** the server drew a series `[12, 9, 7, 8, 5]` and the browser draws `[12, 9, 7, 8, 6]`
- **THEN** the chart keeps the server's elements, shows the browser's values, the `hydrate` events carry `hydration.repaired` greater than 0, and nothing is logged

### Requirement: Markup that doesn't match

When the server's markup doesn't have the structure of the scene the browser builds, the chart SHALL log a warning that names the first difference, and SHALL draw a new svg in its place, as on a first render with the cause `create`. The container SHALL hold one svg afterwards.

#### Scenario: A point more

- **WHEN** the server drew five points and the browser draws six
- **THEN** a warning names the element where the structure differs, the container holds one new svg with six points, and `mount` runs with the cause `create`

### Requirement: Charts without adoption

With a renderer that doesn't adopt (`domRenderer()`, or `liveDomRenderer({ adopt: false })`), a chart drawing into a container with hydration markup SHALL draw a new svg, remove the server's svg and log nothing; `mount` SHALL run with the cause `create`.

#### Scenario: The default renderer

- **WHEN** `lineChart()` without a renderer is called on a container with hydration markup
- **THEN** the container holds one svg, a new element, and nothing is logged

#### Scenario: Opting out

- **WHEN** `lineChart()` with `renderer: liveDomRenderer({ adopt: false })` is called on a container with hydration markup
- **THEN** the container holds one new svg, and later updates patch that svg

### Requirement: Markup replaced by other code

When a chart is about to render and its svg is no longer in its container, because other code removed or replaced it, the chart SHALL log a warning that says so and that a framework should render the server markup into the container only once. It SHALL then draw a new svg. The container SHALL hold one Chartist svg afterwards.

#### Scenario: A framework writes the markup again

- **WHEN** a chart took server markup over, the container's content is replaced with new server markup, and the chart is updated
- **THEN** a warning says the chart's svg was removed by other code, and the container holds one svg, drawn by the chart

### Requirement: Mount plugins on adopted elements

The `mount` event with the cause `hydrate` SHALL carry an `add` change for every node, as a first render's does, and its `elementOf` SHALL return the adopted elements. Listeners and plugins that work on a first render's `mount` SHALL work on a taken-over chart without changes.

#### Scenario: A tooltip plugin

- **WHEN** a plugin's `mount` listener adds a `title` and a click listener to every added point, and the chart takes server markup over
- **THEN** every server point has one `title` and the click listener, and after an update every point still has one

### Requirement: State from before the takeover

Taking server markup over SHALL keep what the page did with the server's elements before: CSS animations and transitions running on them continue, and the elements stay what other scripts and the user's input refer to.

#### Scenario: A load animation

- **WHEN** the server's line has a CSS animation that starts when the page loads, and the chart takes the markup over while it runs
- **THEN** the animation continues from where it was and isn't started again

#### Scenario: Lazy Chartist

- **WHEN** a page loads Chartist with a dynamic `import()` and takes the server markup over after it resolves
- **THEN** every frame painted before and after shows the chart
