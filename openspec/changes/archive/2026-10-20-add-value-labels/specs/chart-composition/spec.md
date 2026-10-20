## ADDED Requirements

### Requirement: Annotating layers

A layer SHALL be able to define an optional `annotate` method, for layers that draw from where other layers drew, such as labels on bars. Once the nodes of every layer without `annotate` have been composed, keyed, refined and passed through the `compose` events, `annotate` SHALL be called with those finished top-level nodes, in the order of `layers`, and the annotating layer's own compose context. The nodes it returns SHALL be keyed with the annotating layer's index, refined and passed through the `compose` events like any layer's nodes, and SHALL be drawn after the nodes the layer's `compose` returned, at the layer's place in `layers`. An annotating layer SHALL NOT see the nodes of other annotating layers. The draw order SHALL stay the order of `layers`. Charts without an annotating layer SHALL render exactly as before. Custom layers SHALL be able to define `annotate` like built-in ones and the layers of maintained packages.

#### Scenario: Labels on another layer's bars

- **WHEN** a custom layer listed after a bar layer defines `annotate` that returns a `text` node at the end of every `bar` node it receives
- **THEN** the output has one text per bar, at each bar's end, after the bars

#### Scenario: Listeners run first

- **WHEN** a `compose` listener drops the bar of value index 1 and adds the class `ct-high` to the bar of index 2
- **THEN** `annotate` receives no bar for index 1 and the bar of index 2 with the class `ct-high`

#### Scenario: Draw order

- **WHEN** an annotating layer is listed before a line layer
- **THEN** its nodes come before the line layer's nodes in the scene, and it still receives the line layer's points

#### Scenario: The annotating layer's nodes

- **WHEN** an annotating layer returns nodes with a role and a series and value index
- **THEN** each gets a key with the annotating layer's index, and `compose` listeners receive them

#### Scenario: Two annotating layers

- **WHEN** a chart has two annotating layers
- **THEN** neither receives the other's nodes

#### Scenario: No annotating layer

- **WHEN** a chart has no layer with `annotate`
- **THEN** its scene equals the scene before annotating layers existed
