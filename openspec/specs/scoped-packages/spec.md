# scoped-packages Specification

## Purpose

Defines how packages maintained next to `chartist` are named, built, depend on `chartist` and are released, under the `@chartist-js` npm scope.

## Requirements

### Requirement: The @chartist-js scope

Maintained packages other than `chartist` (renderers, plugins, wrappers) SHALL be published under the `@chartist-js` npm scope, from `packages/<name>` in this repository, as public packages. `chartist` itself keeps its name.

#### Scenario: The terminal package

- **WHEN** the terminal renderer is published
- **THEN** it is `@chartist-js/terminal` on npm, built from `packages/terminal`, with `repository.directory` set to `packages/terminal`

### Requirement: ESM and CommonJS builds

A scoped package SHALL ship an ES module build and a CommonJS build with TypeScript declarations for each, wired through the `types`, `import` and `require` conditions of its `exports` map. Paths not in the `exports` map SHALL NOT be importable.

#### Scenario: Require and import

- **WHEN** Node.js code requires `@chartist-js/terminal` and other code imports it
- **THEN** both get the same public exports, and TypeScript resolves declarations for both without falling back to `any`

### Requirement: Dependency on chartist

A scoped package SHALL depend on `chartist` with a range that accepts the version it was released with and later versions of the same major, and SHALL use only `chartist`'s public exports.

#### Scenario: Published range

- **WHEN** `@chartist-js/terminal` 2.0.0-rc.2 is published
- **THEN** its `chartist` dependency is `^2.0.0-rc.2`, and its build imports nothing from `chartist`'s sources or `dist` paths

### Requirement: Released in lockstep

Scoped packages SHALL be released together with `chartist`, by the same release: one version for all of them, the `v{version}` tag, one section in the workspace `CHANGELOG.md` and one GitHub release. Their commits SHALL appear in the changelog by the same rules as `chartist`'s.

#### Scenario: A fix in the terminal package

- **WHEN** a release runs after a `fix(terminal):` commit since `v2.0.0`
- **THEN** both `chartist` and `@chartist-js/terminal` are published as `2.0.1`, and the changelog's `2.0.1` section lists the fix

#### Scenario: Prerelease dist-tag

- **WHEN** a release candidate is published
- **THEN** every package of the release is published under the `next` dist-tag, with provenance from trusted publishing

### Requirement: Packages tested in the gate

Every scoped package's lint, typecheck, test and build SHALL run in the CI gate, and its tests SHALL use its built output or published entry points, not `chartist`'s sources.

#### Scenario: A failing test

- **WHEN** a pull request breaks a test of `@chartist-js/terminal`
- **THEN** the CI gate fails
