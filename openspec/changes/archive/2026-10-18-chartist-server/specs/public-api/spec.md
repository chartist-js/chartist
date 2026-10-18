## MODIFIED Requirements

### Requirement: Experimental names are recorded

The names marked `@experimental` in each entry's declaration files SHALL be compared against a checked-in list, the same way as the deprecated names. Marking or unmarking a name SHALL require updating the list. From 2.0.0 on, the list SHALL hold only the exports of `chartist/live`, the container query names of `chartist` (`container`, `ContainerCondition`) and the server API of `chartist/server` (`renderToString`, `renderForHydration`, `computeStyles`, `applyStyles` and their types); every other export of `chartist`, `chartist/compat`, `chartist/server` (the re-exported `toScene` and `SceneSize`) and `@chartist-js/terminal` is stable and SHALL NOT be marked experimental.

#### Scenario: Stable core

- **WHEN** the API tests read the declarations of `chartist` at 2.0.0
- **THEN** only `container` and `ContainerCondition` are marked experimental, and the recorded list says so

#### Scenario: A new experimental export

- **WHEN** a change marks a new export of `chartist` as experimental without updating the recorded list
- **THEN** the suite fails and names the export

#### Scenario: Live updates stay experimental

- **WHEN** the API tests read the declarations of `chartist/live`
- **THEN** `liveDomRenderer`, `smilAnimations`, `diffScenes` and their option types are marked experimental, as the list records

#### Scenario: The server API is experimental

- **WHEN** the API tests read the declarations of `chartist/server`
- **THEN** `renderToString`, `renderForHydration`, `computeStyles`, `applyStyles` and their types are marked experimental, and `toScene` and `SceneSize` are not, as the list records

#### Scenario: Terminal

- **WHEN** the terminal package's tests read its declarations
- **THEN** no export is marked experimental
