## ADDED Requirements

### Requirement: Published package contents

The published `chartist` package SHALL contain its `package.json`, a README, the licenses (`LICENSE-MIT`, `LICENSE-WTFPL`) and the built `dist` folder, and nothing else: no sources, tests or configuration. It SHALL be published from the project folder as built, without a copy step that rewrites the package.

#### Scenario: Packed tarball

- **WHEN** the package is packed as it would be published
- **THEN** the tarball holds `package.json`, `README.md`, the two licenses and `dist/`, and every path of the `exports` map and the package fields points to a file in it

### Requirement: Package README

The package SHALL have a README for its npm page: what Chartist is, how to install it (with the npm `next` tag while v2 is in release candidates), a short example with the functional API, links to the docs, the 1.x docs and the changelog, and the license.

#### Scenario: npm page

- **WHEN** a release candidate is published
- **THEN** its npm page shows the README with the v2 install instructions and a link to chartist.dev

### Requirement: Package metadata for publishing

The package's `repository` field SHALL name `https://github.com/chartist-js/chartist` with the `packages/chartist` directory, as npm trusted publishing and provenance compare it with the publishing repository.

#### Scenario: Repository field

- **WHEN** the package's `package.json` is read
- **THEN** `repository.url` is the Chartist GitHub repository and `repository.directory` is `packages/chartist`
