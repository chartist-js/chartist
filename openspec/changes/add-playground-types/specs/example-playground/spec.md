## MODIFIED Requirements

### Requirement: TypeScript is stripped in the browser

The playground SHALL remove TypeScript type syntax in the browser, without a server. Running SHALL NOT depend on type checking: code with type errors SHALL still run, as in Vite. Type-only imports SHALL NOT fail at runtime.

#### Scenario: Typed example

- **WHEN** `src/main.ts` contains type annotations and imports types such as `PieChartOptions` from `chartist`
- **THEN** the chart renders and no type syntax reaches the browser

#### Scenario: Type error

- **WHEN** `src/main.ts` passes an option of the wrong type that Chartist tolerates at runtime
- **THEN** the chart renders, and the editor underlines the error

## ADDED Requirements

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
