# Design

## Context

- **Experimental marks today:** `@experimental` tags in 29 core source files of `packages/chartist/src` (functional API, pipeline, scene, renderers, presets, layers, axes, responsive, easing helpers), 10 in `src/live`, 17 in `packages/terminal/src`. Three module comments say the v2 API may change "until v2.0" (`scene/node.ts`, `scene/roles.ts`, `live/index.ts`), and `src/index.ts` labels the v2 exports "experimental until v2.0".
- **The API reference** turns the tag into an "experimental" badge (`apps/docs/src/lib/api.ts`), and its index page explains the badge as "may still change before v2.0".
- **Deprecated names** are already recorded per entry in `test/api/exports/deprecated.json`, read from the built declarations with the TypeScript API (`exports/read.ts`, `deprecatedNames()`), and compared by `deprecations.api.ts`; `exports/update.ts` rewrites the list.
- **Releases:** `.github/scripts/release.mjs` picks the version from the manual run's specifier first, and refuses an automatic run when the current version is final while `RELEASE_PREID` is set. A final version is published under `latest`. The site's install text keeps `@next` only while the version is a prerelease.

## Goals / Non-Goals

**Goals:**

- After 2.0.0, every experimental mark means "may change in a 2.x minor", and the marks sit exactly where that's true.
- The set of experimental names is checked like the deprecated ones, so it can't drift silently.

**Non-Goals:**

- Changing any behavior, signature or default.

## Decisions

### What stays experimental

- **`chartist/live`:** all of its exports and option types. It's new with 2.0, its first users haven't reported back yet, and it lives in its own entry point, so it can become stable in a 2.x minor without touching the core.
- **`container()` and `ContainerCondition`:** they rest on `Element.matchContainer()`, a draft in csswg-drafts#6205, through a polyfill. They stay experimental until the standard settles.
- **Everything else is stable,** including `ResponsiveCondition` (a media query string or a container condition: the type is stable, the container half isn't), the renderer contract (`RenderUpdate`, `SceneChange`, `RenderOutput.patched`/`changes`/`animation`), `Layer.keyframes` and `ChartPlugin.keyframes`. The latter are part of the core contract that third-party renderers and plugins build on, even though `chartist/live` is their first user.
- **`@chartist-js/terminal`** is stable with 2.0.0: it's released in lockstep with `chartist`, and its API follows the core's.

### Recording experimental names

`exports/read.ts` gets `experimentalNames(build, file)` next to `deprecatedNames()`: the exports whose JSDoc has an `@experimental` tag. A new `experimental.json` records them per entry (`chartist`, `chartist/compat`, `chartist/live`), written by `exports/update.ts`, and an API test compares both, naming each difference.

- _Alternative, a grep over the source:_ the declarations are what users get. The deprecation test checks them, and a tag the declaration build drops would go unnoticed in the source.

### Module comments and wording

- "until v2.0" becomes "may change in a 2.x minor" where the mark stays (`live/index.ts`), and goes where it doesn't.
- The API reference's legend: "Experimental: may still change in a 2.x minor".

### Archiving the open changes first

`release-v2-rc` and `archive-v0-docs` are archived before this change's own work, so the main specs include the release process this change relies on. Checked beforehand:

- none of their 22 added requirements is in the main specs yet;
- their one modified requirement, "Archived versions" in `docs-site`, extends the main spec's text (it adds `/v0/` next to `/v1/`);
- neither touches a requirement that live updates or this change modify.

The three open tasks of `archive-v0-docs` are checks of the live sites, done on 2026-10-17:

- `/v0/`, `/v0/examples.html` and `/v0/getting-started.html` load with the archive note;
- the old site's `examples.html` redirects to chartist.dev with a canonical link and a meta refresh;
- an unknown old path gets the 404 page that sends it to `/v0/` with the same path.

### The release order

1. Merge the branch with this change into `main`.
2. The author starts the release workflow by hand with the version `2.0.0` and approves it in the `release` environment. It publishes `chartist` and `@chartist-js/terminal` 2.0.0 under `latest`, tags `v2.0.0`, writes the changelog section and the GitHub release, and the docs deploy picks up the version.
3. The author unsets `RELEASE_PREID`, so the next automatic release follows the conventional commits (2.0.x, 2.1.0). Unsetting it before step 2 would let an automatic run after the merge choose the version from the commits, which isn't 2.0.0.

## Risks / Trade-offs

- **An API mistake found after 2.0.0 can only be fixed additively or in 3.0** → the core had three release candidates. The part with the least use, `chartist/live`, stays experimental.
- **`npm install chartist` jumps from 1.5 to 2.0 for everyone without a version range** → semver: a major. The 1.x classes keep working, the migration guide covers the rest, and the 1.x docs stay at `/v1/`.
