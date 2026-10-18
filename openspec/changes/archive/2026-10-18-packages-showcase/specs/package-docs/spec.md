## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Package licenses

Every documented package SHALL declare its license as free or commercial. A free package SHALL show the name of its license (for example MIT) and its install command. A commercial package SHALL show that it's licensed per year with support included, and a link to get a license in place of the install command. The package index and the landing page SHALL show the same license for a package.

#### Scenario: A free package

- **WHEN** a visitor looks at the card of `@chartist-js/terminal`
- **THEN** it says the package is free under its license and shows its install command

#### Scenario: A commercial package

- **WHEN** a package is registered as commercial and a visitor looks at its card
- **THEN** the card says it's a yearly license with support, shows a "Get a license" link to the address the package registers, and shows no install command
