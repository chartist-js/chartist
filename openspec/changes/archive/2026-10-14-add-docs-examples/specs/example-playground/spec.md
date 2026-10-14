## ADDED Requirements

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
