# Tasks

## 1. Set up oxlint

- [x] 1.1 Add `@nx/oxlint` (same version as `nx`) and exact-pinned `oxlint` (released at least two weeks ago) at the root via the plugin's `init`/`configuration` generators (check `--help` first), and register the plugin in `nx.json`; verify `pnpm nx show project <p>` lists a `lint` target for `chartist`, `examples` and `playground`
- [x] 1.2 Write the root `.oxlintrc.json`: carry over every 1.x rule from `packages/chartist/.eslintrc.json` that oxlint supports, enable the `typescript` plugin with its recommended rules, the `vitest`/`jest` plugin for spec files, and overrides for tests and Node scripts; record the 1.x rules without an oxlint equivalent (and why they are dropped) in the commit message; verify `pnpm nx run chartist:lint` reports no more errors than ESLint did

## 2. Switch over

- [ ] 2.1 Edit commit: remove the `lint` script, `.eslintrc.json`, ESLint, `@typescript-eslint/*`, the `eslint-config-prettier`/`eslint-plugin-*` packages and Prettier 2 from `packages/chartist`; rename `eslint-disable` comments whose rules were renamed; verify `pnpm install` succeeds and `git grep -n eslint -- ':!openspec/changes/archive' ':!CHANGELOG.md' ':!pnpm-lock.yaml'` finds only intentional references
- [ ] 2.2 Fix or suppress (with a reason) the findings in `examples` and `playground`; verify `pnpm nx run-many -t lint` passes with no errors
- [ ] 2.3 Update the plan's tech table (Linting row); verify the full local gate passes (`pnpm nx run-many -t typecheck check build test test:unit test:smoke test:size test:visual test:visual:v1 test:e2e lint` and `pnpm nx format:check --all`)
