## ADDED Requirements

### Requirement: Layers reserve room outside the drawing area

A layer SHALL be able to define an optional `inset` method that returns the room it needs outside the drawing area, in px, for any of the sides `top`, `right`, `bottom` and `left`. It SHALL be called on every layout (the first one, resizes, updates and responsive changes), before the `layout` listeners, with the chart's size, its padding option, the layer's series, the chart's axis definitions (empty without axes), the coordinate system, the layer's index, the label mode and the renderer's text and style measuring. The room SHALL be added to the chart's padding before the axes take their offsets, so the drawing area shrinks by it and the axes and their labels stay next to the area. A value that isn't a finite number of 0 or more SHALL throw an error naming the layer.

Each layer that reserved room SHALL get, as `insetArea` in the context its `compose` and `refine` get, one box per side it reserved, in px in the SVG: across the side, the room it reserved, just outside the axes on that side and the room of the layers listed before it; along the side, the extent of the drawing area. Layers that reserve room on the same side SHALL stack outward in the order of `layers`. The `layout` payload SHALL carry the reserved room per side and a padding that includes it; the boxes SHALL be computed before the `layout` listeners run. Custom layers SHALL be able to define `inset` like built-in ones. A chart without a layer that reserves room SHALL lay out and render exactly as before, with the same `layout` payload.

#### Scenario: Room below the axis

- **WHEN** a 400 × 300 px chart with the default padding and an X axis at the bottom with an offset of 30 has a custom layer whose `inset` returns `{ bottom: 20 }`
- **THEN** the drawing area's bottom edge is at 300 − 5 − 20 − 30 = 245 px, the X axis labels sit below the area as without the layer, and the layer's `insetArea.bottom` box spans y 275 to 295 (between the axis band and the padding) and the area's width

#### Scenario: Two layers on one side

- **WHEN** two layers each reserve 16 px on the left
- **THEN** the area's left edge moves in by 32 px, the first layer's box is next to the Y axis band, and the second layer's box is outside the first one

#### Scenario: Multiple axes on one side

- **WHEN** a chart has two Y axes on the left with offsets 40 and 50 and a layer reserves 20 px on the left
- **THEN** the area's left edge is at the left padding plus 110 px, and the layer's box lies between the padding and the outer axis's band

#### Scenario: Presets keep their labels next to the area

- **WHEN** `lineChart` gets `layers: { above: [layer] }` and the layer reserves 24 px at the top, with the X axis at the top (`axisX: { position: 'start' }`)
- **THEN** the X axis labels sit directly above the area, below the reserved box, as they would with `chartPadding.top` raised by 24

#### Scenario: Room that depends on the size

- **WHEN** a layer's `inset` returns more room at the bottom when the chart is narrower than 400 px, and the container shrinks from 600 to 300 px
- **THEN** the chart lays out again with the larger room, without a call to `resolve` or `prepare` listeners

#### Scenario: The layout payload

- **WHEN** a `layout` listener runs on a chart whose layers reserve 20 px at the bottom
- **THEN** its payload's `inset` is `{ top: 0, right: 0, bottom: 20, left: 0 }` and its padding's `bottom` is the padding option plus 20

#### Scenario: No layer reserves room

- **WHEN** a chart has no layer with `inset`, or every `inset` returns `undefined` or zeros
- **THEN** its `layout` payload has no `inset`, its padding is the padding option, and its scene equals the scene of the same chart before `inset` existed

#### Scenario: Invalid room

- **WHEN** a layer of type `caption` returns `{ left: -4 }` or `{ left: NaN }`
- **THEN** creating the chart throws an error that names `caption`

#### Scenario: A pie chart

- **WHEN** a pie chart has a layer that reserves 40 px on the right
- **THEN** the pie is centered in the area left of the reserved room, and the layer's box spans the area's height on the right

#### Scenario: Measured with the renderer

- **WHEN** a chart with a layer that sizes its room with `measureText` is built with `toScene()`, with `chart()` in a browser and with the terminal renderer's cell measurement
- **THEN** each uses its own text measurement for the room, as the axis labels do
