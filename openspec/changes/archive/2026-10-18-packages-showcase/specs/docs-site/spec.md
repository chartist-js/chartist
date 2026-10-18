## MODIFIED Requirements

### Requirement: Landing page

The home page SHALL present Chartist as in the approved design: hero with the mascot and a live chart, numbers, a scroll story whose easel chart changes per chapter, features with live demos, the rendering pipeline with a plugin demo, the packages, a gallery, an inline live editor, responsive and animation showcases, the comparison, the ecosystem, community and sponsor, and a finale. All charts on it SHALL be rendered by Chartist, and all code samples SHALL use the v2 API as it exists.

#### Scenario: Story chapters

- **WHEN** a visitor scrolls the story so that the "Bars" chapter is in view
- **THEN** the mascot's board shows a bar chart rendered by Chartist and the chapter navigation marks the story section as current

#### Scenario: Code samples run

- **WHEN** a code sample from the landing page is run against the current build
- **THEN** it executes without errors and draws the chart it describes

## ADDED Requirements

### Requirement: News on the landing page

Below the hero, the landing page SHALL show a news list instead of a single release banner: at most the three newest entries, newest first. Each entry SHALL have a tag (such as "New"), a title, one sentence and a link, and the whole row SHALL be the link. The entries SHALL come from one place in the site's data, so an announcement is added without changing the page. The list SHALL include the Chartist 2.0 release and the `@chartist-js/terminal` package, linking to the release notes and to `/packages/terminal/`.

#### Scenario: Two announcements

- **WHEN** a visitor opens the home page
- **THEN** below the hero, a news list shows the `@chartist-js/terminal` announcement and the Chartist 2.0 release, each linking to its page

#### Scenario: A fourth entry

- **WHEN** a fourth news entry is added to the site's data
- **THEN** the landing page shows the three newest entries, and the oldest one no longer appears

### Requirement: Packages on the landing page

The landing page SHALL have a packages section after the rendering pipeline section, with a chapter in the landing's navigation. It SHALL draw one chart twice, from the same data and options: as SVG by `chartist`, live in the page like the landing's other charts, and as text art by `@chartist-js/terminal`. The text art SHALL be part of the page's HTML, so it shows without JavaScript and adds no script to the page. The section SHALL show the `ct-cli` command that draws a chart in a terminal, list every documented package with its name, one sentence and its license, and link to `/packages/`.

#### Scenario: One chart, two renderers

- **WHEN** a visitor scrolls to the packages section
- **THEN** the same chart appears as an SVG chart and as text art in a terminal frame, both drawn by the packages

#### Scenario: Navigation

- **WHEN** a visitor picks the packages chapter in the landing's navigation
- **THEN** the page scrolls to the packages section and the chapter is marked as current

#### Scenario: A new package

- **WHEN** a package is added to the site's package registry
- **THEN** it appears in the landing's package list without changes to the section
