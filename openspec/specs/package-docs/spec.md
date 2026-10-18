# package-docs Specification

## Purpose

Defines the Packages section of chartist.dev: the index of the `@chartist-js` packages and a subsite for each one, with its overview, guides and API page, built like the rest of the docs.

## Requirements

### Requirement: Packages in the header

The site SHALL have a "Packages" item in the header navigation, on desktop and in the mobile menu, linking to `/packages/`. On the package index and on every page of a package subsite, the header SHALL mark "Packages" as the current section.

#### Scenario: From any page

- **WHEN** a visitor follows "Packages" in the header
- **THEN** the package index opens and "Packages" is marked as the current section

### Requirement: Package index

`/packages/` SHALL present every `@chartist-js` package the site documents as a card, one package per row, with the preview next to the details on wide screens and above them at phone width. Each card SHALL show a preview of what the package draws, rendered by the package itself and part of the page's HTML, the package name and version, one sentence on what it does, its license (see "Package licenses"), and links to its overview, its guides and its API page. Install commands SHALL follow the prerelease rule of the rest of the site (`@next` while the version is a prerelease).

The index intro SHALL say that packages are made by Chartist's author, that some are free and some come with a paid license, and SHALL link to `/plugins/` for plugins from the community.

#### Scenario: The terminal package

- **WHEN** a visitor opens `/packages/`
- **THEN** `@chartist-js/terminal` has a card with a chart drawn as text art, its version, its description, `npm install @chartist-js/terminal` (or `@next` during release candidates) and links to `/packages/terminal/`, its guides and `/packages/terminal/api/`

#### Scenario: Phone width

- **WHEN** a visitor opens `/packages/` at a width of 390 px
- **THEN** each card shows its preview above its details and the page doesn't scroll horizontally

#### Scenario: Community plugins

- **WHEN** a visitor reads the intro of `/packages/`
- **THEN** it says the packages are the author's own and links to `/plugins/` for community plugins

### Requirement: Package licenses

Every documented package SHALL declare its license as free or commercial. A free package SHALL show the name of its license (for example MIT) and its install command. A commercial package SHALL show that it's licensed per year with support included, and a link to get a license in place of the install command. The package index and the landing page SHALL show the same license for a package.

#### Scenario: A free package

- **WHEN** a visitor looks at the card of `@chartist-js/terminal`
- **THEN** it says the package is free under its license and shows its install command

#### Scenario: A commercial package

- **WHEN** a package is registered as commercial and a visitor looks at its card
- **THEN** the card says it's a yearly license with support, shows a "Get a license" link to the address the package registers, and shows no install command

### Requirement: Package subsite

Each listed package SHALL have a subsite at `/packages/<name>/` with an overview page (what the package does, how to install it, a quick start), its guides at `/packages/<name>/<guide>/` and an API page at `/packages/<name>/api/`. Every page of a subsite SHALL show the package's navigation: its overview, its guides in order and its API page, with the current page marked.

#### Scenario: Navigating a package

- **WHEN** a reader opens `/packages/terminal/`
- **THEN** the package navigation lists the overview, the terminal rendering guide and the API page, and the overview is marked as current

#### Scenario: A new guide for a package

- **WHEN** a guide page is added to a package's content with a title and an order
- **THEN** it appears in that package's navigation at that place, and in its previous and next links

### Requirement: Package guides follow the docs rules

Package guides SHALL be built and checked like the core guides: written per `apps/docs/WRITING.md`, with at least one live example each, TypeScript samples type-checked, an "Edit this page on GitHub" link, an on-page table of contents, and previous and next links within the package.

#### Scenario: A sample that doesn't type-check

- **WHEN** a package guide contains a TypeScript sample with a type error
- **THEN** the docs samples check fails and names the guide and line

### Requirement: Package API page

A package's API page SHALL be generated at build time from the package's TypeScript source and doc comments, in the design of the core reference: each export with its signature, description, parameters, return value, properties and examples, and experimental and deprecated exports marked.

#### Scenario: An entry

- **WHEN** a reader opens `/packages/terminal/api/`
- **THEN** `renderToTerminal` shows its signature, its description, its options and its example

### Requirement: Package API is complete

Every export of a package's root entry SHALL appear on its API page exactly once, with a doc comment. Every `{@link}` and type reference SHALL resolve, to an entry of the package or, for `chartist` types, to the core reference.

#### Scenario: A chartist type in a package signature

- **WHEN** the terminal API page shows `lineChart(data: LineChartData, …)`
- **THEN** `LineChartData` links to its entry in the core API reference

#### Scenario: An undocumented export

- **WHEN** the package exports a function without a doc comment and the docs are checked
- **THEN** the check fails and names the export

### Requirement: Package pages everywhere pages are listed

Package pages SHALL have what the other docs pages have: a Markdown version, links in `/llms.txt` and content in `/llms-full.txt`, a share card, a place in the sitemap, search results grouped under "Packages", and the e2e checks every docs page gets (no console errors, axe in both themes, live examples run).

#### Scenario: An agent looking for the terminal API

- **WHEN** a tool fetches `/llms.txt`
- **THEN** it finds a Packages section with links to the Markdown versions of the terminal package's overview, guides and API page

#### Scenario: Searching for a package export

- **WHEN** a reader searches for `renderToTerminal`
- **THEN** a result under "Packages" links to its entry on the terminal API page
