# docs-site Specification

## Purpose

Defines the Chartist documentation website: how it is built, its design system and themes, live charts, the docs layout and content pipeline, and its accessibility.

## Requirements

### Requirement: Static site built with Nx

The documentation site SHALL be a static Astro app in `apps/docs`, built through Nx (`pnpm nx build docs`) against the workspace build of `chartist`, so the site always uses the current library.

#### Scenario: Build

- **WHEN** `pnpm nx build docs` runs in a clean checkout
- **THEN** `chartist` is built first and the site is written as static files

### Requirement: Brand design system

The site SHALL implement the design tokens and components of `docs/visual-design` (palette, semantic tokens for light and dark, typography, spacing, radii, shadows, motion). The tokens SHALL be defined once as CSS custom properties and exposed as the Tailwind theme, and components SHALL be styled with Tailwind utilities from that theme. Animations, scroll timelines, the chart theme (`--ct-*`) and styles for generated HTML (MDX prose, code highlighting, the editor) SHALL stay plain CSS. Fonts SHALL be self-hosted; pages SHALL make no requests to third-party hosts, except the visitor counter on the live site (see "Visitor counting").

#### Scenario: No third-party requests

- **WHEN** any page of the built site loads anywhere but on chartist.dev
- **THEN** every request goes to the site's own origin

#### Scenario: One source for colors

- **WHEN** a token in `tokens.css` changes
- **THEN** every utility class that uses it changes with it, in light and dark mode, without editing components

### Requirement: Light and dark mode

The site SHALL use the light theme by default, regardless of the OS color scheme, and offer a toggle whose choice persists across pages and visits. The saved theme SHALL apply before the first paint, and the page SHALL declare the matching `color-scheme`.

#### Scenario: Light by default

- **WHEN** a first-time visitor whose OS uses dark mode opens the site
- **THEN** the site renders in the light theme

#### Scenario: Toggle persists

- **WHEN** a visitor switches to dark mode and opens another page
- **THEN** that page renders dark from the first paint, with `color-scheme: dark`

### Requirement: Live Chartist charts

Every chart on the site SHALL be rendered by Chartist with the functional API and themed only through the library's `--ct-*` custom properties, in a box whose size is reserved before the chart renders.

#### Scenario: Chart in dark mode

- **WHEN** a page with a chart is shown in dark mode
- **THEN** the chart's labels and grid use the dark tokens, without re-rendering the chart

#### Scenario: No layout shift

- **WHEN** a page with charts loads
- **THEN** the charts render into their reserved boxes without moving other content

### Requirement: Docs layout and content

Docs pages SHALL come from an MDX content collection and render in a layout with a sidebar built from the collection, an on-page table of contents, previous and next links, an "Edit this page on GitHub" link, a mobile menu, and a version switcher linking to the v1 and v0 docs.

#### Scenario: Navigation from content

- **WHEN** a new MDX page with a group and order is added to the collection
- **THEN** it appears in the sidebar at that place and in the previous and next links of its neighbors

### Requirement: Getting started without a bundler

The Getting started page SHALL first show a no-bundler setup (a `<script type="module">` importing Chartist from a CDN and the stylesheet link), then npm, using the functional API and the package's real paths, with a live chart.

#### Scenario: Copied snippet works

- **WHEN** the page's HTML snippet is saved as a file and opened in a browser
- **THEN** it renders the chart shown on the page

### Requirement: Accessible pages

Every page SHALL pass automated WCAG AA checks, be fully usable with the keyboard with visible focus, and replace motion with a calm alternative when `prefers-reduced-motion` is set.

#### Scenario: Automated checks

- **WHEN** the e2e suite runs axe in light and dark mode, on one page per template (and the pages with components of their own) on every push, and on every page before a release
- **THEN** it reports no violations

### Requirement: Not found page

Unknown paths SHALL show a 404 page with the mascot and links back to the docs and the home page.

#### Scenario: Unknown path

- **WHEN** a visitor opens a path that doesn't exist
- **THEN** the 404 page with the `lost` mascot is shown

### Requirement: Landing page

The home page SHALL present Chartist as in the approved design: hero with the mascot and a live chart, numbers, a scroll story whose easel chart changes per chapter, features with live demos, the rendering pipeline with a plugin demo, a gallery, an inline live editor, responsive and animation showcases, the comparison, the ecosystem, community and sponsor, and a finale. All charts on it SHALL be rendered by Chartist, and all code samples SHALL use the v2 API as it exists.

#### Scenario: Story chapters

- **WHEN** a visitor scrolls the story so that the "Bars" chapter is in view
- **THEN** the mascot's board shows a bar chart rendered by Chartist and the chapter navigation marks the story section as current

#### Scenario: Code samples run

- **WHEN** a code sample from the landing page is run against the current build
- **THEN** it executes without errors and draws the chart it describes

### Requirement: Sourced facts

Numbers and comparison values on the site SHALL come from a committed, dated snapshot produced by a script from their sources (npm, GitHub, measurements, the libraries' documentation), never typed into pages. The page SHALL show the snapshot date, and the build SHALL fail if a value is missing.

#### Scenario: No placeholders

- **WHEN** the site is built
- **THEN** no page contains a placeholder such as `[N]`, `[MEASURED]` or `[DATE]`, and the shown numbers equal those in the snapshot

### Requirement: Used by

The landing page SHALL show a "Used by" list of well-known projects that use Chartist, curated in the site's data. Every entry SHALL show the project's name and link to the `package.json` in its public repository that lists Chartist; the facts script SHALL keep an entry only while that file still lists Chartist. Entries SHALL be removable through an exclude list. The list SHALL end with an invitation to tell the project about your use of Chartist (a GitHub Discussions "Show and tell" post).

#### Scenario: Entry with evidence

- **WHEN** the "Used by" list is rendered
- **THEN** each entry shows the project's name and links to the `package.json` in its repository that lists Chartist

#### Scenario: A project drops Chartist

- **WHEN** the facts script runs and a listed project's `package.json` no longer lists Chartist
- **THEN** the project leaves the list and the script names it in a warning

#### Scenario: Invitation

- **WHEN** a visitor follows the invitation at the end of the list
- **THEN** a new "Show and tell" discussion opens on the Chartist repository

### Requirement: Fair comparison

The comparison with Chart.js, ApexCharts and Highcharts SHALL show measured bundle sizes with the method and date, and feature and license rows whose sources are listed once per library, linked. It SHALL include rows where the other libraries offer more.

#### Scenario: Reproducible sizes

- **WHEN** the facts script runs twice with the same pinned versions
- **THEN** it reports the same bundle sizes

### Requirement: Inline live example

Docs pages and the landing page SHALL be able to embed a live example: an editor next to a live chart that re-renders as the code changes, running in the page without third-party services, with copy and reset actions.

#### Scenario: Editing redraws

- **WHEN** a visitor changes a number in the live example's data
- **THEN** the chart re-renders with the new value without a page reload

### Requirement: Motion with calm alternatives

Scroll-driven and decorative motion on the site SHALL use CSS where possible and SHALL have a static alternative under `prefers-reduced-motion: reduce` that keeps all content and controls available.

#### Scenario: Reduced motion

- **WHEN** the landing page is opened with reduced motion
- **THEN** no animation runs, charts are shown fully drawn, and the SMIL showcase is replaced by a static chart

### Requirement: Site screenshot comparison

The site SHALL have a target that captures the landing sections, the first live example in edit mode, Getting started and the 404 page at a desktop and a phone width, in light and dark mode, with motion settled, and compares them with a baseline taken on demand, reporting each differing screenshot with before, after and diff images.

#### Scenario: A style change shows up

- **WHEN** a change alters how a section looks and the comparison runs against the baseline from before the change
- **THEN** the report lists that section's screenshots with their differences, and unchanged sections are not listed

### Requirement: Guides and chart type pages

The docs SHALL have pages for each chart type (line, bar, pie and donut, composed) and guides for data and options, sizing, styling with CSS, responsive options, axes and scales, target lines and bands, animations, events and plugins, custom layers, server rendering, updating charts, and security and CSP. They SHALL use the functional API, show at least one live example each, and follow the writing guide in `apps/docs/WRITING.md`. Guides and examples SHALL NOT put chart output into a page with `innerHTML`; they SHALL use the DOM renderer or an element output.

#### Scenario: A guide runs as written

- **WHEN** a reader opens a guide and presses Edit on its live example
- **THEN** the example runs against the current build and the chart re-renders as the code changes

#### Scenario: Target lines and bands on a preset

- **WHEN** a reader opens the target lines and bands guide
- **THEN** it shows a target line added to a preset with the `layers` option and a band chart with a band and lines on top, both live

#### Scenario: Security and CSP

- **WHEN** a reader opens the security and CSP guide
- **THEN** it states the policy Chartist needs (nothing beyond `'self'` for the library, `font-src data:` for the terminal stylesheet), that data is escaped in every output, that `Svg#foreignObject()` strings are raw HTML, that plugins run as the page's own code, and how to render without `innerHTML`, with a live example

#### Scenario: Browser rendering in the server rendering guide

- **WHEN** a reader opens the server rendering guide
- **THEN** its browser example draws the chart with `chart()` or the DOM renderer, not with `renderToString()` and `innerHTML`

#### Scenario: Terminal examples

- **WHEN** a reader opens a terminal example
- **THEN** its code adds the text art with `format: 'element'`, not with `innerHTML`

### Requirement: Migration guide

The docs SHALL have a guide for 1.x users that says what keeps working unchanged, how to move to the functional API, how to keep 1.x events (`compat`) and 1.x plugins (`fromLegacyPlugin`), that UMD ships for backwards compatibility only, and what was removed.

#### Scenario: Class code is shown only here

- **WHEN** the docs pages are searched for `new LineChart`, `new BarChart` or `new PieChart`
- **THEN** they appear only on the migration guide

### Requirement: Experimental features are marked

Docs for experimental or polyfill-dependent features SHALL say so at the start of their section, name what they need, and link the relevant standards discussion.

#### Scenario: Container queries

- **WHEN** a reader opens the container queries section
- **THEN** a warning says `container()` is experimental, needs the `match-container` polyfill until browsers ship `Element.matchContainer()`, and links csswg-drafts#6205

### Requirement: Checked code samples

TypeScript code blocks in docs pages SHALL be type-checked against Chartist's published types as part of the docs check, unless explicitly marked as not checked, and every live example SHALL render without console errors in the end-to-end tests.

#### Scenario: A sample drifts from the API

- **WHEN** a docs page uses an option or function that Chartist's types don't have, in a checked code block
- **THEN** the docs check fails and names the page and block

### Requirement: Examples gallery

The site SHALL have a gallery of every docs example in the examples package, grouped by chart type and filterable by it, with a live thumbnail and the title of each example, linking to the example's page.

#### Scenario: Filtering

- **WHEN** a visitor picks a chart type on the gallery
- **THEN** only that type's examples are shown, and the choice can be undone

### Requirement: Example pages

Each docs example SHALL have a page with its title, description, an editable live example of its functional entry, its classic entry (when it has one) for comparison, a link to the full-screen playground, and links to the previous and next example of its type.

#### Scenario: Comparing with 1.x

- **WHEN** a visitor opens an example that comes from 1.x
- **THEN** they can see the classic code that draws the same chart next to the functional code

### Requirement: Full-screen playground

The site SHALL have a full-screen playground with the editor, the live preview, errors and console output, reset, and an export to StackBlitz. It SHALL open an example by id, or any set of files encoded in the address, from the URL fragment. After the code is edited, the address SHALL follow the edits, and a share action SHALL copy it. Live examples SHALL open in this playground with their current files.

#### Scenario: Opening an example

- **WHEN** a visitor follows an example's "Open in playground" link
- **THEN** the playground opens with that example's files and renders it

#### Scenario: Sharing edited code

- **WHEN** a visitor edits the code, presses Share, and someone else opens the copied address
- **THEN** the playground opens with the edited files and renders them

#### Scenario: A broken address

- **WHEN** the code in the address can't be decoded
- **THEN** the playground says so and opens a blank chart

### Requirement: Typed live examples

The site SHALL serve the type declarations of the Chartist build its live examples run, from its own origin, and its live examples, example pages and full-screen playground SHALL use them for type-aware editing.

#### Scenario: Editing a live example

- **WHEN** a reader edits a live example and starts typing the name of a Chartist function it imports
- **THEN** the editor completes it and shows its signature, and no request leaves the site's origin

### Requirement: API reference

The site SHALL have an API reference generated from the library's TypeScript source and doc comments at build time, grouped into pages by area, in the site's own design. Each entry SHALL show its signature, description, parameters, return value, properties, examples and related links, and SHALL mark experimental, deprecated and 1.x exports. Each `@chartist-js` package SHALL have an API page of its own in its package subsite, built the same way, whose references to `chartist` types link into this reference.

#### Scenario: Looking up an option

- **WHEN** a reader opens the line chart's options in the reference
- **THEN** each option shows its type, its default and what it does, and `axisX` lists the axis options with theirs

#### Scenario: A package's API

- **WHEN** a reader opens `/packages/terminal/api/`
- **THEN** each export of `@chartist-js/terminal` is listed with its signature and description, in the reference's design

### Requirement: Linked types and code defaults

Type names in signatures and property tables SHALL link to their entries. Option properties of the presets SHALL show their defaults, taken from the library's defaults rather than written by hand.

#### Scenario: Following a type

- **WHEN** a reader clicks `ChartPlugin` in the signature of `withOptions`
- **THEN** the page shows the `ChartPlugin` entry

#### Scenario: A 1.x class

- **WHEN** a reader looks up `LineChart`
- **THEN** a short entry describes it as the 1.x class and links to `lineChart`

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

### Requirement: Share previews

Every page SHALL have Open Graph and Twitter card tags with its title, description, canonical URL and a card image generated for it in the brand's design. The site SHALL publish a sitemap.

#### Scenario: Sharing a guide

- **WHEN** a guide's URL is shared in a chat app
- **THEN** the preview shows the guide's title and its card image

### Requirement: Archived versions

The site SHALL serve the 1.x documentation as static files under `/v1/`, unchanged from its last build. The version switcher and the footer SHALL link it and the archived 0.x documentation, with their URLs defined in one place.

#### Scenario: Going to the 1.x docs

- **WHEN** a reader picks 1.5 in the version switcher
- **THEN** the 1.x documentation opens under `/v1/` on the same site

### Requirement: Example previews fill their box

On example pages, an example whose chart is sized for a window SHALL be drawn to fill the preview frame.

#### Scenario: Long code

- **WHEN** an example page's code is taller than a 16:10 chart in the preview's width
- **THEN** the chart fills the preview's height too, without empty bands above and below

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

### Requirement: Credits page

The site SHALL have a credits page at `/credits/` that thanks the people behind Chartist and names its sponsor: Cube first, then the people. The page SHALL be in the site's design (both themes, accessible, no third-party requests beyond the visitor counter). It SHALL be reachable from a "Credits" link in the footer's Community column and from the landing page's sponsor card.

#### Scenario: Reachable from the footer

- **WHEN** a visitor follows the "Credits" link in the footer of any page
- **THEN** the credits page opens

#### Scenario: Reachable from the sponsor card

- **WHEN** a visitor follows the credits link in the landing page's sponsor card
- **THEN** the credits page opens

### Requirement: Cube credit

The credits page SHALL open with a sponsor credit for Cube. It SHALL say plainly that Cube sponsored Chartist's maintenance and the update from 0.x to 1.x, and it SHALL link to cube.dev. It SHALL name the company only, not people at Cube.

#### Scenario: Cube comes first

- **WHEN** a visitor opens `/credits/`
- **THEN** the first credit on the page is Cube's, it names the update from 0.x to 1.x and it links to `https://cube.dev`

### Requirement: People list

The credits page SHALL list people in one list: the ten contributors with the most commits to the Chartist repository, without bots, followed by any maintainers not among them. Each entry SHALL show an avatar, the GitHub name (or login when no name is set), the commit count and a link to their GitHub profile. A link to the full contributors list on GitHub with the total contributor count SHALL follow.

#### Scenario: Top ten first

- **WHEN** the credits page is rendered from a snapshot with more than ten human contributors
- **THEN** the first ten entries are the top ten by commits, in descending order, none of them a bot

### Requirement: Role flags

Each entry in the people list SHALL carry at most one flag: "creator" for the author, "core maintainer" for collaborators with the admin role, "maintainer" for collaborators with the maintain role. Everyone else SHALL have no flag.

#### Scenario: Flags follow GitHub roles

- **WHEN** a listed contributor is a collaborator with the admin role
- **THEN** their entry carries the "core maintainer" flag

#### Scenario: The author is the creator

- **WHEN** the credits page is rendered
- **THEN** the author's entry is in the list and carries the "creator" flag instead of a maintainer flag

#### Scenario: Maintainer outside the top ten

- **WHEN** a collaborator with the maintain role has fewer commits than the tenth contributor
- **THEN** they are listed after the top ten with the "maintainer" flag

### Requirement: Credited people come from GitHub

The people and their flags SHALL come from the committed, dated facts snapshot, which the facts script writes from the GitHub API: commit counts from the repository's contributor statistics, flags from the repository's collaborator roles. Their avatars SHALL be served from the site's own assets. The page SHALL show the snapshot date. The build SHALL fail if the snapshot lists no people or no creator, or if an avatar is missing.

#### Scenario: Snapshot drives the page

- **WHEN** the snapshot lists a contributor with 27 commits
- **THEN** the credits page shows that contributor with 27 commits and the snapshot's date, and their avatar is served from the site itself

#### Scenario: Missing avatar

- **WHEN** the snapshot names an avatar file that is not in the site's assets
- **THEN** the build fails and names the missing file

### Requirement: Roles survive a run without access

When the facts script cannot read the collaborators (no token with access), it SHALL keep the roles from the previous snapshot and warn, instead of dropping the flags. It SHALL still update everything else.

#### Scenario: No token for collaborators

- **WHEN** the facts script runs without a token that can read the collaborators
- **THEN** it warns, keeps the previous snapshot's roles and still updates the commit counts

### Requirement: Visitor counting

The live site SHALL count visitors per page with GoatCounter (chartist.goatcounter.com), which sets no cookies and stores no personal data, so no consent banner is needed. The counter SHALL load only when a page is served from chartist.dev, so local builds, tests, previews and forks make no requests to it.

#### Scenario: Counted on the live site

- **WHEN** a page loads from chartist.dev
- **THEN** it loads GoatCounter's script, which counts the page view

#### Scenario: Not counted elsewhere

- **WHEN** a page of the built site loads from any other host
- **THEN** it makes no request to GoatCounter

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

### Requirement: Plugins the core replaces

A plugin whose use case the core covers SHALL NOT be listed on the plugins page. When its page was published, its URL SHALL redirect to the docs page that covers the use case.

#### Scenario: The target line plugin

- **WHEN** a visitor opens `/plugins/chartist-plugin-targetline/`
- **THEN** they land on the target lines and bands guide, and the plugins overview has no tile for `chartist-plugin-targetline`
