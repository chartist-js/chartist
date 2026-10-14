# Proposal

## Why

The library and the docs site are ready for `2.0.0-rc.1`, but the repository isn't ready to ship them. The GitHub Actions workflows are still those of 1.x:

- They use pnpm 7 and Node 16.
- They call root scripts that no longer exist.
- They release with a third-party action and a stored npm token.
- `website.yml` deploys the Docusaurus site from `main`.

The package publishes the 1.x way (`clean-publish` into a `package` folder) and has no README of its own, so its npm page would be empty. v2 lives on `next`, which has never been pushed. `main` is 275 commits behind it, and fast-forwarding it today would run broken workflows and take chartist.dev down.

## What Changes

- **CI for the monorepo**, modeled on the author's exprit repository. On every push to `main` and on every pull request, CI runs:
  - the format check;
  - lint, typecheck, check, unit, smoke, size and API tests;
  - the visual regression tests against the committed baselines (Linux Chromium, the reference platform);
  - the playground's e2e tests in Chromium, WebKit and Firefox, and the docs' e2e tests.

  The 1.x `ci.yml` and `checks.yml` go. `commit.yml` (commitlint) stays, updated, because conventional commits drive the release.

- **Releases with `nx release`.**
  - **Config:** `nx.json` gets a `release` block for the `chartist` package, with conventional commits, `v{version}` tags as in 1.x, and the workspace `CHANGELOG.md` continuing the 1.x one. `docs` and `ci` commits don't bump the version.
  - **Approval:** `release.yml` runs after green CI on `main` and waits for approval in a `release` environment. A manual run can set the version, do a dry run, or re-publish an already tagged version.
  - **Versions:** a repository variable sets the version while there are release candidates. `2.0.0-rc.1` comes from a manual run, and later approved runs count up `rc.N`.
  - **npm:** prerelease versions go to the npm `next` dist-tag, so `npm i chartist` keeps installing 1.x. Publishing uses npm trusted publishing: no stored token, provenance attached.
  - **Cleanup:** the 1.x simple-release setup goes.
- **Publishing the package as Nx builds it.**
  - **No more `clean-publish`:** `packages/chartist` drops it, along with `publishConfig.directory` and the `prepublishOnly`/`postpublish` scripts. `nx release publish` publishes the project folder, limited by `files`.
  - **README:** the package gets a README (a v2 README for npm and GitHub).
  - **Check:** a packaging test verifies the packed tarball holds exactly what should ship.
- **The docs deployment** replaces `website.yml`.
  - **`docs.yml`:** builds the Astro site for `https://chartist.dev`, runs its e2e tests on pull requests, and deploys to GitHub Pages from `main`.
  - **Release timing:** deploys of the v2 site start once `2.0.0-rc.1` is on npm (a repository variable). The release workflow also redeploys the docs after each release.
  - **Old URLs:** the 1.x site's URLs that v2 doesn't have (`/api/classes/LineChart`, the 1.x `/docs/…` pages, `/blog/…`) redirect to the same page in the `/v1/` archive.
- **Install instructions for release candidates.**
  - **While the package version is a prerelease,** the site turns `npm install chartist` into `npm install chartist@next`, and pins CDN URLs (`chartist@2/…`) to the exact version. Version ranges skip prereleases.
  - **Source stays final:** the guides keep the wording for 2.0.0, so nothing needs editing at the release.
- **The move to `main`** follows the repository decisions in `docs/decisions.md`:
  1. a `1.x` branch from the `v1.5.0` tag, for maintenance;
  2. `main` fast-forwarded to `next` (no merge commit, so all history and renames stay) and pushed;
  3. `2.0.0-rc.1` released through the pipeline;
  4. the live checks: npm, chartist.dev, the `/v1/` archive and the redirects.

  After the move, `main` is the development branch, and `next` is deleted.

## Capabilities

### New Capabilities

- `continuous-integration`: what CI runs, where, and on which events, including the visual reference platform.
- `release-process`: how versions, changelogs, tags, GitHub releases and npm publishing happen: the approval, release candidates, the dist-tag, trusted publishing, dry runs and recovery.

### Modified Capabilities

- `library-distribution`: the published package's contents and layout (README, no `clean-publish` folder, provenance).
- `docs-site`: deployment to chartist.dev from CI, redirects for 1.x URLs, and install instructions that follow the package's prerelease state.

## Out of scope

- Nx Cloud, remote caching, `nx affected`, and pull request preview deployments. CI runs the full gate, as exprit does.
- Closing the issues labeled `v2` as fixed: that happens per issue after rc.1 is live, separately.
- The `2.0.0` release itself, the migration announcement and launch posts.
- Cleaning up stale branches and Renovate PRs, and changing the Renovate config.
- A separate repository or package for the 1.x docs; they stay static files under `/v1/`.

## Breaking changes vs 1.x

This change adds none to the library. The release makes v2's documented breaking changes available, under the npm `next` tag only. `npm i chartist` keeps installing 1.5.0 until 2.0.0.

- **chartist.dev** switches to the v2 docs. The 1.x docs stay available under `/v1/`, and old 1.x URLs redirect there.
- **The published package's file list** changes: no `package` folder layout, built files under `dist/` as listed in the `exports` map. Every 1.x import path keeps resolving; the library-distribution spec already requires that.

## Impact

- **`.github/workflows/`:** new `ci.yml`, `release.yml` and `docs.yml`; updated `commit.yml`; `checks.yml` and `website.yml` removed.
- **Config:** `nx.json` (the `release` block and target defaults); the root and `packages/chartist` `package.json` (scripts, `publishConfig`, `repository`, engines); `.simple-release.json` removed.
- **Package and docs:**
  - a new `packages/chartist/README.md`, the package's README, linked from the repository root, and a packaging test;
  - `apps/docs`: the redirect generation, the prerelease-aware install text, the site URL in the build;
  - `docs/decisions.md`.
- **GitHub and npm settings, done by the author:**
  - a `release` environment with a required reviewer;
  - repository variables;
  - the npm trusted publisher for `chartist`;
  - how the release workflow may push to the protected `main` (see the design).
