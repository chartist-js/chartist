## ADDED Requirements

### Requirement: Server imports in the docs

The docs SHALL import `renderToString`, `renderForHydration` and `applyStyles` from `chartist/server` in every guide, example, code sample and page script, and the playground SHALL resolve `chartist/server` like `chartist/live`. The server rendering guide SHALL show `applyStyles()` for markup that goes into images, PDFs and email, say that it bakes the given CSS into attributes with custom properties and `light-dark()` resolved, which color scheme it uses, which CSS it leaves out, and that only stylesheets the application controls should be passed; and it SHALL say that the server API is experimental.

#### Scenario: Styling an image

- **WHEN** a reader opens the server rendering guide's section on where the markup goes
- **THEN** it shows `applyStyles(scene, css)` with Chartist's stylesheet read from `chartist/styles.css`, rendered with `renderToString()`, both imported from `chartist/server`

#### Scenario: No old imports

- **WHEN** the docs' code samples are type-checked
- **THEN** none imports `renderToString` or `renderForHydration` from `chartist`

#### Scenario: Playground

- **WHEN** a playground project imports `renderToString` from `chartist/server`
- **THEN** it runs against the current build
