# release-process Specification

## Purpose

Defines how Chartist and its `@chartist-js` packages are released: versions and the changelog from conventional commits with Nx Release, release candidates and final versions with their npm dist-tags, the author's approval, trusted publishing, the protected `main` branch, and the docs following each release.

## Requirements

### Requirement: Releases with Nx Release

Releases SHALL be made with `nx release` for the `chartist` package. From the conventional commits since the last `v{version}` tag, a release SHALL:

- bump the version;
- add a section to the workspace `CHANGELOG.md` (continuing the 1.x file);
- commit and tag `v{version}`;
- create a GitHub release with that section;
- publish to npm.

#### Scenario: A release after fixes

- **WHEN** a release runs after `fix:` commits since `v2.0.0`
- **THEN** the version becomes `2.0.1`, the changelog gets a `2.0.1` section listing the fixes, `v2.0.1` is tagged, and a GitHub release and an npm version `2.0.1` exist

### Requirement: What the changelog lists

The changelog SHALL list features, fixes, performance changes and breaking changes. Other commit types (`docs`, `test`, `build`, `chore`, `refactor`, `style`, `ci`) SHALL neither bump the version nor appear.

#### Scenario: Only docs since the last release

- **WHEN** only `docs:` commits landed since the last release
- **THEN** a release without an explicit version bumps nothing and adds no changelog entries for them

### Requirement: Releases wait for approval

A release SHALL only run from `main`, for a commit whose CI passed, after a maintainer approves it in the `release` environment. Every green CI run on `main` SHALL offer a release; one that isn't approved SHALL publish nothing. If `main` moved past the approved commit, the release SHALL stop.

#### Scenario: Not approved

- **WHEN** CI passes on a push to `main` and nobody approves the waiting release
- **THEN** nothing is versioned, tagged or published

#### Scenario: Main moved on

- **WHEN** a release is approved for a commit that is no longer the head of `main`
- **THEN** the release stops without changing anything

### Requirement: Manual release options

A maintainer SHALL be able to start a release by hand with an exact version or a version specifier, as a dry run that changes nothing, or as a re-publish of the version already tagged on `main` when an earlier publish failed. Inputs that aren't a valid specifier or version SHALL be rejected before anything runs.

#### Scenario: Dry run

- **WHEN** a maintainer runs the release with the dry-run option
- **THEN** the run shows the version, the changelog section and the files it would publish, and changes nothing

#### Scenario: Invalid version input

- **WHEN** a maintainer enters `2.0` as the version
- **THEN** the run fails before `nx release` starts and says the version is invalid

### Requirement: Release candidates

While a repository variable sets a prerelease identifier, approved releases without an explicit version SHALL produce the next prerelease of that identifier (`2.0.0-rc.1` → `2.0.0-rc.2`). Prerelease versions SHALL be published under the npm `next` dist-tag and SHALL NOT change `latest`; final versions SHALL be published under `latest`.

#### Scenario: Next release candidate

- **WHEN** the variable holds `rc`, the current version is `2.0.0-rc.1`, and a release is approved
- **THEN** `2.0.0-rc.2` is published under `next`, and `latest` stays where it was

#### Scenario: Final release

- **WHEN** a maintainer releases `2.0.0` by hand
- **THEN** it is published under `latest`

### Requirement: Protected main

The release SHALL push its commit and tag to `main` without lifting `main`'s protection (reviewed pull requests, no force pushes, no deletion), through an identity that only an approved release run can use. A release commit SHALL NOT offer another release.

#### Scenario: The release commit

- **WHEN** a release pushes `chore(release): publish 2.0.0-rc.2` to `main`
- **THEN** the push is accepted, CI runs for it, and the release workflow skips it

### Requirement: Trusted publishing

Publishing to npm SHALL use npm trusted publishing from the release workflow, with no stored npm token, and the published versions SHALL carry provenance.

#### Scenario: Provenance

- **WHEN** a version is published by the release workflow
- **THEN** its npm page shows provenance linking to the workflow run on `chartist-js/chartist`

### Requirement: Docs follow releases

After a release (not a dry run), a docs deployment SHALL run for the release commit, and SHALL deploy only once the released version is on npm, so the site shows install instructions that work.

#### Scenario: After rc.2

- **WHEN** `2.0.0-rc.2` is released
- **THEN** a docs deployment runs and the site's install instructions name `2.0.0-rc.2`
