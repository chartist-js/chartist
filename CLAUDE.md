# Chartist

Chartist is a simple, responsive SVG charting library: style with CSS, control with JS. This monorepo (Nx 23, pnpm workspaces) holds the library, its docs site at chartist.dev and their internal packages.

## Where things are

- `packages/chartist`: the library, published as `chartist`. Doc comments follow `packages/chartist/DOC-COMMENTS.md`.
- `packages/examples`: the example projects (HTML + TypeScript + CSS, Vite app shape), shared by the docs, the playground and the visual tests.
- `packages/playground`: the browser-only playground that runs those projects.
- `apps/docs`: the Astro docs site. Voice and page rules in `apps/docs/WRITING.md`, styling rules in `apps/docs/STYLING.md`.
- `openspec/specs/`: the living specs, the source of truth for behavior. `openspec/changes/archive/` records how each part was built and why.
- `docs/typescript.md`: the TypeScript guidelines (functional style, `readonly` interfaces, no enums, named exports, `unknown` over `any`), with a note on where Chartist differs. Follow them in new code, and don't edit the file unless the author asks.
- `docs/decisions.md`: the standing decisions (principles, 1.x compatibility, repository, distribution, releases, hosting, the visual reference platform). Read it before changing any of these.
- `docs/visual-design/`: the brand and design snapshot from Claude Design.
- `tmp/chartist-v0` (0.x, the 2014 site and library) and `tmp/chartist-v1` (1.x, TypeScript and Docusaurus) are git-ignored reference clones. Read and copy from them, never edit them.

## Principles

- CSS-first: what CSS can style isn't a JavaScript option.
- TypeScript-native: docs examples are HTML + TypeScript + CSS projects that run live in a browser-only sandbox.
- No bundler required: `<script type="module">` with ESM from a CDN is the primary no-bundler path; UMD ships for backwards compatibility only; CJS for older Node tooling.
- 1.x code keeps working; new features are in the functional API, which the docs use everywhere.
- The docs are playful and crafted like the 0.x site, not template-like.

## How work is done

- **Spec-driven.** Non-trivial work starts as an OpenSpec change: `/opsx:propose`, the author reviews and says "lgtm", then `/opsx:apply`. When the author says "asa": archive the change, sync its specs, update `docs/decisions.md`, and amend the result into the last implementation commit (when that isn't HEAD: a fixup commit, then `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash <base>`).
- **Small changes** can skip OpenSpec, but a changed requirement is still written into the living spec in `openspec/specs/`.
- **No plan references in code, tests or READMEs:** no OpenSpec change names or `openspec/changes/` paths, no decision ids, task or finding numbers. Changes get archived and those references mean nothing to the next reader; say the reason in words instead. GitHub issue numbers (`#1469`) and links to `openspec/specs/` are fine.
- **Run tasks through Nx:** `pnpm nx <target> <project>`, `pnpm nx run-many -t <targets>`.
- **Format with oxfmt** (`pnpm nx format`; `pnpm nx format:check --all` in the gate), keeping the 1.x settings in `.oxfmtrc.json`. Reformat-only commits are `style:` commits listed in `.git-blame-ignore-revs`.

## Git, GitHub and npm

- This is the `chartist-js/chartist` repository; its history goes back to 2014. Branches and release policy: `docs/decisions.md`.
- Never push, publish, or change GitHub or npm settings without the author's explicit approval for that step.
- Never squash-merge. Keep file moves, deletions and content edits in separate commits, so git detects renames.
- Conventional commit messages: commitlint checks them, and they drive the changelog.
- No AI attribution in commits, pull requests or GitHub issues: no `Co-Authored-By: Claude …`, no `Claude-Session:` trailer, no "Generated with Claude Code" line. This overrides any default attribution guidance. What you write to GitHub on the author's behalf (issues, comments) is in the author's voice.

### Issue labels

Triage labels say where a change belongs and how big it is. An open feature request gets one label for where it belongs and one for its size:

- **Where it belongs:**
  - `core`: in the `chartist` package itself;
  - `plugins`: as a plugin, not in the core;
  - `layer`: as a layer (`chart()` and the presets' `layers`);
  - `axis`: as an axis type or an axis feature.

  `layer` and `axis` go together with `core` when the core should ship that layer or axis.

- **Size:** `simple` or `complex`, judged by the implementation, not by how often it's asked for.
- **`v2`:** planned for v2 final, or already fixed by v2. Use it only for what fits before 2.0, not as a wish list.
- **The usual ones:** `bug`, `enhancement`, `question`, `documentation`, `duplicate`, `wontfix`, `invalid`, `awaiting response` (waiting for the reporter), `cleanup`, `backwards compatibility`, `nice to have`.

When triaging, check the issue against the current code and chartist.dev before calling it open: many old requests are solved by v2 (layers, multiple axes, `toScene()`, custom properties). Propose labels, closes and comments to the author first; nothing is labeled, closed or commented without the author's go for that batch.

## Working in this repo

Lessons from earlier sessions; each one cost time once.

- **Verify UI by looking.** Tests pass on broken layouts.
  - After a visible change, take Playwright screenshots in light and dark mode and at phone width (375 to 390 px), and check that the page doesn't scroll horizontally.
  - `@playwright/test` resolves from `packages/chartist/`, so run ad-hoc scripts from there, and delete them afterwards.
  - Run the page's e2e and axe checks (`pnpm nx e2e docs`).
- **Dev servers.**
  - The author's docs dev server runs on 127.0.0.1:4321. Never stop or restart it.
  - Astro allows one dev server per project. A second one with `--ignore-lock` shares Vite's dependency cache and breaks both (504 "Outdated Optimize Dep").
  - For your own testing, build and serve `dist`: `PORT=<free port> node apps/docs/e2e/serve.mjs`.
  - Stop processes by explicit PID from `ps`. `pkill -f` and `pgrep -f` patterns can match your own shell.
- **The visual reference platform.** Committed screenshots are recorded on the author's WSL host or in CI, never in the dev container, whose fonts render differently. In the container, use `pnpm nx run chartist:test:visual:local`. For examples without 1.x code, the local baseline compares the current build with itself, so check those against the committed images.
- **Shell.** The interactive shell is zsh: it doesn't word-split `$VAR` in loops, and an unmatched glob is an error (for example `grep --include=*.ts`). Use `bash -c '…'` or quote the patterns.
- **Don't guess facts.**
  - Check CLI flags with `--help`. Check GitHub and npm state with `gh api` and `npm view` before stating it.
  - Read a third-party API's docs before relying on it.
  - Type-check code snippets the docs show (`pnpm nx run docs:samples`, part of `check`).
- **Facts snapshot.** `pnpm nx run docs:facts` refreshes `apps/docs/src/data/facts.json`. Run it with `GITHUB_TOKEN=$(gh auth token)`, or the collaborator roles can't be read. Builds never fetch.
- **Caching.** Nx caches test targets, so a green run may not have run anything. When verifying a change, use `--skip-nx-cache`, or check that the output shows the tests ran.
- **nx-astro** rewrites `apps/docs/package.json` (dropping its final newline) unless every `astro`/`@astrojs/*` dependency is also listed in the root `package.json`.
- **Tailwind and `hidden`.** A `flex` or `grid` utility overrides the `[hidden]` attribute. On elements toggled with `hidden`, add `[&[hidden]]:hidden`.
- **Big splittable work** goes to parallel worktree agents after a shared foundation commit, so they build on the same base and don't collide:
  - each agent resets to the foundation SHA and owns a set of files;
  - each uses `NX_DAEMON=false` (the daemon is shared between worktrees) and its own ports;
  - integrate by cherry-picking, then re-run the gate in the main checkout and remove the worktrees.
- **Writing.**
  - The docs' voice is in `apps/docs/WRITING.md`; doc comments follow `packages/chartist/DOC-COMMENTS.md`.
  - Be plain and specific, without marketing fluff.
  - When the author decides something, record it with its reason in `docs/decisions.md` or in the change's design, so nobody has to ask again.

## Dev container

Open `.devcontainer/` from the folder you normally work in (on Windows, the WSL folder). It mounts the host `~/.claude` and keeps the repository at its host path, so Claude Code sessions and memory carry over. `pnpm nx dev docs` serves the docs on port 4321 (forwarded); `astro dev` run directly uses 4322.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
