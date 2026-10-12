# Tasks

## 1. Set up oxfmt

- [ ] 1.1 Add exact-pinned `oxfmt` (a version released at least two weeks ago) to the root, run `oxfmt --migrate=prettier` to create `.oxfmtrc.json`, and move the `.prettierignore` patterns into its `ignorePatterns`; verify `pnpm nx format:check --all` runs with oxfmt (no "both configured" warning once Prettier's config is gone) and lists only the expected files
- [ ] 1.2 Compare `oxfmt --list-different` with Prettier 3's `--check` output on the whole repo and review every file only oxfmt would change; verify the differences are acceptable formatting (no semantic changes) and note notable ones in the commit message

## 2. Switch over

- [ ] 2.1 Edit commit: remove `.prettierrc`, `.prettierignore` and the root `prettier` dependency, replace `packages/chartist`'s `format` script with a note to use `pnpm nx format`, update `CLAUDE.md`'s formatting rule and the plan's Formatting row; verify `pnpm install` succeeds
- [ ] 2.2 `style:` commit: run `pnpm nx format --all` and commit only the reformatting; then add that commit's hash to a new `.git-blame-ignore-revs` in a follow-up commit; verify `git blame --ignore-revs-file .git-blame-ignore-revs` on a reformatted file shows the original authors
- [ ] 2.3 Verify `pnpm nx format:check --all` passes and the full local gate passes (`pnpm nx run-many -t typecheck check build test test:unit test:smoke test:size test:visual test:visual:v1 test:e2e lint`)
