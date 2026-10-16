# Tasks

## 0. Archive the open changes

- [ ] 0.1 Tick the last three tasks of `archive-v0-docs` (checked on the live sites on 2026-10-17: `/v0/` pages with the archive note, the old site's redirects, the 404 page's redirect to `/v0/`), then archive it with its specs synced. Verify: `openspec/changes/archive/2026-10-17-archive-v0-docs/` exists, "Old 0.x URLs redirect" and the extended "Archived versions" are in `openspec/specs/docs-site/spec.md`, and `openspec validate --specs --strict` passes
- [ ] 0.2 Archive `release-v2-rc` with its specs synced. Verify: `openspec/specs/release-process/spec.md` and `openspec/specs/continuous-integration/spec.md` exist with their purpose sections, its `docs-site` and `library-distribution` requirements are in the main specs, `openspec list` shows only `release-v2-final` as active, and `openspec validate --specs --strict` passes

## 1. Recorded experimental names

- [ ] 1.1 Add `experimentalNames(build, file)` to `test/api/exports/read.ts` (exports whose JSDoc has `@experimental`), an `experimental.json` written by `exports/update.ts` per entry (`chartist`, `chartist/compat`, `chartist/live`), and an API test comparing them with the built declarations, naming each difference. Verify: the test passes with today's list, and fails naming the export when a tag is added without updating the list

## 2. Stable core

- [ ] 2.1 Remove the `@experimental` tags from `packages/chartist/src`, except in `src/live/` and on `container()` and `ContainerCondition`; drop the "until v2.0" module notes in `scene/node.ts` and `scene/roles.ts` and the "experimental until v2.0" comment in `src/index.ts`; reword `src/live/index.ts` to "may change in a 2.x minor". Verify: `grep -rn "@experimental" packages/chartist/src` lists only `src/live/` and the two container names, `pnpm nx run chartist:test:api --skip-nx-cache` passes after `test:api:update-exports` with `experimental.json` holding only those names, and the "Stable core" and "Live updates stay experimental" scenarios hold
- [ ] 2.2 Remove the `@experimental` tags from `packages/terminal/src`, and add a test to the terminal package that its declarations mark no export experimental. Verify: `pnpm nx test terminal --skip-nx-cache` passes, and the test fails when a tag is added back

## 3. Docs

- [ ] 3.1 Remove the "Experimental until 2.0" callouts from the composed charts, custom layers and target lines and bands guides; say at the start of the live updates guide's `chartist/live` section that it's experimental, new with 2.0 and may change in a 2.x minor; change the API reference legend to "may still change in a 2.x minor". Verify: `grep -rni "until 2.0" apps/docs/src` finds nothing, the API reference shows the experimental badge only on `chartist/live` and the container names, and `pnpm nx run docs:samples` and `pnpm nx e2e docs` pass
- [ ] 3.2 Update `README.md` and `packages/chartist/README.md`: no release candidate note, `npm install chartist`, CDN URLs with `chartist@2`. Verify: `grep -n "@next\|release candidates" README.md packages/chartist/README.md` finds nothing, and the README sample test passes if there is one
- [ ] 3.3 Look at the changed pages. Verify: Playwright screenshots of the three guides' changed sections, the live updates guide and the API reference index, in light and dark mode and at 390 px

## 4. Release (the author's go for each step)

- [ ] 4.1 Run the gate. Verify: `pnpm nx run-many -t lint typecheck test build --skip-nx-cache`, `pnpm nx format:check --all`, `pnpm nx run chartist:test:size`, `pnpm nx run chartist:test:smoke --skip-nx-cache`, `pnpm nx run chartist:test:visual` and `pnpm nx e2e docs` pass
- [ ] 4.2 Draft, for the author's review: the GitHub release notes' highlights for 2.0.0 in the author's voice, and the comments closing #3 and #961. Verify: the drafts are shown to the author; nothing is posted without the go
- [ ] 4.3 After the merge, the author runs the release workflow by hand with `2.0.0` and approves it, then unsets `RELEASE_PREID`. Verify: `npm view chartist dist-tags` shows `latest: 2.0.0`, `npm view @chartist-js/terminal dist-tags` too, chartist.dev shows `npm install chartist`, and the repository variable list has no `RELEASE_PREID`
