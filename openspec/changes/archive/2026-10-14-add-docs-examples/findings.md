# Findings from add-docs-examples

## Conversions

All 63 examples with 1.x code have a functional `main.ts`, and both entries of every one match the 1.5.0 baseline: 143 visual tests, re-run in the main checkout without the Nx daemon. No example needed `ownBaseline`.

## Library

1. **Scene node context is untyped.** Rebuilding 1.x animations as v2 plugins needs casts: `ctx.axis` is `unknown` (cast to `ScaleAxis` for `.dimension`), and `ctx.path`, `ctx.x` and grid attributes need `as SvgPath`, `as number` or `Number(...)`. Typed context per role would make plugins much cleaner. (`line/svg-animation`, `line/path-animation`.)
2. **A `compose` listener that returns only inside an `if` fails strict type checking** (TS7030, not all code paths return a value); examples add an early `return;`. A listener type that allows `void` paths, or a documented pattern, would help.
3. **Typing responsive options needs the preset types** (`PresetResponsiveOptions<BarChartPresetOptions>`); an untyped array widens literals (`labelDirection: 'explode'` becomes `string`) and its callbacks get implicit `any`.

To triage with the `add-docs-content` findings in `fix-library-findings`.

## Tests

4. **Two responsive paths aren't screenshot:** `bar/extreme-responsive` and `bar/view-box` (its `max-width: 575px` override) are tested only at the default viewport. _Fixed by `fix-library-findings`._
5. **The committed visual baseline fails in the dev container** for 36 examples: its font rendering differs from the reference platform. `chartist:test:visual:local-baseline` and `:local` test against a 1.5.0 baseline recorded on the machine; CI on the reference platform stays the authority.

## Tooling

6. **The Nx daemon is shared between parallel git worktrees**, so a task in one worktree can replay another's results. Agents working in parallel worktrees must run with `NX_DAEMON=false` (and `--skip-nx-cache` for test runs that matter); the lead re-verifies after merging.
7. **Playground e2e and the docs dev server both used port 4321**, and the e2e config reused a running server, so it could test the wrong site. The playground e2e now uses 4331 (`E2E_PORT`).

## Site

8. **On example pages with long code, the chart sits centered in a tall preview**, leaving space above and below. Open for the review.
