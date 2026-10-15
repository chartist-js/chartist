# Tasks

## 1. Check: deprecated specifiers through the declaration build

- [ ] 1.1 Add a deprecated specifier block for two names (`LineChart`, `LineChartOptions`) to `src/index.ts`, build, and check: the comments survive in `index.d.ts` and `index.d.cts`; explicit specifiers win over `export *` with their comments; `LineChartPresetOptions` isn't marked; TypeDoc (`docs:api`) sees the tags. Verify: a language-service script against the built files reports the two names as deprecated and `LineChartPresetOptions` as not. Record the result and, if needed, the post-build fallback in design.md before going on

## 2. Deprecations on `chartist`

- [ ] 2.1 Write the checked-in list of deprecated names by the rule in the design, sorting each remaining 1.5 name explicitly, with the message of each; show the list to the author before tagging. Verify: every 1.5 root name is either on the list or named as shared in the list file's header
- [ ] 2.2 Add the deprecated specifier blocks to `src/index.ts` from the list (or the post-build step if 1.1 chose the fallback). Verify: `pnpm nx build chartist`; the export surface lists are unchanged
- [ ] 2.3 Add the deprecation test: the language service against the built `index.d.ts` and `index.d.cts`; exactly the listed names deprecated, with their messages. Verify: the test passes; dropping one tag makes it fail with the name and the file
- [ ] 2.4 Declare the 1.x event and plugin types in `src/compat/index.ts` as type aliases of the core types; extend the compat surface lists, the deprecation test (none of compat's exports marked) and the type tests (a `draw` listener typed with `PointDrawEvent` from `chartist/compat`). Verify: `pnpm nx run chartist:test --skip-nx-cache` and the type tests pass
- [ ] 2.5 Check that the repo's own functional code doesn't use deprecated names: the docs samples, the examples' `main.ts` files, the playground and the docs. Rewrite functional code that does, except where it's about 1.x (the zoom plugin example). Verify: `pnpm nx run-many -t lint check test build` passes; a search lists no deprecated name in functional code outside 1.x contexts

## 3. Docs and decisions

- [ ] 3.1 API reference: the deprecated names show the "deprecated" badge and their message (from the comments, or the list if 1.1 found TypeDoc doesn't see them); the 1.x pages say the names are deprecated and removed in 3.0. Verify: `pnpm nx build docs`; an e2e check of the `LineChart` entry's badge
- [ ] 3.2 "Coming from 1.x": a section on the deprecation (what's deprecated and why, what replaces each part, removal in 3.0, the event and plugin types from `chartist/compat`); the package README's 1.x paragraph and the `llms.txt` notes say the 1.x names are deprecated. Verify: `pnpm nx run docs:samples` type-checks the snippets; the llms e2e test passes; screenshots of the section in light, dark and at phone width
- [ ] 3.3 Update `docs/decisions.md` (1.x compatibility: the deprecation rule, type-level only, removal in 3.0 with the 3.0 shape still open, UMD unchanged). Verify: the section reads as the standing decision, without references to this change

## 4. Integration

- [ ] 4.1 Run the full gate: `pnpm nx run-many -t lint check test build --skip-nx-cache`, `pnpm nx format:check --all`, the docs and playground e2e suites, the visual local check, and the 1.x contract tests against `chartist@1.5.0`. Verify: all pass, and the visual check shows no diffs
- [ ] 4.2 Repeat the sandbox test that found the problem, against a packed tarball: a React component typed with `LineChartOptions` shows the deprecation with the hint to `LineChartPresetOptions`, and the corrected component has no hint. Verify: the language-service output

## Workflow follow-up

- Release as the next RC (`2.0.0-rc.2`) after "asa", with a changelog entry for the deprecations.
