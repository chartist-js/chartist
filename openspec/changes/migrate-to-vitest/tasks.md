# Tasks

## 1. Set up Vitest

- [x] 1.1 Add `@nx/vitest` (same version as `nx`) and exact-pinned `vitest`, `@vitest/coverage-v8` and `jsdom` (each released at least two weeks ago) via the plugin's generators (check `--help` first), and register the plugin in `nx.json`; verify `pnpm nx show project chartist` lists the inferred `test` target
- [x] 1.2 Add `packages/chartist/vitest.config.ts` (jsdom, globals, `(test|src)/**/*.spec.ts`, `test/setup.ts`, v8 coverage of `src`) and port `test/setup.js` to `test/setup.ts` (`@testing-library/jest-dom/vitest`, `matchMedia` stub); verify `pnpm nx test chartist` runs all 14 spec files and 146 tests pass without changing test content

## 2. Playground

- [ ] 2.1 Move `packages/playground/test/unit/*.test.ts` from `node --test` to Vitest (keep file names; replace `node:test`/`node:assert` imports with Vitest's API); verify `pnpm nx test playground` passes with the same number of tests as before

## 3. Remove Jest

- [ ] 3.1 Deletion commit: remove `packages/chartist/jest.config.json` and `test/setup.js`; verify the commit contains only deletions
- [ ] 3.2 Edit commit: remove `jest`, `@swc/jest`, `@types/jest`, `@types/testing-library__jest-dom` and (if unused elsewhere) `@swc/core`/`@swc/helpers` from `packages/chartist`, drop the `jest` and `test:unit` scripts, point `test` at the Vitest target, switch spec-file lint settings from Jest to Vitest; verify `pnpm install` succeeds and `git grep -n -i jest -- ':!openspec/changes/archive' ':!CHANGELOG.md' ':!pnpm-lock.yaml'` finds only `jest-dom` references
- [ ] 3.3 Update `CONTRIBUTING.md` (watch mode: `pnpm nx test chartist --watch`) and the plan (Testing row, "Unit test runner" open question resolved, `test:unit` removed from the local gate); verify the full local gate passes (`pnpm nx run-many -t typecheck check build test test:smoke test:size test:visual test:visual:v1 test:e2e lint` and `pnpm nx format:check --all`)
