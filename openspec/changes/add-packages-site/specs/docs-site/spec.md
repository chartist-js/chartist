# Spec Delta

## MODIFIED Requirements

### Requirement: API reference

The site SHALL have an API reference generated from the library's TypeScript source and doc comments at build time, grouped into pages by area, in the site's own design. Each entry SHALL show its signature, description, parameters, return value, properties, examples and related links, and SHALL mark experimental, deprecated and 1.x exports. Each `@chartist-js` package SHALL have an API page of its own in its package subsite, built the same way, whose references to `chartist` types link into this reference.

#### Scenario: Looking up an option

- **WHEN** a reader opens the line chart's options in the reference
- **THEN** each option shows its type, its default and what it does, and `axisX` lists the axis options with theirs

#### Scenario: A package's API

- **WHEN** a reader opens `/packages/terminal/api/`
- **THEN** each export of `@chartist-js/terminal` is listed with its signature and description, in the reference's design

### Requirement: The reference is complete

Every export of `chartist` and `chartist/compat` SHALL appear on exactly one reference page, and every export of a documented `@chartist-js` package on its package's API page. The docs check SHALL fail when an export has no entry or more than one, or when a reference link points nowhere.

#### Scenario: A new export

- **WHEN** the library exports a new function and the docs are checked
- **THEN** the check fails until the function has an entry

#### Scenario: A new package export

- **WHEN** `@chartist-js/terminal` exports a new function and the docs are checked
- **THEN** the check fails until the function has an entry with a doc comment on the package's API page

### Requirement: Site search

The site SHALL offer full-text search over the guides, the API reference, the package pages and the examples, built with the static site and served from the site's own origin. A search dialog SHALL open from the header and with Ctrl/Cmd+K, group results by section, link API results to their entry, and work with the keyboard alone.

#### Scenario: Finding an API entry

- **WHEN** a reader searches for `lineChart`
- **THEN** a result in the API section links to the `lineChart` entry

#### Scenario: Nothing loads before searching

- **WHEN** a page loads and the reader doesn't open the search
- **THEN** no search index or search code is requested

#### Scenario: Finding a package page

- **WHEN** a reader searches for `ct-cli`
- **THEN** results in the Packages section link to the terminal package's pages

### Requirement: Docs for language models

The site SHALL publish `/llms.txt` in the llmstxt.org format, with notes that v2 code uses the functional API and links to Markdown versions of every guide, API page, package page and example; `/llms-full.txt` with the guides, the API reference and the package pages in one file; and a Markdown version of each of those pages, generated from the same sources as the page.

#### Scenario: An agent writing Chartist code

- **WHEN** a tool fetches `/llms.txt`
- **THEN** it reads that v2 charts are created with `lineChart`, `barChart`, `pieChart` or `chart()`, and finds a link to each guide's Markdown

#### Scenario: A new guide

- **WHEN** a guide is added to the docs
- **THEN** its Markdown version and its `llms.txt` link exist without further work

#### Scenario: A new package guide

- **WHEN** a guide is added to a package's subsite
- **THEN** its Markdown version, its `llms.txt` link and its section in `llms-full.txt` exist without further work
