## Why

The repo formats with two Prettier versions: Prettier 3 at the root (Nx, docs, specs) and Prettier 2 in `packages/chartist` (pinned there by `eslint-plugin-prettier` 4). With the 1.x settings, 16 files under `packages/` are already out of format for Prettier 3. oxfmt is a Prettier-compatible formatter from the Oxc project, much faster, and Nx 23 supports it natively: `nx format` switches to oxfmt when an oxfmt config exists. It is the first step of moving the dev tooling to Oxc (oxfmt, then oxlint) and Vitest.

## What Changes

- Add `oxfmt` (exact pin) at the root and a root `.oxfmtrc.json` migrated from `.prettierrc` with `oxfmt --migrate=prettier`, so the 1.x style settings stay (single quotes, no trailing commas, `arrowParens: avoid`, width 80).
- Move the ignore patterns from `.prettierignore` into the oxfmt config.
- Remove `.prettierrc`, `.prettierignore` and both Prettier dependencies. `packages/chartist` keeps Prettier 2 only as long as `eslint-plugin-prettier` needs it; that pair goes in `migrate-to-oxlint`.
- Replace the `format` script in `packages/chartist` with `nx format` usage; `nx format:check` becomes part of the local gate.
- Reformat once with oxfmt in a single `style:` commit, listed in a new `.git-blame-ignore-revs`. Expected footprint: the 16 files Prettier 3 already flags, plus any oxfmt differences, reviewed before committing.
- Update `CLAUDE.md` (the "don't mass-reformat, the 1.x `.prettierrc` stays" rule becomes "oxfmt with the 1.x settings; reformatting only in `style:` commits listed in `.git-blame-ignore-revs`") and the plan.

**Breaking changes vs 1.x:** none. Formatting only; the library output is unchanged.

## Out of scope

- Changing the style settings themselves (quotes, trailing commas, width). They stay as in 1.x.
- Linting (`migrate-to-oxlint`) and testing (`migrate-to-vitest`).
- Formatting `docs/visual-design/project` (the design handoff snapshot) and the test baseline images.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No behavior changes; `skip_specs: true`.

## Impact

- New: `.oxfmtrc.json`, `.git-blame-ignore-revs`.
- Removed: `.prettierrc`, `.prettierignore`, Prettier dev dependencies (root; `packages/chartist` follows with oxlint).
- Edited: root and `packages/chartist` `package.json`, `CLAUDE.md`, `docs/v2-high-level-plan.md`, `pnpm-lock.yaml`, plus the one-time reformatted files.
