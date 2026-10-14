## ADDED Requirements

### Requirement: CI runs the whole gate

On every push to `main` and on every pull request, CI SHALL run the local gate of the repository:

- the format check;
- lint, typecheck, check, unit, smoke, size and API tests (including the 1.x contract suites);
- the build of every project;
- the playground's and the docs' end-to-end tests.

A failing step SHALL fail the run.

#### Scenario: A failing unit test

- **WHEN** a pull request breaks a unit test of `chartist`
- **THEN** the CI run for it fails and names the failing target

### Requirement: Visual regression in CI on the reference platform

CI SHALL run the visual regression tests of the library against the committed baselines, and the 1.5.0 parity run, on Linux x64 with the Chromium of the pinned Playwright version: the platform the baselines are recorded on.

#### Scenario: A drawing change

- **WHEN** a pull request changes how an example is drawn without updating its baseline
- **THEN** the visual test fails and the run keeps the diff images as an artifact

### Requirement: Playground tests in three engines

CI SHALL run the playground's end-to-end tests in Chromium, WebKit and Firefox.

#### Scenario: An engine-specific failure

- **WHEN** a change breaks the playground in WebKit only
- **THEN** CI fails on the WebKit project

### Requirement: Conventional commits are checked

CI SHALL lint the messages of pushed commits against the conventional commit rules the release relies on.

#### Scenario: A malformed commit message

- **WHEN** a commit with the message `fixed stuff` is pushed
- **THEN** the commit check fails
