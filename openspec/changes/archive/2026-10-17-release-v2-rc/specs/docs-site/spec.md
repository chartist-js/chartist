## ADDED Requirements

### Requirement: Deployment to chartist.dev

The docs site SHALL be built and deployed by a GitHub Actions workflow to GitHub Pages at `https://chartist.dev`, from `main`. Pull requests SHALL build the site and run its end-to-end tests without deploying. Deployment SHALL be possible by hand, and SHALL only happen while a repository variable allows it, so the v2 site doesn't go live before its first release candidate is on npm.

#### Scenario: Push to main

- **WHEN** a commit is pushed to `main` and deployment is allowed
- **THEN** the site is built for `https://chartist.dev` and deployed

#### Scenario: Pull request

- **WHEN** a pull request changes the docs
- **THEN** the site is built and its end-to-end tests run, and nothing is deployed

### Requirement: Redirects for 1.x URLs

Every page URL of the 1.x site that the v2 site doesn't have SHALL redirect to the same page in the `/v1/` archive, with a static page that works without JavaScript and tells search engines where the page moved. URLs the v2 site has SHALL keep showing the v2 page.

#### Scenario: Old API page

- **WHEN** a visitor opens `https://chartist.dev/api/classes/LineChart`
- **THEN** they land on `https://chartist.dev/v1/api/classes/LineChart`

#### Scenario: Shared path

- **WHEN** a visitor opens `https://chartist.dev/api/`
- **THEN** they see the v2 API reference

### Requirement: Install instructions follow the prerelease state

While the `chartist` package version is a prerelease, the site SHALL show install instructions that work for it: `npm install chartist@next` instead of `npm install chartist`, and CDN URLs pinned to the exact version instead of `chartist@2`. For a final version, the site SHALL show the plain forms. The guides' source SHALL keep the final forms.

#### Scenario: During release candidates

- **WHEN** the site is built while the package version is `2.0.0-rc.1`
- **THEN** its pages say `npm install chartist@next` and load `https://cdn.jsdelivr.net/npm/chartist@2.0.0-rc.1/…`

#### Scenario: After 2.0.0

- **WHEN** the site is built while the package version is `2.0.0`
- **THEN** its pages say `npm install chartist` and load `https://cdn.jsdelivr.net/npm/chartist@2/…`
