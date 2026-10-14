## ADDED Requirements

### Requirement: Plugins page

The site SHALL have a plugins page at `/plugins/`, reachable from a "Plugins" item in the header navigation. It SHALL show the curated community plugins as one list, sorted by monthly npm downloads, most downloaded first, and SHALL end with a "Write your own" section that links to the plugin guide. The page SHALL be in the site's design (both themes, accessible, phone width) and SHALL make no third-party requests.

#### Scenario: Reachable from the header

- **WHEN** a visitor follows "Plugins" in the header of any page
- **THEN** the plugins page opens and the header marks "Plugins" as the current section

#### Scenario: Most downloaded first

- **WHEN** the plugins page is rendered from a snapshot where plugin A has more monthly downloads than plugin B
- **THEN** A's entry comes before B's

### Requirement: Plugin entries credit their authors

Each plugin entry SHALL show the plugin's name, what it does in one or two sentences, its author by name, links to its source repository and its npm package, its license, its monthly npm downloads with the snapshot date, the chart types it works with, and its v2 status. When a plugin's repository no longer exists, the entry SHALL link to its npm package instead and say that the repository is gone. Each entry SHALL show how to load the plugin on v2 with script tags from a CDN, ready to copy.

#### Scenario: Credits and links

- **WHEN** a visitor reads the entry of `chartist-plugin-axistitle`
- **THEN** it names its author, links to its GitHub repository and to `https://www.npmjs.com/package/chartist-plugin-axistitle`, and shows its license and monthly downloads

#### Scenario: Repository gone

- **WHEN** a listed plugin's repository returns "not found" on GitHub
- **THEN** its entry links to the npm package as its source and says the repository is gone

### Requirement: Live plugin examples

Each plugin entry SHALL have a live example that runs the plugin's own published code on v2 and shows what it adds to a chart. The example SHALL be editable like the other live examples, and SHALL be able to open in the playground. A plugin that needs interaction to show its effect (a tooltip, zoom) SHALL say what to do in its example.

#### Scenario: The plugin's own code runs

- **WHEN** the live example of `chartist-plugin-pointlabels` renders
- **THEN** the chart shows a label at each point, drawn by the plugin's published code, without errors in the console

#### Scenario: Opens in the playground

- **WHEN** a visitor opens a plugin's live example in the playground
- **THEN** the playground runs it with the plugin loaded, as on the plugins page

### Requirement: Plugin list filter

The plugins page SHALL have a filter for the plugin list only: a text field that matches a plugin's name, package name, author or description, and a choice of chart type (all, line, bar, pie). The list SHALL update as the visitor types, SHALL say how many plugins match, and SHALL show a message with a link to "Write your own" when none match. Without JavaScript, the page SHALL show every plugin and no filter controls. The filter SHALL NOT search other pages or use the site search.

#### Scenario: Filter by text

- **WHEN** a visitor types "tooltip" into the filter
- **THEN** only the tooltip plugins remain in the list and the page says how many match

#### Scenario: Filter by chart type

- **WHEN** a visitor picks "pie"
- **THEN** only plugins that work with pie charts remain

#### Scenario: No match

- **WHEN** the filter matches no plugin
- **THEN** the page says so and links to "Write your own"

### Requirement: Plugin data

The listed plugins SHALL come from a curated list in the site's data: package name, title, description, author, links, license, chart types and v2 status. Their monthly downloads SHALL come from the committed, dated facts snapshot that the facts script writes from the npm API. The build SHALL fail when a listed plugin has no download count in the snapshot or when its code or license file is missing from the site.

#### Scenario: Missing download count

- **WHEN** a plugin is added to the curated list but the facts snapshot has no download count for it
- **THEN** the build fails and names the plugin

### Requirement: Plugin code is served by the site

The site SHALL serve each listed plugin's published code, at a pinned version, together with its license text, from its own origin. Live examples SHALL load the plugins from there, never from a CDN.

#### Scenario: No CDN requests

- **WHEN** a plugin's live example runs on the site
- **THEN** the plugin's script and Chartist's builds load from the site's own origin
