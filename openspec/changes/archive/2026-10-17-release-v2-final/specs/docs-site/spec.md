## MODIFIED Requirements

### Requirement: Experimental features are marked

Docs for experimental or polyfill-dependent features SHALL say so at the start of their section, name what they need or why they may still change, and link the relevant standards discussion where there is one. Stable APIs SHALL NOT carry experimental marks in the guides. The API reference SHALL explain what its experimental badge means: the export may still change in a 2.x minor.

#### Scenario: Container queries

- **WHEN** a reader opens the container queries section
- **THEN** a warning says `container()` is experimental, needs the `match-container` polyfill until browsers ship `Element.matchContainer()`, and links csswg-drafts#6205

#### Scenario: Live updates

- **WHEN** a reader opens the live updates guide
- **THEN** it says that `chartist/live` is experimental: new with 2.0, it may still change in a 2.x minor before it becomes stable

#### Scenario: Stable composition

- **WHEN** a reader opens the composed charts, custom layers or target lines and bands guide
- **THEN** none of them says the functional API, the layer contract or the layers are experimental
