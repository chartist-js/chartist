# example-playground Specification

## Purpose

Lets readers edit and run Chartist example projects (HTML + TypeScript + CSS, Vite app shape) live in the browser, from static hosting and without a server-side build, and take them to a full Vite project.

## Requirements

### Requirement: Runs Vite-style example projects unchanged

The playground SHALL accept an example as a set of files (path → content) in the `npm create vite` vanilla-ts layout: `index.html`, `src/main.ts` and optional further `src/*.ts` and `src/*.css` files. It SHALL run them without any change to the files, as long as the TypeScript only uses erasable syntax.

#### Scenario: Running a converted 1.x example

- **WHEN** the playground loads an example whose `index.html` contains `<div id="chart">` and `<script type="module" src="/src/main.ts">`, and whose `src/main.ts` imports `LineChart` from `chartist`
- **THEN** a chart (`svg.ct-chart-line`) renders in the preview

#### Scenario: Relative module imports

- **WHEN** `src/main.ts` imports a value from `./data` and the file `src/data.ts` exists
- **THEN** the import resolves to that file and the chart renders

### Requirement: TypeScript is stripped in the browser

The playground SHALL remove TypeScript type syntax in the browser, without a server. Running SHALL NOT depend on type checking: code with type errors SHALL still run, as in Vite. Type-only imports SHALL NOT fail at runtime.

#### Scenario: Typed example

- **WHEN** `src/main.ts` contains type annotations and imports types such as `PieChartOptions` from `chartist`
- **THEN** the chart renders and no type syntax reaches the browser

#### Scenario: Type error

- **WHEN** `src/main.ts` passes an option of the wrong type that Chartist tolerates at runtime
- **THEN** the chart renders, and the editor underlines the error

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

### Requirement: Configurable toolbar actions

The playground SHALL render its toolbar actions from an option: built-in reset, copy, share, open-in-playground and StackBlitz actions, and custom actions with a label and a handler. Pages SHALL NOT need to change the playground's markup to add an action.

#### Scenario: A page adds Reset and Share

- **WHEN** a page creates a playground with the reset and share actions
- **THEN** the toolbar shows both buttons, Reset restores the original files and Share copies the address the page's callback builds

### Requirement: Inline and full layouts

The playground SHALL offer an inline layout for a live example within a page and a full layout that fills its element, with the editor and the preview side by side.

#### Scenario: Full-screen playground

- **WHEN** a page creates a playground with the full layout in an element that fills the viewport
- **THEN** the editor, the preview and the error and console panel fill it without scrolling the page

### Requirement: Preview without the editor

The playground package SHALL provide a preview component that compiles and runs example files in the sandbox without loading the editor, reports errors and console output like the playground, and can replace its files and preview styles.

#### Scenario: Running an example before editing

- **WHEN** a page creates a preview for an example's files
- **THEN** the example renders in a sandboxed frame and no editor code is loaded

### Requirement: Themeable through custom properties

The playground's own styles SHALL read their colors, fonts and radii from custom properties with neutral defaults, in a cascade layer of their own, so a page themes the playground by setting properties and never by overriding the playground's internal classes.

#### Scenario: Site theme

- **WHEN** a page sets the playground's custom properties from its design tokens
- **THEN** the toolbar, tabs, editor, preview frame and panel take the page's look in light and dark mode

### Requirement: Shareable code

The playground package SHALL encode a set of files and a title into a compact, versioned, URL-safe string and decode it back, rejecting malformed or unknown-version input with an error instead of throwing an uncaught exception.

#### Scenario: Round trip

- **WHEN** files with non-ASCII text are encoded and the result is decoded
- **THEN** the decoded files equal the original files

### Requirement: Type-aware editing

When the host configures Chartist's type declarations, the playground SHALL type-check the example's TypeScript files against them and the browser's DOM types as the user types: it SHALL underline errors with their messages, offer completions with their types and documentation, and show the type and documentation of a symbol on hover. Diagnostics SHALL be reachable from the keyboard. CSS and HTML files SHALL offer completions too.

#### Scenario: A misspelled event

- **WHEN** the user types `chart.on('compsoe', …)`
- **THEN** shortly after typing stops, the event name is underlined with a message that it isn't an event of the chart

#### Scenario: Completing a narrowed node

- **WHEN** inside `if (node.role === 'point')` the user types `node.ctx.`
- **THEN** the completions include `x`, `y` and `valueIndex`

#### Scenario: Hover

- **WHEN** the user points at `lineChart`
- **THEN** a tooltip shows its signature and doc comment

#### Scenario: Several files

- **WHEN** `src/main.ts` imports a function from `src/plugin.ts` and calls it with a wrong argument
- **THEN** the call is underlined in `src/main.ts`

### Requirement: Types load on demand

Nothing type-related SHALL load until the user focuses a TypeScript editor. The type service SHALL run off the main thread, SHALL load from the page's origin and the configured declaration URL only, and SHALL leave plain editing working if it can't start.

#### Scenario: Reading without editing

- **WHEN** a page with live examples loads and the reader doesn't focus an editor
- **THEN** no type service code or declaration files are requested

#### Scenario: Declarations unavailable

- **WHEN** the declaration URL fails to load
- **THEN** editing and running work, and `chartist` imports are treated as untyped
