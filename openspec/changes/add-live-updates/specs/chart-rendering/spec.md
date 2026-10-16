## ADDED Requirements

### Requirement: Renderers receive the previous render

From a chart's second render on, a renderer's `render()` SHALL receive, after the scene and the container, an update with: the output the renderer returned for the previous render, the previous scene, the render's cause, the data's labels, and the keyframes lookup of layers and plugins. A renderer that changed its previous output in place SHALL return its changes and `patched: true`, and MAY return the animation timing it used; the chart SHALL describe any other render as a replacement. A renderer SHALL NOT keep state between renders: what it needs from the previous render, it returns in its output and gets back with the next update. `domRenderer()` SHALL ignore the update and replace its SVG, as before.

#### Scenario: A renderer that patches

- **WHEN** a custom renderer receives the update, applies its changes to its earlier output and returns them with `patched: true`
- **THEN** `mount` listeners get those changes

#### Scenario: A renderer that replaces

- **WHEN** a custom renderer ignores the update and returns a new output without `patched`
- **THEN** `mount` listeners get a `remove` entry for every node of the previous scene and an `add` entry for every node of the new one

#### Scenario: One renderer for two charts

- **WHEN** the same `liveDomRenderer()` is given to two charts in different containers, and both update
- **THEN** each chart's SVG is patched with its own changes, and neither affects the other

#### Scenario: A wrapper that drops the update

- **WHEN** a renderer wraps `liveDomRenderer()` and calls its `render()` with only the scene and the container
- **THEN** each render replaces the SVG

### Requirement: Easing sampling

Chartist SHALL export `sampleEasing(easing, duration)`, which turns a CSS easing (the keywords, `cubic-bezier()` including overshooting curves, `linear()`, `steps()`) into the eased progress points of an animation of that duration: at least 12 evenly spaced in time, and one per 50 ms above 600 ms, at most 40. An easing it doesn't understand SHALL be sampled as `ease`.

#### Scenario: Overshoot

- **WHEN** `sampleEasing('cubic-bezier(0.34, 1.56, 0.64, 1)', 400)` is called
- **THEN** it returns 12 points from 0 to 1, some of them above 1

#### Scenario: Steps

- **WHEN** `sampleEasing('steps(4)', 400)` is called
- **THEN** every point is 0, 0.25, 0.5, 0.75 or 1

### Requirement: Elements from scene nodes

Chartist SHALL export `renderElement(node, document)`, which creates the element tree of a scene node as the DOM renderer does: SVG elements, HTML elements inside `foreignObject`, `ct:` attributes in the Chartist namespace, and `style` applied through the CSSOM, so renderers that create elements stay CSP-safe without their own copy of this logic. It SHALL also export `applyAttribute(element, name, value)`, which sets one scene attribute on an existing element the same way (`ct:` names in the Chartist namespace, `style` through the CSSOM), for renderers that change elements they keep.

#### Scenario: An HTML label

- **WHEN** `renderElement()` gets an axis label node with HTML label content
- **THEN** it returns a `foreignObject` whose `span` is in the XHTML namespace, with its size in `style`, and no `style` attribute was set with `setAttribute`

#### Scenario: Changing a kept element

- **WHEN** `applyAttribute()` sets `ct:value` and `style` on an existing point element
- **THEN** `ct:value` is in the Chartist namespace, and the style was applied through the CSSOM
