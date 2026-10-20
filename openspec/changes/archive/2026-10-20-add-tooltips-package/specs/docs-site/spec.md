## MODIFIED Requirements

### Requirement: Plugin list filter

The plugins page SHALL have a filter for the plugin tiles only: a text field that matches a plugin's name, package name, author or description, and a choice of chart type (all, line, bar, pie). The tiles SHALL update as the visitor types, the page SHALL say how many plugins match, and SHALL show a message with a link to "Write your own" when none match. Without JavaScript, the page SHALL show every tile and no filter controls. The filter SHALL NOT search other pages or use the site search.

#### Scenario: Filter by text

- **WHEN** a visitor types "threshold" into the filter
- **THEN** only the tiles of plugins that match "threshold" remain and the page says how many match

#### Scenario: Filter by chart type

- **WHEN** a visitor picks "pie"
- **THEN** only the tiles of plugins that work with pie charts remain

#### Scenario: No match

- **WHEN** the filter matches no plugin
- **THEN** the page says so and links to "Write your own"

### Requirement: Old plugin links keep working

A link to an entry of the former single-page list, `/plugins/#<slug>`, SHALL land on that plugin's page while the plugin is listed; a link to a plugin that has left the list SHALL stay on the plugins overview. Links within the site SHALL point to the plugin pages directly.

#### Scenario: Old anchor

- **WHEN** a visitor opens `/plugins/#chartist-plugin-threshold`
- **THEN** the page of `chartist-plugin-threshold` opens

### Requirement: Plugins the core replaces

A plugin whose use case the core covers SHALL NOT be listed on the plugins page. When its page was published, its URL SHALL redirect to the docs page that covers the use case. A plugin that an official `@chartist-js` package replaces SHALL NOT be listed either, and its page and live example SHALL be removed from the site without a redirect. Every link to such a removed page, within the site, in its tests and in the redirect pages for the 0.x site, SHALL point to the package's docs instead, so no link of the site leads to a removed page.

#### Scenario: The target line plugin

- **WHEN** a visitor opens `/plugins/chartist-plugin-targetline/`
- **THEN** they land on the target lines and bands guide, and the plugins overview has no tile for `chartist-plugin-targetline`

#### Scenario: The tooltip plugins

- **WHEN** the site is built
- **THEN** it has no page and no redirect page at `/plugins/chartist-plugin-tooltips/` or `/plugins/stklcode-chartist-plugin-tooltips/`, and the plugins overview has no tooltip tile

#### Scenario: The 0.x tooltip example

- **WHEN** the 0.x redirect table is read for the old plugins page's `#tooltip-plugin` or `#example-plugin-tooltip` anchor
- **THEN** its target is `/packages/tooltips/`, a page of the built site
