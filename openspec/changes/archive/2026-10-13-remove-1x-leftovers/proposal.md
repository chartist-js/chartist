## Why

After the move to Nx, tsdown, Vite-served examples and Playwright, several 1.x tools and files are dead weight: they are never run, reference removed code, or document things this repo no longer maintains. They bloat the lockfile and mislead contributors and agents.

## What Changes

- Remove `apps/docs-v1` (Docusaurus 2 beta site, Nx project `website`). The author decided not to maintain the 1.5 docs in this repo; chartist.dev keeps deploying them from `main` until the v2 release.
- Remove the git hook tooling that was never installed in the monorepo: `simple-git-hooks`, `nano-staged`, `.simple-git-hooks.json`, `.nano-staged.json` and the `updateGitHooks` script.
- Remove the interactive commit helper: `commitizen`, `@commitlint/cz-commitlint`, `.czrc` and the `commit` script. `commitlint` stays (used by `commit.yml`).
- Remove the Storybook-era `chartist-dev` alias (`tsconfig.json` paths, `jest.config.json` mappers, `test/mock/cssModule.js`) and leftover `*.stories` patterns.
- Remove unused dev dependencies `http-server` and `del`, and `@babel/core` + `@babel/eslint-parser` (ESLint's default parser handles the remaining `.js`/`.cjs` files).
- Update references in `CONTRIBUTING.md`, `.prettierignore`, `.gitignore`, `CLAUDE.md` and the plan.

**Breaking changes vs 1.x:** none. Nothing here is published or affects the library's output.

## Out of scope

- Release tooling (`.simple-release.json`, `clean-publish`, publish scripts, `release.yml`), Renovate and the GitHub Actions workflows: reworked in the release phase.
- The Jest → Vitest migration: the next change.
- Dependency upgrades (ESLint 9, Prettier 3, TypeScript/`@types/node` alignment, `cssnano`, `postcss-preset-env`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No behavior changes; `skip_specs: true`.

## Impact

- Deleted: `apps/docs-v1/`, `.simple-git-hooks.json`, `.nano-staged.json`, `.czrc`, `packages/chartist/test/mock/cssModule.js`.
- Edited: `packages/chartist/{package.json,tsconfig.json,jest.config.json,.eslintrc.json}`, `CONTRIBUTING.md`, ignore files, plan doc, `pnpm-lock.yaml`.
