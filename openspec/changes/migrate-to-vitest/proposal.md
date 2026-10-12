## Why

The 146 unit tests run on Jest 27 with `@swc/jest` and jsdom 16, all from 2022. Jest 27 is unmaintained, needs its own transform pipeline next to tsdown and Vite, and the plan lists the unit test runner as an open question. Vitest uses the same Vite pipeline as the examples and harness, has a Jest-compatible API, a browser mode with Playwright for real-DOM SVG tests later, and Nx 23 support through `@nx/vitest` (inferred `test` targets).

## What Changes

- Add `@nx/vitest` and exact-pinned `vitest`, `@vitest/coverage-v8` and `jsdom`, register the plugin in `nx.json`, and add `packages/chartist/vitest.config.ts` with the jsdom environment, the `(test|src)/**/*.spec.ts` pattern, `test/setup.ts` as setup file and v8 coverage of `src`.
- Port `test/setup.js` to Vitest: `@testing-library/jest-dom/vitest` for the DOM matchers, and the `matchMedia` stub. Specs keep `describe`/`it`/`expect`; Vitest globals are enabled so the 14 spec files need no import changes (they use no `jest.*` API).
- Move the playground's unit tests (`node --test`) to the same Vitest setup, so the repo has one unit test runner. The `test:smoke` package tests stay on `node --test`, because they test the built package from plain Node.
- Remove Jest and everything only it uses: `jest`, `@swc/jest`, `@swc/core`/`@swc/helpers` in `packages/chartist` (if nothing else needs them), `@types/jest`, `@types/testing-library__jest-dom`, `jest.config.json`, the `jest` and `test:unit` scripts. `test` becomes the inferred Vitest target; `test:unit` is dropped from the local gate.
- Resolve the plan's "Unit test runner" open question.

**Breaking changes vs 1.x:** none. Test tooling only; the 146 tests must pass unchanged in content.

## Out of scope

- Vitest browser mode (real Chromium for SVG measurement tests): considered for the core work, not needed to keep today's tests.
- Rewriting or extending tests, or raising coverage.
- Moving the Playwright screenshot and smoke tests into Vitest.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No behavior changes; `skip_specs: true`.

## Impact

- New: `vitest.config.ts` in `packages/chartist` and `packages/playground`, `test/setup.ts`, `@nx/vitest` in `nx.json`.
- Removed: `jest.config.json`, `test/setup.js`, Jest and SWC-for-Jest dev dependencies, `jest`/`test:unit` scripts.
- Edited: `package.json` files, `CONTRIBUTING.md` (watch mode), the plan (testing row, open questions, local gate), `pnpm-lock.yaml`.
- Lint rules for spec files switch from the `jest` to the `vitest` oxlint plugin (follow-up edit if `migrate-to-oxlint` lands first).
