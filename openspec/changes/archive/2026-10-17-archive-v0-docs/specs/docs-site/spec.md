## MODIFIED Requirements

### Requirement: Archived versions

The site SHALL serve the 1.x documentation as static files under `/v1/`, unchanged from its last build, and the 0.x documentation as static files under `/v0/`, from its last build on the former GitHub Pages site. The 0.x archive SHALL keep that build's content and live examples. The only changes SHALL be: no affiliate advertising, no analytics, no version pop-up (a static note points to the current docs instead), and fonts served by the site itself, so its pages make no requests to other hosts. The version switcher and the footer SHALL link both archives on the same site, with their URLs defined in one place. The archives SHALL NOT be listed in the sitemap.

#### Scenario: Going to the 1.x docs

- **WHEN** a reader picks 1.5 in the version switcher
- **THEN** the 1.x documentation opens under `/v1/` on the same site

#### Scenario: Going to the 0.x docs

- **WHEN** a reader picks the 0.11 archive in the version switcher or the footer
- **THEN** the 0.x documentation opens under `/v0/` on the same site, with its live examples working

#### Scenario: No third-party requests in the 0.x archive

- **WHEN** a page under `/v0/` loads
- **THEN** every request it makes goes to the site itself, and the page shows no affiliate block and no version pop-up

## ADDED Requirements

### Requirement: Old 0.x URLs redirect

Every page of the former 0.x site at `https://gionkunz.github.io/chartist-js/` SHALL send its visitors to chartist.dev, keeping the query string. The new page SHALL be chosen as follows:

- a URL without a `#hash` goes to the page's v2 counterpart: the home page to `/`, getting started to the getting started guide, the examples to the examples gallery, the API documentation to the API reference, the plugins page to the plugins overview;
- a URL whose `#hash` names a section with a v2 counterpart goes to that page, for example a live example to its v2 example page, a guide section to that guide, a plugin to its plugin page;
- a URL with any other `#hash` goes to the same page and `#hash` under `/v0/`;
- any other path below `/chartist-js/` goes to the same path under `/v0/`.

Each redirect page SHALL declare its target as the canonical URL and SHALL redirect without delay, also when scripts are off (then without the `#hash` rules). Every redirect target SHALL exist on chartist.dev.

#### Scenario: The old home page

- **WHEN** a visitor opens `https://gionkunz.github.io/chartist-js/`
- **THEN** they land on `https://chartist.dev/`

#### Scenario: An old example link

- **WHEN** a visitor opens `https://gionkunz.github.io/chartist-js/examples.html#example-line-modify-drawing`
- **THEN** they land on the v2 example page of that example

#### Scenario: An old section without a v2 counterpart

- **WHEN** a visitor opens an old page with a `#hash` that has no v2 counterpart, such as a function of the 0.x API documentation
- **THEN** they land on the same page and `#hash` under `https://chartist.dev/v0/`

#### Scenario: An old path that isn't a page

- **WHEN** a visitor opens a path below `/chartist-js/` that has no redirect page of its own
- **THEN** they land on the same path under `https://chartist.dev/v0/`

#### Scenario: Without scripts

- **WHEN** a search engine or a browser without scripts opens an old page
- **THEN** the page's canonical URL and its instant refresh both point to the page's v2 counterpart
