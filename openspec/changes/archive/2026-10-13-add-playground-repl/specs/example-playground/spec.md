# Spec Delta

## Purpose

Lets readers edit and run Chartist example projects (HTML + TypeScript + CSS, Vite app shape) live in the browser, from static hosting and without a server-side build, and take them to a full Vite project.

## ADDED Requirements

### Requirement: Runs Vite-style example projects unchanged

The playground SHALL accept an example as a set of files (path → content) in the `npm create vite` vanilla-ts layout: `index.html`, `src/main.ts` and optional further `src/*.ts` and `src/*.css` files. It SHALL run them without any change to the files, as long as the TypeScript only uses erasable syntax.

#### Scenario: Running a converted 1.x example

- **WHEN** the playground loads an example whose `index.html` contains `<div id="chart">` and `<script type="module" src="/src/main.ts">`, and whose `src/main.ts` imports `LineChart` from `chartist`
- **THEN** a chart (`svg.ct-chart-line`) renders in the preview

#### Scenario: Relative module imports

- **WHEN** `src/main.ts` imports a value from `./data` and the file `src/data.ts` exists
- **THEN** the import resolves to that file and the chart renders

### Requirement: TypeScript is stripped in the browser

The playground SHALL remove TypeScript type syntax in the browser, without a server and without type checking. Type-only imports SHALL NOT fail at runtime.

#### Scenario: Typed example

- **WHEN** `src/main.ts` contains type annotations and imports types such as `PieChartOptions` from `chartist`
- **THEN** the chart renders and no type syntax reaches the browser

### Requirement: CSS imports from TypeScript become style tags

An `import` of a CSS file from TypeScript SHALL apply that stylesheet to the preview document, as Vite does: `chartist/styles.css` from the configured stylesheet URL, and relative CSS files from the example's own files.

#### Scenario: Chartist stylesheet

- **WHEN** `src/main.ts` contains `import 'chartist/styles.css'`
- **THEN** the preview loads the Chartist stylesheet and the chart is styled by it

#### Scenario: Example stylesheet

- **WHEN** `src/main.ts` contains `import './style.css'` and `src/style.css` sets a series stroke color
- **THEN** the rendered series uses that color

### Requirement: Chartist resolves to a configurable build

The host SHALL configure which URLs the bare specifiers `chartist` and `chartist/styles.css` resolve to in the preview, so the docs can run their own build of the workspace library. The URLs MAY be relative to the host page.

#### Scenario: Docs build under a base path

- **WHEN** the host page is served at `/chartist/` and configures the library URL relative to its base
- **THEN** the preview imports `chartist` from that URL and the chart renders

### Requirement: Preview runs in an isolated sandbox

Example code SHALL run in an iframe with `sandbox="allow-scripts"` and without `allow-same-origin`, so it runs in an opaque origin and cannot access the host page, its storage or its cookies.

#### Scenario: Example tries to reach the host

- **WHEN** example code reads `parent.document`
- **THEN** the access throws a security error and the host page is unaffected

### Requirement: Errors and console output reach the host

The playground SHALL report compile errors (with file and position where available), uncaught runtime errors, unhandled promise rejections, module loading errors and `console` output of the preview to the host page and SHALL show errors in the UI.

#### Scenario: Syntax error while editing

- **WHEN** the user introduces a syntax error in `src/main.ts`
- **THEN** the error panel shows the error with the file name, and the previous preview stays visible

#### Scenario: Runtime error

- **WHEN** example code throws during execution
- **THEN** the error panel shows the error message

#### Scenario: Console output

- **WHEN** example code calls `console.log('hi')`
- **THEN** the host receives a log entry with the text `hi`

### Requirement: Live editing

The playground SHALL show each example file in its own editor tab and re-render the preview automatically shortly after the user stops typing.

#### Scenario: Editing data

- **WHEN** the user changes the series data in `src/main.ts`
- **THEN** after the debounce delay the preview re-renders with the new data

### Requirement: Open in StackBlitz

The playground SHALL offer to open the current files, including unsaved edits, as a Vite project in StackBlitz, adding a generated `package.json` with `vite`, `typescript` and `chartist` as dependencies.

#### Scenario: Exporting an example

- **WHEN** the user clicks "Open in StackBlitz"
- **THEN** a StackBlitz project opens with the example's files and a `package.json` whose `dev` script runs Vite

### Requirement: Static hosting in all major engines

The playground SHALL work from static files under a non-root base path with no special response headers beyond CORS for the library URL, and SHALL run in Chromium, Firefox and WebKit.

#### Scenario: Built demo under a base path

- **WHEN** the built demo is served at `/chartist/` and opened in Chromium, Firefox or WebKit
- **THEN** every demo example renders its chart, editing re-renders, and syntax errors are shown
