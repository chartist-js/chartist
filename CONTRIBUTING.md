# Contributing to Chartist

- [Issues and bugs](#issue)
- [Development setup](#setup)
- [Screenshots for a new example](#baselines)
- [Submission guidelines](#submit)

## <a name="issue"></a> Found an issue?

If you find a bug in the source code or a mistake in the documentation, you can help us by submitting an issue to our [GitHub repository](https://github.com/chartist-js/chartist/issues). Even better, you can submit a pull request with a fix.

## <a name="setup"></a> Development setup

You need the current Node.js LTS (`.nvmrc`) and pnpm (the version in `package.json`'s `packageManager`). A dev container in `.devcontainer/` has everything installed.

1. Clone the repository and run `pnpm install`.
2. Run tasks through Nx, for example:
   - `pnpm nx test chartist --watch`: the library's unit tests in watch mode.
   - `pnpm --dir packages/examples exec vite line/simple`: run one example.
   - `pnpm nx dev docs`: the docs site at http://localhost:4321.
   - `pnpm nx run visual:test:visual`: compare every example with the screenshot baseline. The committed baselines are recorded on Linux with Playwright's Chromium; on other machines, fonts render differently, so use `pnpm nx run visual:test:visual:local-baseline` once and then `pnpm nx run visual:test:visual:local`. `pnpm nx run visual:test:visual:update` re-records the baseline from chartist 1.5.0, so it only covers examples that also exist in 1.x.

The repository layout and the standing decisions are described in [`docs/decisions.md`](docs/decisions.md); the behavior of each part is specified in [`openspec/specs/`](openspec/specs/).

## <a name="baselines"></a> Screenshots for a new example

An example that only exists in v2 has no 1.x counterpart, so `test:visual:update` skips it, and the visual job fails until its baseline is committed. The `visual-diffs` artifact of that failed run has no images for missing screenshots, so record them yourself.

Baselines are recorded on Linux x64 with the Chromium of the pinned Playwright version (see "Visual regression" in [`docs/decisions.md`](docs/decisions.md)). On macOS or Windows, use the Playwright Docker image whose tag matches `@playwright/test` in `packages/visual/package.json`, from the repository root:

```sh
docker run --rm --platform linux/amd64 -v "$PWD":/src mcr.microsoft.com/playwright:v1.64.1-noble bash -c '
  set -e
  mkdir /work && cd /src
  tar --exclude=node_modules --exclude=dist --exclude=.nx --exclude=test-results --exclude=playwright-report -cf - . | tar -xf - -C /work
  cd /work && npm install -g pnpm@10.34.7
  pnpm install --frozen-lockfile
  pnpm nx run-many -t build -p chartist essentials
  cd packages/visual
  npx playwright test --update-snapshots=missing --grep "essentials/legend"
  cp -r __screenshots__/. /src/packages/visual/__screenshots__/
'
```

- Replace `essentials/legend` with your example's id; the tests are named `<id> @ <viewport>`. `--update-snapshots=missing` only records screenshots that don't exist yet.
- Build the packages your example uses: here `chartist` and `essentials`.
- Use the pnpm version from `packageManager` in `package.json`. The image's Node.js has no corepack, so pnpm is installed with npm, and `tar` copies the repository without your machine's `node_modules`.
- The new files are `packages/visual/__screenshots__/<type>/<name>--<viewport>.png`. Look at each one before committing it: it becomes the reference every later change is compared with.

## <a name="submit"></a> Submission guidelines

- Fork the repository and branch from `main`.
- Use [conventional commit](https://www.conventionalcommits.org/) messages (`fix: …`, `feat: …`, `docs: …`); they drive the changelog. A pull request is merged as one commit whose message is the pull request's title, so the title has to be a conventional commit too.
- Keep file moves and deletions in commits of their own, so git can follow the files' history.
- Run `pnpm nx format` before committing, and make sure `pnpm nx run-many -t lint typecheck check test` passes.
- After a change to a package, run `pnpm nx run-many -t test:size`: the bundles have size budgets, and a small fix can go over one.
- After a change to the docs or to a doc comment, run `pnpm nx run-many -t lint check test build -p docs`. The docs API test (for example, `classNames` entries without a description) only runs in the Docs workflow.
- Code follows the TypeScript guidelines in [`docs/typescript.md`](docs/typescript.md): functional, immutable, named exports.
- Docs pages follow [`apps/docs/WRITING.md`](apps/docs/WRITING.md), doc comments [`packages/chartist/DOC-COMMENTS.md`](packages/chartist/DOC-COMMENTS.md).
