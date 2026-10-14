## ADDED Requirements

### Requirement: API reference

The site SHALL have an API reference generated from the library's TypeScript source and doc comments at build time, grouped into pages by area, in the site's own design. Each entry SHALL show its signature, description, parameters, return value, properties, examples and related links, and SHALL mark experimental, deprecated and 1.x exports.

#### Scenario: Looking up an option

- **WHEN** a reader opens the line chart's options in the reference
- **THEN** each option shows its type, its default and what it does, and `axisX` lists the axis options with theirs

### Requirement: Linked types and code defaults

Type names in signatures and property tables SHALL link to their entries. Option properties of the presets SHALL show their defaults, taken from the library's defaults rather than written by hand.

#### Scenario: Following a type

- **WHEN** a reader clicks `ChartPlugin` in the signature of `withOptions`
- **THEN** the page shows the `ChartPlugin` entry

#### Scenario: A 1.x class

- **WHEN** a reader looks up `LineChart`
- **THEN** a short entry describes it as the 1.x class and links to `lineChart`

### Requirement: The reference is complete

Every export of `chartist` and `chartist/compat` SHALL appear on exactly one reference page. The docs check SHALL fail when an export has no entry or more than one, or when a reference link points nowhere.

#### Scenario: A new export

- **WHEN** the library exports a new function and the docs are checked
- **THEN** the check fails until the function has an entry
