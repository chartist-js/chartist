## Why

The core of Chartist 2 is complete: the last core changes, live updates (#3) and the plugin cleanup hook (#961), are in. The release candidates have stalled, so waiting for feedback on another RC would take long, and feedback can be met without breaking anything. 2.0.0 makes `npm install chartist` install Chartist 2 and freezes the core API until 3.0, so the `@experimental` tags have to say exactly what may still change.

## What Changes

- **The core API is stable.** The `@experimental` tags come off everything in `chartist` but two parts: the functional API (`chart()`, the presets, the layers and axes), the pipeline and its events, the scene, the renderer contract and the renderers, plugins and their lifecycle, and the easing helpers. The same goes for `@chartist-js/terminal`.
- **Two parts stay experimental,** with the reason in their doc comments and the docs:
  - `chartist/live` (`liveDomRenderer()`, `smilAnimations()`, `diffScenes()` and their types): new with 2.0, it can become stable in a 2.x minor;
  - `container()` and `ContainerCondition`: they depend on `Element.matchContainer()`, a draft standard that needs a polyfill.
- **The experimental names are recorded,** as the deprecated ones are: a checked-in list per entry, compared with the declarations, so marking or unmarking a name is a visible change.
- **Docs:**
  - the "Experimental until 2.0" callouts in the composed charts, custom layers and target lines guides go;
  - the API reference's legend says what experimental means after 2.0;
  - the live updates guide says that `chartist/live` is experimental and why;
  - both READMEs install `chartist`, not `chartist@next`, and their CDN URLs use `chartist@2`.
- **The open changes are archived:** `release-v2-rc` (complete) and `archive-v0-docs` (its last three tasks, the post-deploy checks of `/v0/` and the old site's redirects, verified live on 2026-10-17), with their specs synced. That brings the `release-process` and `continuous-integration` specs, the deployment and install-text requirements, and the 0.x archive and redirects into the main specs, so the specs describe the project that releases 2.0.0.
- **The release:** `2.0.0` of `chartist` and `@chartist-js/terminal`, published under `latest` from a manual run of the release workflow, after which the repository variable `RELEASE_PREID` is unset, so later releases follow the conventional commits. The site's install instructions drop `@next` on their own once the version isn't a prerelease.

## Breaking changes vs 1.x

None beyond those of 2.0 itself. This change removes markers and changes no behavior. `npm install chartist` installing 2.0 is the major release: the migration guide and the 1.x docs at `/v1/` cover it, and the 1.x classes keep working.

## Out of scope

- Stabilizing `chartist/live` or `container()`.
- Posting release notes or closing issues on GitHub: drafts only, posted with the author's go.
- New features or fixes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- Through the archived changes (their own deltas, not this change's): `release-process` and `continuous-integration` become main specs, and `docs-site` and `library-distribution` gain their requirements.
- `public-api`: the experimental names of each entry are recorded and checked, and at 2.0 only `chartist/live` and the container query names are experimental.
- `docs-site`: the experimental marking requirement covers `chartist/live`, and stable APIs carry no experimental marks.

## Impact

- `packages/chartist`:
  - the doc comments of about 30 source files (`@experimental` tags and "until v2.0" module notes), the `src/index.ts` comment;
  - `test/api/exports/` (a recorded `experimental.json`, read and updated like `deprecated.json`) and an API test comparing it with the declarations;
  - `README.md`.
- `packages/terminal`: the doc comments of 6 source files, and its API test.
- `apps/docs`: three guides' callouts, the live updates guide, the API reference index page.
- `README.md` at the repository root.
- GitHub (author's go): a manual release run of `2.0.0`, then unsetting `RELEASE_PREID`.
