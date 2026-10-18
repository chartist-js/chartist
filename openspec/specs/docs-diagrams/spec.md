# docs-diagrams Specification

## Purpose

Defines how the docs site shows diagrams: written as Mermaid text next to the docs, rendered to SVG when the site is built, styled with the site's design tokens in light and dark mode, and accessible.

## Requirements

### Requirement: Diagrams from text, rendered at build time

Diagrams on the docs site SHALL be written as Mermaid sources, one per file, in the docs app, and rendered to SVG when the site is built or served by the dev server, not in the reader's browser. Pages SHALL load no Mermaid script. Rendered diagrams SHALL be cached by their source and the render settings, so a diagram that didn't change isn't rendered again.

#### Scenario: A page with a diagram

- **WHEN** a page with a diagram is loaded without JavaScript
- **THEN** the diagram is shown, as an inline SVG in the page's HTML

#### Scenario: No Mermaid in the browser

- **WHEN** a page with a diagram loads
- **THEN** it requests no Mermaid script or stylesheet

#### Scenario: An unchanged diagram

- **WHEN** the site is built again without changes to a diagram's source or the render settings
- **THEN** the diagram comes from the cache, without starting a browser for it

### Requirement: Including a diagram in a page

A page SHALL include a diagram by importing its source as text and passing it to the docs' diagram component, with an optional caption, which renders the diagram as a figure. Saving a source SHALL update the page in the dev server. A source with a Mermaid syntax error, without an accessible title or description, or with a color the site's tokens don't cover SHALL fail the build and the dev server's render, naming the file and the problem.

#### Scenario: Including a diagram

- **WHEN** an MDX page imports `../../diagrams/ssr-hydration/flow.mmd?raw` and renders `<Diagram source={flow} caption="…" />`
- **THEN** the built page has the diagram as an inline SVG in a figure with that caption

#### Scenario: A syntax error

- **WHEN** a diagram source has a Mermaid syntax error
- **THEN** the build fails and names the source file and Mermaid's error

#### Scenario: Editing in the dev server

- **WHEN** an author saves a change to a diagram source while the dev server runs
- **THEN** the page shows the diagram as changed

### Requirement: Diagrams in the design system

Diagrams SHALL be styled by the site's stylesheet with the design tokens, not by styles from Mermaid: nodes, edges, labels, notes, actors and messages SHALL use the site's colors, fonts, line weights and radii, in flowcharts, sequence diagrams and state diagrams. A diagram SHALL follow the page's light or dark mode without being rendered twice. A node SHALL be able to take the `brand`, `accent`, `muted` or `code` class for the matching emphasis. Other diagram types SHALL at least use the site's colors and fonts. The rendered SVG SHALL contain no `style` element and no inline `style` attributes, and no colors other than the tokens.

#### Scenario: Dark mode

- **WHEN** the reader switches the site to dark mode on a page with a diagram
- **THEN** the diagram's node fills, lines and text change to the dark tokens, with the same SVG

#### Scenario: Emphasis

- **WHEN** a flowchart node has the class `accent`
- **THEN** it is drawn with the accent token, in both modes

#### Scenario: Text fits

- **WHEN** a diagram is shown with the site's fonts
- **THEN** no label overflows its node, since the text was measured with the same fonts when it was rendered

### Requirement: Accessible diagrams

Every diagram source SHALL have an accessible title and description (`accTitle`, `accDescr`), and rendering SHALL fail without them. The SVG SHALL keep Mermaid's role and the references to its title and description. Ids inside a diagram's SVG SHALL be unique on the page, also with several diagrams on it. The page with a diagram SHALL pass the site's accessibility checks in both modes.

#### Scenario: A diagram without a description

- **WHEN** a source has no `accDescr`
- **THEN** rendering fails and names the source

#### Scenario: Two diagrams on a page

- **WHEN** a page shows two diagrams
- **THEN** no id appears twice in the page

### Requirement: Diagrams fit the page

A diagram SHALL scale down to the width of the content column, keep its aspect ratio, and never be drawn wider than its rendered size. The page SHALL NOT scroll horizontally because of a diagram at 375 px.

#### Scenario: A phone

- **WHEN** a page with a diagram is shown at 375 px
- **THEN** the diagram fits the column and the page doesn't scroll horizontally

### Requirement: The hydration flow as a diagram

The SSR with hydration guide SHALL show a diagram of the flow: on the server, the config and `renderForHydration()` give marked markup at the server's size; in the browser, the page shows the markup scaled before the chart runs, the chart takes it over with the cause `hydrate`, and lays itself out at the container's size with the cause `resize` when the size differs.

#### Scenario: The SSR with hydration guide

- **WHEN** a reader opens the SSR with hydration guide
- **THEN** a diagram near its start shows the server, the markup in the page, the `hydrate` render and the `resize` render, with a caption
