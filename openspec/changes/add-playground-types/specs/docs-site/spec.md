## ADDED Requirements

### Requirement: Typed live examples

The site SHALL serve the type declarations of the Chartist build its live examples run, from its own origin, and its live examples, example pages and full-screen playground SHALL use them for type-aware editing.

#### Scenario: Editing a live example

- **WHEN** a reader edits a live example and types `lineChart(` in `src/main.ts`
- **THEN** the editor shows the function's parameters, and no request leaves the site's origin
