# Spec Delta

## Purpose

Defines the renderer-independent scene that charts produce, the Chartist virtual DOM, so that plugins and renderers work on one shared structure instead of live DOM.

## ADDED Requirements

### Requirement: Scene is a tree of plain nodes

A chart's scene SHALL be a tree of nodes. Each node has an SVG element name, attributes, class names, children and optional text. Scenes SHALL be creatable and inspectable without a DOM or browser environment.

#### Scenario: Scene in Node.js

- **WHEN** a chart's scene is built in Node.js without any DOM implementation
- **THEN** the scene is built without errors and contains the same nodes as in a browser for the same size

### Requirement: Builder API on scene nodes

Scene nodes SHALL offer a builder API that follows the 1.x `Svg` wrapper: set/get attributes, add/remove classes, create child elements, append, remove, replace, set text and clear children. Builder calls SHALL be chainable.

#### Scenario: Customizing a point in compose

- **WHEN** a compose listener calls `node.addClass('highlight').attr({ r: 8 })` on a point node
- **THEN** the rendered point element has the class `highlight` and `r="8"`

#### Scenario: Replacing a node

- **WHEN** a compose listener replaces a point node with a newly created `circle` node
- **THEN** the output contains the circle at that position in the tree and not the original point

### Requirement: Semantic roles and data context

Every node created by a chart layer or axis SHALL carry its role (e.g. `point`, `line`, `area`, `bar`, `slice`, `grid`, `label`, `axis`, `series`) and its data context. Neither SHALL appear in the output unless explicitly rendered as attributes.

#### Scenario: Querying nodes by role

- **WHEN** a `scene` listener queries the scene for nodes with role `bar` in series 0
- **THEN** it receives exactly the bar nodes of the first series

### Requirement: 1.x-equivalent output structure

For the 1.x chart types, the rendered output SHALL keep the 1.x element structure, class names and `ct:` attributes (e.g. `ct:value`, `ct:meta`). CSS and selectors written for 1.x then keep working.

#### Scenario: Series group classes

- **WHEN** a `LineChart` with two series is rendered
- **THEN** the output contains `g.ct-series.ct-series-a` and `g.ct-series.ct-series-b` groups with `path.ct-line` and `line.ct-point` elements as in 1.x

### Requirement: Stable node identity

Nodes created for data elements SHALL have a key derived from layer, series and value index. That key stays the same across re-renders with the same data shape.

#### Scenario: Re-render keeps keys

- **WHEN** a chart is updated with new values but the same number of series and values
- **THEN** each data node has the same key as the corresponding node before the update
