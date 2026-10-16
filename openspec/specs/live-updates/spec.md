# live-updates Specification

## Purpose

Defines live updates, the opt-in `chartist/live` entry point: a DOM renderer that changes a chart's SVG in place from one render to the next, how values are identified across updates, and how updates animate with SMIL.

## Requirements

### Requirement: Live updates are opt-in

`chartist/live` SHALL export `liveDomRenderer()`, a renderer for `chart()` and the presets' `renderer` option. A chart SHALL keep its SVG between renders only with it; with the default `domRenderer()`, a chart SHALL draw a new SVG on every render, as before. Importing `chartist` without `chartist/live` SHALL NOT include the live renderer, the diff or the update animations in a bundle.

#### Scenario: Opting in on a preset

- **WHEN** `lineChart('#chart', data, { renderer: liveDomRenderer() })` is updated
- **THEN** the container holds the same `svg` element as before, patched

#### Scenario: Without the live renderer

- **WHEN** `lineChart('#chart', data)` is updated
- **THEN** its `svg` is a new element, as before this change

### Requirement: Charts keep their elements

After its first render, a chart drawn with `liveDomRenderer()` SHALL keep its SVG on every later render (an update, a resize, a font load, a responsive change). An element whose node stands for the same thing as a node of the previous render (see "Identity across renders") SHALL stay the same element, with only its changed attributes, classes and text set. Elements for new nodes SHALL be created in their place in the tree, and elements of nodes that are gone SHALL be removed.

#### Scenario: Same element after an update

- **WHEN** a line chart's third value changes from 3 to 9 through `update()`
- **THEN** the chart's `svg` and the third point's element are the same elements as before, the point has its new `y1` and `y2`, and the other points' attributes weren't written

#### Scenario: A value more

- **WHEN** a line chart with five values gets a sixth one
- **THEN** a sixth point element is created after the fifth, and the five earlier point elements are kept with their new positions

#### Scenario: Resize

- **WHEN** a chart's container becomes narrower
- **THEN** the chart is laid out again and its elements are kept with their new positions

#### Scenario: Hover survives an update

- **WHEN** the pointer is over a bar and the chart updates its values
- **THEN** the bar under the pointer is still the same element, and `:hover` styles stay applied

### Requirement: A patched chart equals a fresh one

After any sequence of updates, resizes and responsive changes, the SVG of a chart drawn with `liveDomRenderer()` SHALL have the same elements, attributes, classes and text, in the same order, as a chart freshly created with the final data, options and size, apart from elements and attributes added by listeners and update animations.

#### Scenario: Random updates

- **WHEN** a chart goes through a random sequence of value changes, added and removed values, added and removed series, option changes and resizes
- **THEN** after each step its SVG serializes to the same markup as a new chart with that step's data, options and size

### Requirement: What listeners add stays

The live renderer SHALL change only what the scene sets: an element's scene attributes, classes and text, and its scene children. Attributes, classes and children that listeners or plugins added to a kept element SHALL stay, until a listener removes them.

#### Scenario: A plugin's child element

- **WHEN** a `mount` listener appends a `title` element to every bar, and the chart updates its values
- **THEN** every kept bar still has its `title`

#### Scenario: A plugin's attribute and class

- **WHEN** a `mount` listener sets `tabindex="0"` and adds the class `focusable` on every point, and the chart updates
- **THEN** the kept points still have `tabindex="0"` and the class `focusable`

### Requirement: Identity across renders

The live renderer SHALL match the nodes of two scenes per parent: value nodes by layer, series index and value key; series nodes by layer and series index; grid lines and axis labels by axis id and tick value; other nodes with a key (such as a plugin's own nodes, keyed with `node(name, attributes, classes, { key })`) by that key; and the rest by element name, first class and position among their siblings with the same name and class. The value key SHALL follow `liveDomRenderer`'s `key` option:

- `'index'` (the default): the value's index in its series;
- `'label'`: the label at the value's position (`data.labels[valueIndex]`; for pie data, the label of the slice);
- a function that receives the series index, the value index, the value, its label and its meta, and returns a string or a number.

Values with the same key in a series SHALL be matched in their order. The scene's own node keys SHALL NOT change, and the `key` option SHALL NOT change the rendered output, only which elements are kept.

#### Scenario: A sliding window

- **WHEN** a line chart with `liveDomRenderer({ key: 'label' })` and the labels `Mo` to `Fr` is updated to the labels `Tu` to `Sa`, the values shifted by one
- **THEN** the points and X labels of `Tu` to `Fr` are the same elements at new positions, those of `Mo` are removed, and those of `Sa` are added

#### Scenario: Index keys

- **WHEN** the same update runs with the default `key`
- **THEN** all five points are kept, each moved to its new value, and no point is added or removed

#### Scenario: Ticks that stay

- **WHEN** a chart's Y axis has ticks 0, 5 and 10, and after an update 0, 5, 10 and 15
- **THEN** the grid lines and labels of ticks 0, 5 and 10 are kept, and those of tick 15 are added

#### Scenario: Keys from meta

- **WHEN** a chart has `liveDomRenderer({ key: ({ meta }) => meta.id })` and its values carry `meta.id`
- **THEN** a value keeps its element as long as its `meta.id` stays in the data, wherever it moves in the series

#### Scenario: Repeated labels

- **WHEN** a chart with `key: 'label'` has the labels `A`, `B`, `A`
- **THEN** the chart renders and updates as with index keys

### Requirement: The changes of a live render

The live renderer SHALL return the changes between the previous scene and the new one, in document order: `add` for a node without a match in the previous scene, `update` (with the `previous` node) for a matched node whose attributes, classes or text differ, and `remove` for a node of the previous scene without a match. Every node of an added or removed subtree SHALL have its own entry; unchanged nodes none. `diffScenes(previous, next, options?)` SHALL compute the same changes without a DOM, with the same `key` option.

#### Scenario: A changed value

- **WHEN** one value of a bar chart drawn with `liveDomRenderer()` changes through `update()`
- **THEN** `mount` gets `cause: 'update'` and one `update` entry for that bar, whose `previous` node has the old `y2`

#### Scenario: Acting on new elements only

- **WHEN** a `mount` listener adds a click listener to the element of every `add` entry with role `bar`, and the chart is updated with one more value
- **THEN** each bar element has exactly one click listener

#### Scenario: The diff without a DOM

- **WHEN** `diffScenes()` gets the scenes of two `toScene()` calls in Node.js
- **THEN** it returns the same changes the live renderer returns for those two renders

### Requirement: Update animations

When the live renderer gets `animations: smilAnimations()`, it SHALL animate a render with cause `update` or `responsive`: each updated node's changed numeric attributes and path data move from their previous value to their new one, with SMIL, over the duration the chart's CSS sets in `--ct-update-duration`, 300 ms when it sets none. The element's attributes SHALL hold the new values from the start, so the output after the animation is the output without it. Renders with cause `create`, `resize` or `fonts` SHALL NOT animate, and nothing SHALL animate while `prefers-reduced-motion: reduce` matches. Without `smilAnimations()`, or with `--ct-update-duration: 0s`, updates SHALL NOT animate.

`--ct-update-easing` SHALL set the timing function, `ease-out` by default: the CSS keywords `linear`, `ease`, `ease-in`, `ease-out` and `ease-in-out`, any `cubic-bezier()` including curves that go below 0 or above 1 (overshoot), the `linear()` function and `steps()`. A value it doesn't understand SHALL fall back to `ease-out`.

A path whose previous and new data have different commands (a vertex more or fewer, a line that became a curve) and that has no keyframes SHALL take its new shape at once, without an animation, because browsers can't interpolate between such paths and some draw nothing while they try.

#### Scenario: Animations by default

- **WHEN** a bar chart drawn with `liveDomRenderer({ animations: smilAnimations() })` and no `--ct-update-*` in its CSS updates
- **THEN** its bars move to their new values over 300 ms with `ease-out`

#### Scenario: Turned off in CSS

- **WHEN** the same chart's container sets `--ct-update-duration: 0s`
- **THEN** its updates don't animate

#### Scenario: Bars grow

- **WHEN** a page sets `--ct-update-duration: 400ms` on a bar chart's container, its renderer is `liveDomRenderer({ animations: smilAnimations() })`, and a bar's value doubles through `update()`
- **THEN** the bar's `y2` attribute holds the new value at once, and the bar is drawn moving from its old end to its new end over 400 ms

#### Scenario: No animation on resize

- **WHEN** the same chart's container is resized
- **THEN** the bars are drawn at their new size at once

#### Scenario: Reduced motion

- **WHEN** the same chart updates while `prefers-reduced-motion: reduce` matches
- **THEN** nothing animates

#### Scenario: Every browser

- **WHEN** a line chart's points (`line` elements) and its line path animate after an update, in Chromium, Firefox and WebKit
- **THEN** both animate from their previous to their new position

#### Scenario: An easing that overshoots

- **WHEN** a page sets `--ct-update-easing: cubic-bezier(0.175, 0.885, 0.32, 1.275)` and a bar grows from 100 to 200 px
- **THEN** the bar is drawn past 200 px before it settles at 200 px

#### Scenario: Paths that can't be interpolated

- **WHEN** a custom layer's path without keyframes gets a vertex more while update animations are on
- **THEN** the path takes its new shape at once, and in no browser is it drawn empty during the update

### Requirement: Interrupted animations continue

An update during an update animation SHALL continue from where each element is drawn at that moment, not from its previous or new attribute value, with no jump. This SHALL hold for numeric attributes and for paths whose frames keep the new path's commands (lines and areas). Pie slices, whose arcs can't be offset, SHALL start from their previous shape.

#### Scenario: Two updates in a row

- **WHEN** a point animates from y 100 to y 200 over 1 s, and halfway through an update moves it to y 300
- **THEN** the point is drawn at y 150 right after the second update and moves from there to y 300 without a jump

### Requirement: Built-in keyframes

`smilAnimations()` SHALL bring keyframes for the built-in nodes that don't move well number by number, used when neither a plugin nor the node's layer gives any:

- lines and areas, and bands with an edge that follows values, when the keys or the number of their values change: a value that stays moves along with its point, and a new value at the end grows out of its neighbor;
- pie and donut slices and their labels, whenever their angles change: a slice keeps its arc shape and a label moves around the pie.

Everything else SHALL animate number by number.

#### Scenario: A sliding line

- **WHEN** a line chart with `key: 'label'` and update animations moves its window by one value
- **THEN** the line's path moves left along with its points, instead of each path point moving up or down to the next value

#### Scenario: Lines that keep their keys

- **WHEN** a line chart's values change but its keys stay the same, with update animations on
- **THEN** the line's path animates number by number

#### Scenario: A growing slice

- **WHEN** a pie's slice grows from 10% to 60% with update animations
- **THEN** every frame of the slice is an arc of the pie's radius

#### Scenario: A custom layer's keyframes

- **WHEN** a custom layer gives keyframes for its nodes' `d` attribute
- **THEN** the renderer animates `d` through those keyframes on an update, with the progress points of the chart's easing

### Requirement: Live builds for every format

`chartist/live` SHALL ship as ESM (`dist/live.js`), CJS (`dist/live.cjs`), browser ESM (`dist/live.min.js`, importing `./index.min.js`) and UMD (`dist/live.umd.js`, adding `liveDomRenderer`, `smilAnimations` and `diffScenes` to the global `Chartist` defined by `dist/index.umd.js`). No live build SHALL contain a second copy of the core.

#### Scenario: Browser module

- **WHEN** a page imports `lineChart` from `dist/index.min.js` and `liveDomRenderer` from `dist/live.min.js`
- **THEN** the chart patches its SVG on updates

#### Scenario: Classic script tags

- **WHEN** a page loads `dist/index.umd.js` and then `dist/live.umd.js`
- **THEN** `Chartist.liveDomRenderer` is defined and works with `Chartist.lineChart`
