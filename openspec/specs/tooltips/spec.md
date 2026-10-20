# tooltips Specification

## Purpose

Defines `@chartist-js/tooltips`, the official tooltip plugin for Chartist: which values get a tooltip, what it says, where it shows, how pointer, touch and keyboard users reach it, how it behaves across renders, and how it's built, styled, documented and tested.

## Requirements

### Requirement: The tooltips package

The tooltips SHALL be published as `@chartist-js/tooltips` from `packages/tooltips`, released in lockstep with `chartist`. Its `exports` map SHALL offer the package root (ESM and CommonJS, each with declarations), `./styles.css` and `./package.json`, and nothing else. The root SHALL export `tooltips()` and the types of its options, of the item `format` and `render` get and of `render`'s data, and no other runtime value.

#### Scenario: Import and require

- **WHEN** a bundled app imports `tooltips` from `@chartist-js/tooltips` and a Node.js script requires it
- **THEN** both get the same function, and TypeScript resolves its declarations for both

#### Scenario: Released with chartist

- **WHEN** `chartist` 2.2.0 is released
- **THEN** `@chartist-js/tooltips` 2.2.0 is published by the same release, with a `chartist` dependency of `^2.2.0`

### Requirement: A browser build for the CDN

The package SHALL ship a minified browser ES module, `dist/index.min.js`, that runs from a CDN in `<script type="module">` without a bundler or an import map. It SHALL NOT import `chartist` or anything else at runtime, so it works with any copy of Chartist 2 on the page. Its gzipped size SHALL stay within a budget checked in the gate; the budget is raised only on purpose.

#### Scenario: No bundler

- **WHEN** a page imports `lineChart` from `chartist`'s `dist/index.min.js` and `tooltips` from `@chartist-js/tooltips`'s `dist/index.min.js` on a CDN, links both stylesheets and hovers a point
- **THEN** the point's tooltip shows, and the page made no other module requests

#### Scenario: Over budget

- **WHEN** a change makes `dist/index.min.js` larger than its budget
- **THEN** the size check in the gate fails

### Requirement: A v2 plugin

`tooltips(options?)` SHALL return a v2 plugin (`{ name, install }`) that works in the `plugins` of `chart()`, `lineChart()`, `barChart()` and `pieChart()`. It SHALL NOT need `chartist/compat` or `chartist/live`, and SHALL work with both `domRenderer()` and `liveDomRenderer()`.

#### Scenario: A preset

- **WHEN** `lineChart('#chart', data, { plugins: [tooltips()] })` is drawn and the pointer rests on a point
- **THEN** a tooltip shows that point's value

### Requirement: Which values get a tooltip

By default, the elements of `point`, `bar` and `slice` nodes SHALL get tooltips. The `roles` option SHALL replace that list with any node roles, including roles that other layers, plugins and other packages declare (by augmenting `NodeRoles`), and nodes that belong to no series, such as a target line. A node that stands for a hole SHALL get no tooltip. The item `format` and `render` get SHALL carry the node's data context, typed by the listed roles so that checking `item.role` narrows it, so a tooltip can show what its role knows (a trend line's slope, a target line's value). A node without a series SHALL keep its tooltip across renders by its scene key, or else by its place among the nodes of its role, and SHALL come after the series' values in keyboard order.

#### Scenario: Defaults

- **WHEN** a line chart with `showArea: true` has `tooltips()`
- **THEN** its points have tooltips, and its lines and areas don't

#### Scenario: Bars and slices

- **WHEN** a bar chart and a pie chart each have `tooltips()`
- **THEN** every bar and every slice has a tooltip

#### Scenario: Other roles

- **WHEN** a line chart has `tooltips({ roles: ['line'] })`
- **THEN** each series' line has a tooltip, showing the series, and the points have none

#### Scenario: A trend line

- **WHEN** a line chart with a `trendLine()` layer has `tooltips({ roles: ['trendLine'], format })`, and `format` reads `item.context.slope`
- **THEN** hovering the trend line shows the text built from its slope

#### Scenario: Typed by role

- **WHEN** TypeScript code passes `roles: ['point', 'trendLine']` and its `format` checks `item.role === 'trendLine'`
- **THEN** `item.context.slope` is typed as a number, a role nobody declared in `NodeRoles` is a type error in `roles`, and `format` and `render` get items of the listed roles only

#### Scenario: A custom layer's role

- **WHEN** a chart has a custom layer whose nodes have the role `peak` and the context `{ label, value, height }`, and `tooltips({ roles: ['peak'], format })` reads `item.context.height`
- **THEN** hovering a peak shows that text, and the peak is part of the keyboard order

#### Scenario: A target line

- **WHEN** a chart with `targetLine({ value: 1400, label: 'Goal' })` has `tooltips({ roles: ['targetLine'] })`
- **THEN** the target line's tooltip shows `Goal` and `1,400`

#### Scenario: A hole

- **WHEN** a line series has a hole at index 2
- **THEN** no tooltip shows for that index

### Requirement: The default text

Without `format`, a tooltip SHALL show up to three parts, each in its own element with its own class, and each left out when it's empty or repeats an earlier part:

- the title: the value's `meta` when it's a string or a number, otherwise the label of the value (for line and bar charts the label at its index, for pies the slice's label, for a node with a label of its own, such as a target line, that label);
- the series' name, when the node belongs to a series that has one (from the chart's data when the node doesn't carry its series, as a trend line);
- the value, formatted with `Intl.NumberFormat` in the browser's locale and the `numberFormat` option; an `{ x, y }` value shows both numbers.

A `meta` that's an object SHALL NOT be shown by default. A node with none of these parts SHALL show no tooltip unless `format` or `render` is given.

#### Scenario: Labels and a named series

- **WHEN** a line chart has labels `Mon` to `Fri` and the series `{ name: 'Visitors', data: [1200, 1500, …] }`, and the pointer rests on its second point
- **THEN** the tooltip shows `Tue`, `Visitors` and `1,500` (in an English locale)

#### Scenario: Meta as the title

- **WHEN** a bar's value is `{ value: 9, meta: 'Owls' }`
- **THEN** its tooltip's title is `Owls`

#### Scenario: Currency

- **WHEN** a chart has `tooltips({ numberFormat: { style: 'currency', currency: 'CHF' } })` and a value is 1250
- **THEN** the value part shows 1250 as Swiss francs in the browser's locale, e.g. `CHF 1,250.00` in English

### Requirement: Custom text

A `format` option SHALL take a function that gets the hovered item (its role, series index, value index, value, `meta`, the series' name, its label and its element) and returns the tooltip's text. Line breaks in the text SHALL show as line breaks. Returning `null` or an empty string SHALL show no tooltip for that item; returning `undefined` SHALL keep the default text for it, so a `format` can handle some roles and leave the others. `format` SHALL be called when the tooltip shows and again when a render changes the item, not for every node on every render.

#### Scenario: Own text

- **WHEN** `format` returns `` `${item.label}: ${item.value} visitors` ``
- **THEN** the tooltip shows exactly that text

#### Scenario: Some roles only

- **WHEN** `format` returns text for trend lines and `undefined` for points, and both roles are listed
- **THEN** the trend line shows the text, and the points show the default text

#### Scenario: No tooltip for some values

- **WHEN** `format` returns `null` for values below 10
- **THEN** those values show no tooltip, and the others do

### Requirement: Your own content

A `render` option SHALL take a function that gets the tooltip's content element, the hovered item (the same item `format` gets) and the chart's data (its labels and series, as the `prepare` phase gives them), and fills the content element itself, for example with DOM nodes or a framework's template. The plugin SHALL own the tooltip box (its popover state, classes and position) and SHALL hand `render` only the content element inside it, emptied before each call. `render` MAY return a cleanup function; the plugin SHALL call it before the next `render` call, when the tooltip hides, and on `destroy()`. When `render` is given, `format` SHALL still decide whether a value has a tooltip (`null`, `undefined` or `''` means none) and SHALL give the accessible name; without `format`, every value in `roles` has a tooltip and the accessible name is the content element's text after `render` ran. When the content element changes size after `render` returned (content a framework renders later, images that load), the plugin SHALL place the tooltip again.

#### Scenario: DOM content

- **WHEN** `render` appends a `strong` with the series name and a `span` with the value to the content element
- **THEN** the tooltip shows both elements, placed at the value, and the focused value's accessible name is their text

#### Scenario: A framework template

- **WHEN** `render` mounts a component into the content element and returns a function that unmounts it
- **THEN** moving to another value unmounts the first component before mounting the next, and hiding the tooltip or `destroy()` unmounts the last one

#### Scenario: Content that renders later

- **WHEN** `render` fills the content element in a later microtask, so it's empty when `render` returns
- **THEN** the tooltip is placed again once the content has its size, and it stays inside the viewport

#### Scenario: format with render

- **WHEN** both `format` and `render` are given and `format` returns `null` for some values
- **THEN** those values show no tooltip, and for the others `render` fills the content and `format`'s text is the accessible name

### Requirement: Text by default

Without `render`, tooltip content SHALL be set as text, never parsed as HTML, whether it comes from data, `meta`, labels or `format`. The plugin itself SHALL NOT use `innerHTML`, `insertAdjacentHTML`, `outerHTML` or `document.write`; what a `render` function does with its content element is the page's code.

#### Scenario: Markup in meta

- **WHEN** a value's `meta` is `<img src=x onerror=alert(1)>`
- **THEN** the tooltip shows that string as text, and the page has no `img` element from it

#### Scenario: Markup from format

- **WHEN** `format` returns `<b>5</b>`
- **THEN** the tooltip shows `<b>5</b>` as text

### Requirement: Tooltips under a strict policy

Charts with tooltips SHALL work on pages whose Content Security Policy has `style-src 'self'` without `'unsafe-inline'`, no `'unsafe-eval'`, and `require-trusted-types-for 'script'`, without any policy violation. The plugin SHALL set no `style` attribute in markup; it SHALL position the tooltip through the CSSOM.

#### Scenario: Strict page

- **WHEN** a page served with that policy draws a chart with `tooltips()` and the package's stylesheet, and a test hovers and focuses its values
- **THEN** each tooltip shows its text at its point, and no `securitypolicyviolation` event fires

### Requirement: Where the tooltip shows

With `position: 'element'`, the default, the tooltip SHALL be anchored to the value: a point at its position, a bar at its value's end, a slice at the middle of its arc. With `position: 'pointer'`, it SHALL follow the mouse or pen while it moves over the element, and touch and keyboard SHALL still anchor it to the element. The tooltip SHALL show above its anchor and flip below when there's no room above, SHALL be moved sideways to stay inside the viewport, and SHALL NOT be clipped by an ancestor's `overflow` or covered because of `z-index`. Its anchor SHALL follow the chart's scaling, so a chart drawn with a `viewBox` (hydration markup) places it correctly.

#### Scenario: Anchored

- **WHEN** the pointer moves across a bar
- **THEN** the tooltip stays at the bar's end, centered on it

#### Scenario: Following the pointer

- **WHEN** a chart has `tooltips({ position: 'pointer' })` and the pointer moves across a bar
- **THEN** the tooltip moves with the pointer

#### Scenario: Near the edge

- **WHEN** the hovered point is at the top right corner of the viewport
- **THEN** the tooltip shows below the point, and its right edge is inside the viewport

#### Scenario: Inside a clipping container

- **WHEN** the chart is inside an element with `overflow: hidden` that is just as high as the chart
- **THEN** the tooltip of the topmost point shows in full

### Requirement: Pointer and touch

A mouse or pen resting on a value SHALL show its tooltip, and moving to another value SHALL move the tooltip to it. Leaving the value SHALL hide the tooltip after a short delay set in CSS, and the tooltip SHALL stay while the pointer is over it, so it can be hovered. A tap on a value SHALL show its tooltip until the reader taps elsewhere or presses `Escape`; the plugin SHALL NOT prevent scrolling or zooming by touch.

#### Scenario: Hover and leave

- **WHEN** the mouse rests on a point and then leaves the chart
- **THEN** the tooltip shows, and hides after the delay of `--ct-tooltip-hide-delay`

#### Scenario: Hoverable

- **WHEN** the mouse moves from a point onto its tooltip
- **THEN** the tooltip stays visible

#### Scenario: Tap

- **WHEN** a reader taps a bar, then taps outside the chart
- **THEN** the bar's tooltip shows after the first tap and hides after the second

#### Scenario: Scrolling over a chart

- **WHEN** a reader swipes over a chart on a phone
- **THEN** the page scrolls

### Requirement: Keyboard access

With `keyboard` on, the default, the values with tooltips SHALL form one stop in the page's tab order: `Tab` SHALL focus one value (the one last focused, or the first), and show its tooltip. Arrow keys SHALL move the focus: left and right to the previous and next value of the same series, or to the previous and next series when every series has one value (pies, distributed bars); up and down to the value at the same index in the previous and next series that has one. `Home` and `End` SHALL go to the first and last value of the series. `Escape` SHALL hide the tooltip and keep the focus. Leaving the chart with `Tab` SHALL hide it. The focused value SHALL have a visible focus indicator from the stylesheet. `keyboard: false` SHALL leave the tab order and the elements' attributes unchanged.

#### Scenario: One tab stop

- **WHEN** a page has a line chart of three series with ten values each and `tooltips()`, and the reader presses `Tab` into the chart and `Tab` again
- **THEN** the first `Tab` focuses the chart's first point and shows its tooltip, and the second leaves the chart

#### Scenario: Arrow keys

- **WHEN** the first point of the first series has focus and the reader presses the right arrow, then the down arrow
- **THEN** the focus moves to the second point of the first series, then to the second point of the second series, and the tooltip follows

#### Scenario: Slices

- **WHEN** a slice of a pie has focus and the reader presses the right arrow
- **THEN** the focus moves to the next slice

#### Scenario: Dismiss

- **WHEN** a tooltip shows for a focused point and the reader presses `Escape`
- **THEN** the tooltip hides and the point keeps the focus

#### Scenario: Keyboard off

- **WHEN** a chart has `tooltips({ keyboard: false })`
- **THEN** none of its elements has a `tabindex`, and its values can't be focused

### Requirement: Accessible tooltips

A focused value SHALL have an accessible name with the tooltip's text, so screen readers announce what the tooltip shows. The tooltip element itself SHALL be hidden from assistive technology, so the text isn't announced twice. The plugin SHALL NOT change the chart's own `svg` attributes (its role or name).

#### Scenario: Screen reader

- **WHEN** a screen reader user tabs into a bar chart with `tooltips()`
- **THEN** the focused bar's accessible name is its tooltip's text, e.g. `Q2, Sales, 4`

#### Scenario: The chart's name stays

- **WHEN** a chart's svg has `role="img"` and an `aria-label` set by the page, and the chart has `tooltips()`
- **THEN** both stay as the page set them

### Requirement: Tooltips across renders

After every render (an update, a resize, a responsive change, loaded fonts, a hydration takeover), a shown tooltip SHALL stay on the same value (same role, series index and value index) when the chart still has it, with that value's new text and position, and SHALL hide when it doesn't. A focused value SHALL keep the focus, also when the renderer replaced its element. When the render animated the update, the tooltip SHALL move with the chart's duration and easing; otherwise it SHALL move at once. Elements that `liveDomRenderer()` keeps SHALL NOT get the plugin's listeners or attributes twice.

#### Scenario: Live update

- **WHEN** a chart with `liveDomRenderer({ animations: smilAnimations() })` and `tooltips()` gets a new value for the hovered point
- **THEN** the tooltip shows the new value and moves with the point, in step with the update animation

#### Scenario: Default renderer

- **WHEN** a chart with the default renderer is updated while its third point has keyboard focus
- **THEN** the new svg's third point has the focus and the tooltip shows its new value

#### Scenario: The value is gone

- **WHEN** the hovered value's index no longer exists after an update
- **THEN** the tooltip hides

#### Scenario: Resize

- **WHEN** the container is resized while a tooltip shows
- **THEN** the tooltip moves to the value's new position

#### Scenario: Hydration

- **WHEN** a chart with `tooltips()` takes server markup over
- **THEN** the server's points get tooltips and the keyboard tab stop, without drawing the svg again

#### Scenario: Many updates

- **WHEN** a live chart with `tooltips()` updates 100 times
- **THEN** hovering a point runs `format` once, and the chart's elements carry one set of the plugin's attributes

### Requirement: No tooltips without a page

Where a chart has no container, as in `toScene()` and `chartist/server`, the plugin SHALL do nothing and SHALL NOT throw, so one config serves the server and the browser. It SHALL add nothing to the scene.

#### Scenario: Server rendering

- **WHEN** `renderForHydration()` renders a config with `tooltips()` in its plugins
- **THEN** the markup equals the markup without the plugin

### Requirement: Cleanup

`destroy()` SHALL remove the tooltip element and every listener the plugin added to the container, the document or the window. `detach()` SHALL leave the tooltips working.

#### Scenario: Destroy

- **WHEN** a chart with `tooltips()` is destroyed while its tooltip shows
- **THEN** the tooltip element is gone, and no listener of the plugin remains on the document or the window

#### Scenario: Detach

- **WHEN** a chart with `tooltips()` is detached and a point is hovered
- **THEN** the point's tooltip shows

### Requirement: Several charts on a page

Each chart SHALL have its own tooltip element, with ids that don't clash with another chart's. Showing a tooltip in one chart SHALL NOT change another chart's tooltip, except that a tap outside a chart hides that chart's tap-opened tooltip.

#### Scenario: Two charts

- **WHEN** a page has two charts with `tooltips()`, and the mouse rests on a point of the first, then on a bar of the second
- **THEN** the first chart's tooltip hides after its delay, the second's shows, and the page has two tooltip elements with different ids

### Requirement: The tooltip stylesheet

`@chartist-js/tooltips/styles.css` SHALL style the tooltip (`ct-tooltip`), its parts (`ct-tooltip-title`, `ct-tooltip-series`, `ct-tooltip-value`) and the focus indicator from `--ct-tooltip-*` custom properties only: background, text color, border, corner radius, padding, font, shadow, maximum width, the distance from the anchor, the hide delay and the focus indicator. Color defaults SHALL use `light-dark()`, following the page's `color-scheme`, as Chartist's stylesheet does. The series' color SHALL be available to the tooltip's CSS as `--ct-tooltip-series-color`. For a callout arrow, the tooltip SHALL carry `data-placement` (`top` or `bottom`) and `--ct-tooltip-anchor-x`, the anchor's distance from the tooltip's left edge, also when the tooltip moved sideways to stay in the viewport. A `className` option SHALL add the given classes to the tooltip element. Without the stylesheet, a hidden tooltip SHALL still not be visible.

#### Scenario: Your own colors

- **WHEN** a page sets `--ct-tooltip-background: navy` and `--ct-tooltip-color: white` on the chart's container
- **THEN** that chart's tooltips are white on navy, and other charts keep the defaults

#### Scenario: A dark page

- **WHEN** a page declares `color-scheme: dark` and uses the defaults
- **THEN** tooltips use the dark side of their `light-dark()` colors

#### Scenario: An arrow

- **WHEN** a point near the viewport's right edge shows its tooltip, moved left to stay in view
- **THEN** `--ct-tooltip-anchor-x` is the point's distance from the tooltip's left edge, so an arrow placed with it points at the point

#### Scenario: Series color

- **WHEN** the tooltip of a value of the second series shows
- **THEN** `--ct-tooltip-series-color` on the tooltip is that series' color, `--ct-series-b` or its default

### Requirement: Tooltips documentation

The package SHALL have a subsite at `/packages/tooltips/` like the other packages: an overview with the install command, the CDN snippet and a live example; a guide on content, formatting, positioning and styling, including `render` with DOM nodes and with a framework template, the note that HTML strings in `render` are the page's responsibility under Trusted Types, and a callout arrow in the styling example; and the generated API page. Charts that keep a 1.x tooltip plugin are pointed to `fromLegacyPlugin`, as the core's "Coming from 1.x" guide explains it; there's no separate migration guide. The package README SHALL show install, the import, the stylesheet and one example, and its code examples SHALL be tested. Every option and exported type SHALL have a doc comment.

#### Scenario: A 1.x tooltip plugin

- **WHEN** a reader with a 1.x tooltip plugin reads the overview
- **THEN** it says the plugin keeps working through `fromLegacyPlugin`, links the core's guide for it, and names what `tooltips()` offers in its place

#### Scenario: Live example

- **WHEN** a reader hovers or focuses a point in the overview's live example
- **THEN** its tooltip shows, and the example opens in the playground with `@chartist-js/tooltips` loaded

### Requirement: Tooltips tested from the build

The package's unit tests SHALL run in a DOM test environment with charts drawn by `chartist`'s published entry points, and SHALL cover the default text, `format`, `numberFormat`, `roles`, text-only content, keyboard navigation, kept and replaced elements across renders, cleanup and several charts. A test of the build SHALL check that `dist/index.min.js` imports nothing. A smoke test SHALL pack and install the package as npm would. A browser smoke test SHALL check in Chromium, on a page with the strict policy, what a DOM test environment can't: the tooltip shows in full outside a clipping ancestor, keyboard focus reaches the values, and nothing violates the policy. Placement near the viewport's edges and touch SHALL be covered by unit tests. Its lint, typecheck, test, size and smoke targets SHALL run in the gate.

#### Scenario: A broken position

- **WHEN** a change places the tooltip outside the viewport near an edge
- **THEN** the placement unit tests fail
