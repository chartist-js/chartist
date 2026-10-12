# Tasks

## 1. Deletions

- [ ] 1.1 Deletion commit: remove `apps/docs-v1/`, `.simple-git-hooks.json`, `.nano-staged.json`, `.czrc` and `packages/chartist/test/mock/cssModule.js`; verify the commit contains only deletions and `pnpm nx show projects` no longer lists `website`

## 2. Edits

- [ ] 2.1 `packages/chartist`: drop the `commit` and `updateGitHooks` scripts; the dev dependencies `simple-git-hooks`, `nano-staged`, `commitizen`, `@commitlint/cz-commitlint`, `http-server`, `del`, `@babel/core`, `@babel/eslint-parser`; the `chartist-dev` alias in `tsconfig.json` and `jest.config.json`; `*.stories` patterns in `.eslintrc.json` and `jest.config.json`. Switch ESLint's JS parser to the default (`sourceType: module`). Verify `pnpm install` succeeds and `lint` passes
- [ ] 2.2 Update references to removed things in `CONTRIBUTING.md`, `.prettierignore`, `.gitignore`, `CLAUDE.md` and `docs/v2-high-level-plan.md`; verify `git grep` finds no live references to `docs-v1`, `website/`, `commitizen`, `simple-git-hooks`, `nano-staged` or `chartist-dev` outside the archive and history notes
- [ ] 2.3 Verify the full local gate passes: `pnpm nx run-many -t typecheck check build test test:unit test:smoke test:size test:visual test:visual:v1 lint`
