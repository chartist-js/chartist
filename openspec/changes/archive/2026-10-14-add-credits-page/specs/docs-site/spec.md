## ADDED Requirements

### Requirement: Credits page

The site SHALL have a credits page at `/credits/` that thanks the people behind Chartist and names its sponsor: Cube first, then the people. The page SHALL be in the site's design (both themes, accessible, no third-party requests). It SHALL be reachable from a "Credits" link in the footer's Community column and from the landing page's sponsor card.

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
