## ADDED Requirements

### Requirement: Site search

The site SHALL offer full-text search over the guides, the API reference and the examples, built with the static site and served from the site's own origin. A search dialog SHALL open from the header and with Ctrl/Cmd+K, group results by section, link API results to their entry, and work with the keyboard alone.

#### Scenario: Finding an API entry

- **WHEN** a reader searches for `lineChart`
- **THEN** a result in the API section links to the `lineChart` entry

#### Scenario: Nothing loads before searching

- **WHEN** a page loads and the reader doesn't open the search
- **THEN** no search index or search code is requested

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
