## MODIFIED Requirements

### Requirement: Changes and cause in render and mount

The `render` and `mount` events SHALL carry:

- `cause`: why the chart rendered: `create` (the first render), `hydrate` (the first render of a chart that took server markup over), `update` (`update()` and the preset handles' option changes), `resize`, `responsive` or `fonts`;
- `previous`: the previous render's scene, absent on the first render;
- `changes`: what the render did to the output, in document order, each entry `add`, `update` (with the `previous` node) or `remove`. When the renderer returned its changes (it patched), they SHALL be those. Otherwise they SHALL describe a replacement: `remove` for every node of the previous scene and `add` for every node of the new one. A `hydrate` render SHALL describe its scene as a first render does: an `add` entry for every node;
- `hydration`, on `hydrate` renders only: `{ repaired }`, the number of differences between the server's markup and the browser's scene that were set.

In `mount`, each entry's element SHALL be available: for `add` and `update` the element in the page, for `remove` the element just taken out of it.

#### Scenario: First render

- **WHEN** a chart renders for the first time
- **THEN** `render` and `mount` get `cause: 'create'`, no `previous`, and an `add` entry for every node

#### Scenario: Taking server markup over

- **WHEN** a chart with `liveDomRenderer()` takes hydration markup over
- **THEN** `render` and `mount` get `cause: 'hydrate'`, no `previous`, an `add` entry for every node and `hydration.repaired`, and `elementOf` returns the server's elements

#### Scenario: An update with the DOM renderer

- **WHEN** a chart drawn with `domRenderer()` updates
- **THEN** `mount` gets `cause: 'update'`, a `remove` entry for every previous node and an `add` entry for every new one

#### Scenario: Resize

- **WHEN** the container is resized
- **THEN** `render` and `mount` get `cause: 'resize'`
