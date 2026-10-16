# Design

## Context

What is there today, checked on 2026-10-14:

- **Workflows (1.x):**
  - `ci.yml`: unit tests on pnpm 7 and Node 16, calling root scripts that no longer exist.
  - `checks.yml`: size-limit action, editorconfig, a Docusaurus build.
  - `commit.yml`: commitlint on every push.
  - `release.yml`: `trigensoftware/simple-release-action` with `NPM_TOKEN`.
  - `website.yml`: Docusaurus to GitHub Pages from `main`.
- **Git:** `origin` has `main` only. Local `next` is 275 commits ahead, and `main` is an ancestor of it, so the move is a fast-forward. The `v1.5.0` tag exists.
- **GitHub settings:**
  - **Pages:** builds from a workflow, with the custom domain `chartist.dev` and HTTPS enforced. The `CNAME` file in the old Docusaurus folder doesn't matter for workflow deployments.
  - **Environments:** only `github-pages`.
  - **`main` protection:** pull requests need one approving review; the bypass list holds only dangreen. `enforce_admins` is off, so admins (the author) can push to `main` directly.
- **npm:** `chartist` has one maintainer, gionkunz, and `latest` is `1.5.0`.
- **Package (1.x way):**
  - `publishConfig: { directory: "package", linkDirectory: false }`;
  - `prepublishOnly`, which runs vitest, build, `clear:package` and `clean-publish`;
  - `files: [dist, LICENSE-WTFPL, LICENSE-MIT]`;
  - no README in `packages/chartist` (the 1.x README is at the root);
  - `repository.url` without a directory.
- **Changelog:** the root `CHANGELOG.md` is the 1.x standard-version changelog, up to `1.5.0`.
- **Old site URLs:** chartist.dev serves the 1.x Docusaurus site: `/api/classes/…`, `/api/interfaces/…`, `/docs/…`, `/blog/…`, `/examples`. `apps/docs/public/v1/` holds the same site built for `/v1/` (for example `v1/api/basics.html`; the 1.x site had no trailing slashes).
- **The model:** exprit (`syncrea/exprit`, read through the GitHub API) does:
  - **`ci.yml`:** a full `nx run-many` on Node 22 and 24, with no Nx Cloud.
  - **`release.yml`:** `workflow_run` after CI on `main`, plus `workflow_dispatch` with `specifier`, `dry-run` and `publish-only` inputs. It waits in a `release` environment (required reviewer gionkunz, `main` only), and a guard checks that HEAD is the approved commit with green CI.
  - **Publishing:** `nx release` does everything with `github-actions[bot]` and `GITHUB_TOKEN`; exprit's `main` has no protection. It uses npm 11.20 for trusted publishing (no `registry-url`, `id-token: write`).
  - **Docs:** after a release, `gh workflow run docs.yml` redeploys them. `docs.yml` deploys from `main`, with PRs building and testing only.
  - **Version:** exprit has no repository variables; the version override is a workflow input.

## Goals / Non-Goals

**Goals:**

- A CI that runs the repository's full gate, including the visual and multi-engine tests, before anything reaches `main`.
- Releases that are reproducible, approved by a click, published with provenance, and safe for release candidates.
- chartist.dev switching to v2 together with `2.0.0-rc.1`, with nothing of 1.x lost.

**Non-Goals:** Nx Cloud, `nx affected`, preview deployments, the 2.0.0 launch (see the proposal).

## Decisions

### CI: exprit's shape, with Chartist's tests

`ci.yml` runs on pushes to `main` and `next` and on pull requests, with `concurrency` per ref, cancelling superseded runs of pull requests. All jobs set up pnpm from `packageManager`, use Node 22, and install with `pnpm install --frozen-lockfile`.

| Job                      | What it runs                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `check` (Node 22 and 24) | `pnpm nx format:check --all`, then `nx run-many -t lint typecheck check test build test:smoke test:size test:api test:api:v1`    |
| `visual` (Node 22)       | Playwright's Chromium, then `chartist:test:visual` and `chartist:test:visual:v1`; diff images and the report uploaded on failure |
| `playground` (Node 22)   | Chromium, WebKit and Firefox, then `playground:test:e2e`                                                                         |

The docs' build and e2e tests live in `docs.yml`, which runs on the same events, as in exprit. Full runs without `nx affected` keep CI simple; the gate takes minutes, not hours.

GitHub's `ubuntu-latest` with the pinned Playwright Chromium is the reference platform the baselines name, so CI checks the committed images directly. The dev container never records baselines.

`commit.yml` stays, moved to the current actions and Node 22, still using the root `.commitlintrc.json`. `checks.yml` goes: size limits are in `test:size`, and the website check is in `docs.yml`. `website.yml` goes, replaced by `docs.yml`.

### Release: exprit's workflow, with release candidates

The `release` block in `nx.json`:

- `projects: ["chartist"]`, `releaseTag.pattern: "v{version}"`, `version.conventionalCommits: true`;
- `changelog.workspaceChangelog` writes `CHANGELOG.md` and creates the GitHub release; no project changelogs;
- `git.commitMessage: "chore(release): publish {version}"`.

Conventional commit types only add changelog noise if listed, so the changelog shows features, fixes, performance and breaking changes. `docs`, `test`, `build`, `chore`, `refactor`, `style` and `ci` neither bump the version nor appear. With 275 commits since `v1.5.0`, the rc.1 section is long; the dry run is reviewed before the real one.

`release.yml` follows exprit:

- **Triggers:** `workflow_run` after CI on `main`, and `workflow_dispatch` with `specifier`, `dry-run` and `publish-only`.
- **Approval:** the `release` environment, with the guard step.
- **Inputs:** passed through `env` and validated before use.

What Chartist adds is release candidates and the dist-tag:

- **The version, in order of precedence:**
  1. the `specifier` input;
  2. `prerelease` with `--preid` from the repository variable `RELEASE_PREID` (`rc` during RCs), when that variable is set and the current version is already a prerelease;
  3. conventional commits.

  An automatic run while `RELEASE_PREID` is set but the version is a final one (`1.5.0` today) stops with a message asking for an explicit version. Otherwise approving the first run on the new `main` would publish `1.5.1-rc.0`.

- **Two steps:** `nx release … --skip-publish` versions, changelogs, commits, tags, pushes and creates the GitHub release. Then `nx release publish --tag <tag>` publishes, with `<tag>` `next` when the new version has a prerelease part and `latest` otherwise. npm refuses a prerelease without an explicit tag, and a missing tag must never move `latest`.
- **Recovery:** `publish-only` re-runs only the publish step for the version tagged at HEAD, with the same tag logic.
- **Docs:** the release commit, pushed with the App's token, starts `docs.yml` itself (see the decisions below).

The first RC: a manual run with `specifier: 2.0.0-rc.1`, approved in the environment. From then on, with `RELEASE_PREID=rc`, each approved automatic run publishes the next `rc.N`. For `2.0.0`: a manual run with `specifier: 2.0.0`, then `RELEASE_PREID` is removed.

Alternatives:

- **Releasing rc.1 from the author's machine** works with `npm login` and 2FA. But it would have no provenance and wouldn't test the path every later release takes. The local part is the dry run.
- **A preid in `nx.json`** would apply to every release, including 2.0.0. A variable is switched off without a commit.

### Publishing the package

`packages/chartist` publishes as Nx builds it:

- **Removed:** `publishConfig.directory`, `prepublishOnly`, `postpublish`, `clear:package` and the `clean-publish` dependency.
- **Added:** `repository.directory: "packages/chartist"` and `publishConfig.access: "public"`.
- **Files:** `files` already limits the tarball; `README.md` joins it.
- **Order:** `targetDefaults["nx-release-publish"].dependsOn: ["build"]` builds before publishing. The tests run in CI before any release.

`clean-publish` used to strip `devDependencies` and `scripts` from the published `package.json`. Without it, they ship in that file. That's harmless: npm never installs a dependency's `devDependencies`, and lifecycle scripts other than install hooks don't run for consumers. Keeping a copy step only for that isn't worth the second layout.

The README is new: v2's pitch, install (`chartist@next` while in RCs), an example with `lineChart`, links to chartist.dev, `/v1/`, the changelog and the plugins page, the sponsor line for Cube, and the licenses. The root `README.md` becomes the same text with repository notes for contributors.

A smoke test packs the package (`npm pack --dry-run --json`) and checks the file list against the spec: `package.json`, `README.md`, the licenses and `dist/` only.

Publishing needs npm ≥ 11.5.1 for trusted publishing, so the workflow installs npm 11 globally. `pnpm publish` hands the tarball to it, and setup-node runs without `registry-url`. That's exprit's working setup.

### The docs workflow

`docs.yml` runs on pushes to `main` and `next`, on pull requests, and by hand. Its build job:

- builds the site with `DOCS_SITE=https://chartist.dev`;
- runs `docs:test` and the docs e2e tests in Chromium;
- uploads the Pages artifact when the run isn't a pull request.

The deploy job runs for `main` (and by hand), only while the repository variable `DOCS_DEPLOY` is `true`, with its own non-cancelling `pages` concurrency group.

`DOCS_DEPLOY` exists for the switch-over: `main` moves first, and the v2 docs must not go live with install instructions for a version that isn't on npm yet. The variable is set to `true` right before rc.1 is approved, and the release commit's push deploys them. After that it stays `true`.

### Redirects for 1.x URLs

An Astro integration runs after the build. It walks `dist/v1/` for the 1.x pages (`.html` files and `index.html` folders). For each page whose path has no page in the v2 build, it writes a small HTML file at the old path. That file has a `<meta http-equiv="refresh">` to `/v1/<path>`, a `rel=canonical` link, a link for people, and a script that keeps the `#hash`.

GitHub Pages serves `/api/classes/LineChart` from `api/classes/LineChart.html`, so the redirect files take the 1.x file names. Paths the v2 site has (`/`, `/api/`, `/docs/<slug>/` where they coincide) keep their v2 page. An e2e check lists every 1.x page and fails if one is neither a v2 page nor redirected (it needs the built site, which `docs:test` doesn't). Redirect files don't enter the sitemap or the search index.

### Install instructions that follow the version

`src/lib/release.ts` reads the version of `packages/chartist/package.json` at build time, and the site rewrites install text in one place:

- **A Shiki transformer for MDX code blocks** (Astro 7's default Markdown processor ignores rehype plugins, and its own hast plugins run after Shiki has split the text), plus the rewrite function called by the components and libraries that hold install text (`InstallTabs`, the plugins page's setup snippets, the landing page). No guide has install text in inline code or prose; a guard test fails if one ever does.
- **`markdown.ts`,** for the `.md` versions and `llms.txt`.
- **The playground's StackBlitz export,** whose Chartist version becomes `next` instead of `latest`.

While the version has a prerelease part, the rewrite does two things:

- `npm install chartist` (as a whole word, not `chartist-plugin-…` or `chartist@…`) becomes `npm install chartist@next`;
- `cdn.jsdelivr.net/npm/chartist@2/` becomes `…/chartist@<version>/`.

The guides keep the 2.0.0 forms, so the release changes nothing in them. A unit test covers the rewrite, and an e2e test checks a built page during an RC.

### The move to main

The order, with the author's approval before each push:

1. **Prepare on `next`:** everything above, plus the local gate, a local `nx release 2.0.0-rc.1 --dry-run --skip-publish`, and `nx release publish --dry-run`.
2. **Settings, by the author:**
   - the `release` environment (required reviewer, `main` only);
   - the npm trusted publisher for `chartist` (repository `chartist-js/chartist`, workflow `release.yml`, environment `release`);
   - `RELEASE_PREID=rc`; `DOCS_DEPLOY` unset;
   - the GitHub App for releases, its bypass on `main`, and its ID and key as `release` environment secrets.
3. **Push `next`:** CI and `docs.yml` run on it, and must be green.
4. **Push the `1.x` branch,** created from `v1.5.0`.
5. **Fast-forward `main` to `next`, then push `main`.** CI runs; the automatic release run stops (final version with `RELEASE_PREID` set); nothing deploys.
6. **Release:** set `DOCS_DEPLOY=true`, run the release by hand with `2.0.0-rc.1`, and approve it. It publishes under `next`, pushes the release commit and tag, creates the GitHub release, and deploys the docs.
7. **Live checks:**
   - `npm view chartist dist-tags` (`latest: 1.5.0`, `next: 2.0.0-rc.1`), and provenance on the npm page;
   - chartist.dev pages, `/v1/`, redirects, the playground, search, share cards, GoatCounter;
   - the CDN URLs from the getting started guide.

After the move, `main` is where v2 work happens. `next` has served its purpose, and is deleted locally and not kept on GitHub once `main` is pushed.

## Risks / Trade-offs

- **The release pushes to protected `main`.** It does so as a GitHub App in the bypass list (see the decisions below); a misconfigured App fails the push, and `publish-only` recovers after a fix.
- **A long rc.1 changelog.** It is reviewed in the dry run. The GitHub release can be edited afterwards, and the "Coming from 1.x" guide carries the real migration story.
- **chartist.dev switches at once.** The 1.x docs stay under `/v1/`, old URLs redirect, and `docs.yml` can redeploy any commit. Reverting the site means a manual deploy of the `1.x` branch's old workflow, documented as a fallback in the tasks.
- **CI time.** Visual and three-engine playground tests run in parallel jobs, so they don't add up.
- **A stale `CNAME`.** Pages takes the domain from its settings for workflow deployments. `apps/docs/public/` gets no `CNAME`, so settings stay the single source.

## Decisions made with the author (2026-10-14)

- **`main` stays protected; the release pushes as a GitHub App.**
  - **Keep:** the classic protection stays: reviewed pull requests, no force pushes, no deletion.
  - **The App:** a small one owned by the organization ("Chartist Release": Contents read and write, no webhook, installed on this repository only), added to the protection's pull-request bypass list. The API shows `apps` there next to the user list.
  - **Secrets:** its ID and private key are secrets of the `release` environment, so they're only usable in an approved run.
  - **Pushing:** the workflow turns them into a short-lived token with `actions/create-github-app-token`, checks out with it, and `nx release` pushes the release commit and tag with it.
  - **Why not something else:** GitHub's docs don't list deploy keys as bypass actors, and `GITHUB_TOKEN` can't bypass.
- **Consequences of App pushes.**
  - **Workflows start:** a push with an App token starts workflows, unlike `GITHUB_TOKEN`. The release commit runs CI and `docs.yml` by itself, so the docs dispatch and `actions: write` are dropped.
  - **No release loop:** the release workflow skips runs for its own `chore(release): publish …` commits, so a release doesn't offer another one.
  - **Docs wait for npm:** the deploy job waits until `npm view chartist@<version>` answers (a few minutes at most) before deploying a version's docs, since the push comes just before the publish.
- **`next` goes away** after `main` is fast-forwarded and pushed. Work continues on `main`, with pull requests through CI.
