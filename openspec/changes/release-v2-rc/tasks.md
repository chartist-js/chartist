# Tasks

## 1. Publishing the package

- [x] 1.1 In `packages/chartist/package.json`, remove `publishConfig.directory`/`linkDirectory`, `prepublishOnly`, `postpublish`, `clear:package` and the `clean-publish` dependency; add `publishConfig.access: "public"`, `repository.directory: "packages/chartist"` and `README.md` to `files`. Verify: `pnpm install`, `pnpm nx run-many -t build test:smoke -p chartist`
- [x] 1.2 Write `packages/chartist/README.md` (v2 pitch, install with `chartist@next` during RCs, a `lineChart` example, links to chartist.dev, `/v1/`, the changelog and plugins, Cube's sponsor line, licenses) and make the root `README.md` the same text plus contributor notes. Verify: the README renders on GitHub's preview, links resolve
- [x] 1.3 Add a smoke test that packs the package (`npm pack --dry-run --json`) and checks the file list: `package.json`, `README.md`, the two licenses and `dist/` only, every `exports` and package-field path among them. Verify: `pnpm nx run chartist:test:smoke`

## 2. Nx Release

- [x] 2.1 Add the `release` block to `nx.json` (`chartist` only, `v{version}` tags, conventional commits with only feat/fix/perf/breaking in the changelog, workspace `CHANGELOG.md` with GitHub release, `chore(release): publish {version}`, no push from local runs unless asked) and `targetDefaults["nx-release-publish"].dependsOn: ["build"]`; remove `.simple-release.json`. Verify: `pnpm nx release 2.0.0-rc.1 --dry-run --skip-publish` shows the version, the changelog section and the commit, and changes nothing
- [x] 2.2 Review the dry-run changelog with the author and tune the type list if needed. Verify: the author accepts the rc.1 section
- [x] 2.3 Check publishing locally without publishing: `pnpm nx release publish --dry-run --tag next` after a build. Verify: the tarball list matches 1.3, the tag is `next`

## 3. Workflows

- [x] 3.1 Write `.github/workflows/ci.yml` (push to `main`/`next`, pull requests; jobs `check` on Node 22 and 24, `visual`, `playground`; artifacts on visual failure). Verify: `actionlint` (or `pnpm dlx` of it) passes, and the job commands pass locally
- [x] 3.2 Write `.github/workflows/release.yml` after exprit's: `workflow_run` on CI for `main`, `workflow_dispatch` with `specifier`/`dry-run`/`publish-only`, `environment: release`, the guard, input validation through `env`, the version precedence with `RELEASE_PREID` (and the stop for an automatic run on a final version), `--skip-publish` then `nx release publish --tag next|latest`, npm 11 without `registry-url`, `id-token: write`, checkout and push with an App token from `actions/create-github-app-token` (environment secrets `RELEASE_APP_ID`, `RELEASE_APP_PRIVATE_KEY`), and a skip for runs of `chore(release): …` commits. Verify: `actionlint`; the version and tag logic as a small script with unit tests (`tools/scripts/release-args.mjs`)
- [x] 3.3 Write `.github/workflows/docs.yml` (push to `main`/`next`, pull requests, manual; build with `DOCS_SITE=https://chartist.dev`, `docs:test`, docs e2e; deploy from `main` only while `vars.DOCS_DEPLOY == 'true'`, after waiting until the built version is on npm). Verify: `actionlint`
- [x] 3.4 Update `commit.yml` to the current actions and Node 22; remove `checks.yml` and `website.yml` (in a commit of their own). Verify: `actionlint`; no workflow references a missing script

## 4. Docs site

- [x] 4.1 Add the 1.x redirects: an Astro integration that writes a redirect page at each 1.x page path the v2 build doesn't have, pointing to `/v1/…` and keeping the hash; a `docs:test` check that every 1.x page is a v2 page or redirected; redirects stay out of the sitemap and search. Verify: `pnpm nx build docs`, e2e tests open `/api/classes/LineChart` and land on `/v1/api/classes/LineChart`, and `/api/` stays the v2 reference
- [x] 4.2 Add `src/lib/release.ts` and the install-text rewrite (rehype plugin for all rendered code, `markdown.ts`, StackBlitz version) for prerelease versions. Verify: unit tests for the rewrite; an e2e test of getting started with a prerelease version on disk shows `chartist@next` and the pinned CDN URL
- [x] 4.3 Update `docs/decisions.md` with the release decisions made while building this change. Verify: its Repository and Releases sections match the workflows and settings

## 5. Local gate

- [x] 5.1 Run the whole gate locally (`run-many` of every target, `format:check`, docs and playground e2e, `test:visual:local`). Verify: all pass

## 6. Settings (the author)

- [x] 6.1 Create the GitHub App "Chartist Release" for the organization (Contents read and write, no webhook), install it on `chartist-js/chartist` only, add it to the pull-request bypass list of `main`, and store its ID and a private key as the `release` environment secrets `RELEASE_APP_ID` and `RELEASE_APP_PRIVATE_KEY`
- [x] 6.2 Create the `release` environment with the author as required reviewer and a `main`-only branch policy
- [x] 6.3 Configure the npm trusted publisher for `chartist`: repository `chartist-js/chartist`, workflow `release.yml`, environment `release`
- [x] 6.4 Set the repository variable `RELEASE_PREID=rc`; leave `DOCS_DEPLOY` unset

## 7. The move (each push approved by the author)

- [x] 7.1 Push `next`; CI and `docs.yml` must be green on it. Verify: both runs pass
- [x] 7.2 Create `1.x` from `v1.5.0` and push it. Verify: the branch is on GitHub at `v1.5.0`
- [ ] 7.3 Fast-forward `main` to `next` and push `main`. Verify: CI passes; the automatic release run stops with its message; nothing is deployed or published
- [ ] 7.4 Set `DOCS_DEPLOY=true`, run the release by hand with `2.0.0-rc.1`, approve it. Verify: the run publishes, pushes the release commit and tag as the App, creates the GitHub release; the push starts CI and the docs deployment, and the release workflow skips its own commit

## 8. Live checks

- [ ] 8.1 npm: `npm view chartist dist-tags` shows `latest: 1.5.0` and `next: 2.0.0-rc.1`; provenance shows on the npm page; `npm i chartist@next` in a scratch project imports and draws
- [ ] 8.2 chartist.dev: the v2 home, guides, API, examples, plugins, playground, search and share cards; `/v1/` and the 1.x redirects; the CDN URLs of getting started load `2.0.0-rc.1`; GoatCounter counts a visit
- [ ] 8.3 Clean up: delete `next` locally, and update `docs/decisions.md` for `main` as the development branch (drop the note about `next`)

## Workflow follow-up

- Archive the change, sync the `continuous-integration`, `release-process`, `library-distribution` and `docs-site` specs, amend the last implementation commit.
