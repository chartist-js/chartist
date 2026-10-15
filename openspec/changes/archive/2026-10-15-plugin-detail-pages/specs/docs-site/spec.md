## MODIFIED Requirements

### Requirement: Plugins page

The site SHALL have a plugins page at `/plugins/`, reachable from a "Plugins" item in the header navigation. It SHALL show the curated community plugins as an overview of tiles, sorted by monthly npm downloads, most downloaded first, each linking to the plugin's own page, and SHALL end with a "Write your own" section that links to the plugin guide. The page SHALL be in the site's design (both themes, accessible, phone width) and SHALL make no third-party requests.

#### Scenario: Reachable from the header

- **WHEN** a visitor follows "Plugins" in the header of any page
- **THEN** the plugins page opens and the header marks "Plugins" as the current section

#### Scenario: Most downloaded first

- **WHEN** the plugins page is rendered from a snapshot where plugin A has more monthly downloads than plugin B
- **THEN** A's tile comes before B's

#### Scenario: A tile at a glance

- **WHEN** a visitor looks at a plugin's tile
- **THEN** it shows a small live preview of the plugin's example, the plugin's title and description, its tags, its chart types and its monthly downloads, and the whole tile links to the plugin's page

#### Scenario: Room to breathe

- **WHEN** the overview is shown on a wide screen and at phone width
- **THEN** it shows at most two tiles per row on the wide screen and one at phone width, without horizontal scrolling

### Requirement: Plugin entries credit their authors

Each plugin's page SHALL show the plugin's name, what it does in one or two sentences, its author by name, links to its source repository and its npm package, and its license. When a plugin's repository no longer exists, the page SHALL link to its npm package instead and say that the repository is gone.

#### Scenario: Credits and links

- **WHEN** a visitor reads the page of `chartist-plugin-axistitle`
- **THEN** it names its author, links to its GitHub repository and to `https://www.npmjs.com/package/chartist-plugin-axistitle`, and shows its license and monthly downloads

#### Scenario: Repository gone

- **WHEN** a listed plugin's repository returns "not found" on GitHub
- **THEN** its page links to the npm package as its source and says the repository is gone

### Requirement: Plugin entries show their facts and setup

Each plugin's page SHALL show its monthly npm downloads with the snapshot date, the chart types it works with, the Chartist API version it was written for as a tag (`API v0.x`, `API v1.x` or `API v2.x`, so it isn't taken for the plugin's own version), how it loads on v2 (an `ES module` tag, or a `Global` tag marked as a warning for a script that reads the global `Chartist`), and whether it works in server rendering (an `SSR` or `No SSR` tag). It SHALL show how to load the plugin on a site, ready to copy: script tags from a CDN for a script, imports for an ES module. The tile on the overview SHALL show the same tags.

#### Scenario: Version tag

- **WHEN** a visitor reads the page or the tile of a plugin written for Chartist 0.x
- **THEN** it carries an `API v0.x` tag

#### Scenario: SSR tag

- **WHEN** a visitor reads the page of a plugin written for the 0.x or 1.x API
- **THEN** it carries a `No SSR` tag, since 1.x events don't fire in server rendering

#### Scenario: Setup for a script

- **WHEN** a visitor reads the page of a plugin that loads as a script
- **THEN** it shows script tags for Chartist's UMD build, its compat UMD build and the plugin, from a CDN

### Requirement: Live plugin examples

Each plugin's page SHALL have a live example that runs the plugin's own published code on v2 and shows what it adds to a chart. The example SHALL be editable like the other live examples, and SHALL be able to open in the playground. A plugin that needs interaction to show its effect (a tooltip, zoom) SHALL say what to do in its example. The overview's tile previews SHALL run the same example.

#### Scenario: The plugin's own code runs

- **WHEN** the live example of `chartist-plugin-pointlabels` renders on its page
- **THEN** the chart shows a label at each point, drawn by the plugin's published code, without errors in the console

#### Scenario: Opens in the playground

- **WHEN** a visitor opens a plugin's live example in the playground
- **THEN** the playground runs it with the plugin loaded, as on the plugin's page

#### Scenario: Tile preview

- **WHEN** the tile of `chartist-plugin-pointlabels` scrolls into view on the overview
- **THEN** its preview draws the example's chart with the plugin's labels, without errors in the console

### Requirement: Plugin list filter

The plugins page SHALL have a filter for the plugin tiles only: a text field that matches a plugin's name, package name, author or description, and a choice of chart type (all, line, bar, pie). The tiles SHALL update as the visitor types, the page SHALL say how many plugins match, and SHALL show a message with a link to "Write your own" when none match. Without JavaScript, the page SHALL show every tile and no filter controls. The filter SHALL NOT search other pages or use the site search.

#### Scenario: Filter by text

- **WHEN** a visitor types "tooltip" into the filter
- **THEN** only the tooltip plugins' tiles remain and the page says how many match

#### Scenario: Filter by chart type

- **WHEN** a visitor picks "pie"
- **THEN** only the tiles of plugins that work with pie charts remain

#### Scenario: No match

- **WHEN** the filter matches no plugin
- **THEN** the page says so and links to "Write your own"

## ADDED Requirements

### Requirement: A page per plugin

Each listed plugin SHALL have a page at `/plugins/<slug>/`, where the slug is its npm package name with the scope's `@` dropped and `/` replaced by `-`. The page SHALL have a breadcrumb back to the overview, links to the previous and next plugin in the overview's order, a Markdown version at `/plugins/<slug>.md`, a share card, and SHALL be in the site search and the sitemap. `llms.txt` SHALL list the plugin pages.

#### Scenario: From tile to page and back

- **WHEN** a visitor clicks the tile of `chartist-plugin-legend` and then the breadcrumb
- **THEN** the plugin's page opens at `/plugins/chartist-plugin-legend/`, and the breadcrumb leads back to the overview

#### Scenario: Next plugin

- **WHEN** a visitor follows "Next" on a plugin's page
- **THEN** the page of the next plugin in the overview's order opens

#### Scenario: Markdown version

- **WHEN** a tool fetches `/plugins/chartist-plugin-legend.md`
- **THEN** it gets the plugin's facts, setup and example code as Markdown, and `llms.txt` links to it

### Requirement: Old plugin links keep working

A link to an entry of the former single-page list, `/plugins/#<slug>`, SHALL land on that plugin's page. Links within the site SHALL point to the plugin pages directly.

#### Scenario: Old anchor

- **WHEN** a visitor opens `/plugins/#stklcode-chartist-plugin-tooltips`
- **THEN** the page of `@stklcode/chartist-plugin-tooltips` opens
