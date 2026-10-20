# Contributing to Chartist

- [Issues and bugs](#issue)
- [Development setup](#setup)
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
   - `pnpm nx run visual:test:visual`: compare every example with the screenshot baseline. The committed baselines are recorded on Linux with Playwright's Chromium; on other machines, fonts render differently, so use `pnpm nx run visual:test:visual:local-baseline` once and then `pnpm nx run visual:test:visual:local`.

The repository layout and the standing decisions are described in [`docs/decisions.md`](docs/decisions.md); the behavior of each part is specified in [`openspec/specs/`](openspec/specs/).

## <a name="submit"></a> Submission guidelines

- Fork the repository and branch from `main`.
- Use [conventional commit](https://www.conventionalcommits.org/) messages (`fix: …`, `feat: …`, `docs: …`); they drive the changelog.
- Keep file moves and deletions in commits of their own, so git can follow the files' history.
- Run `pnpm nx format` before committing, and make sure `pnpm nx run-many -t lint typecheck check test` passes.
- Code follows the TypeScript guidelines in [`docs/typescript.md`](docs/typescript.md): functional, immutable, named exports.
- Docs pages follow [`apps/docs/WRITING.md`](apps/docs/WRITING.md), doc comments [`packages/chartist/DOC-COMMENTS.md`](packages/chartist/DOC-COMMENTS.md).
