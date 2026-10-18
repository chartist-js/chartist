# Tasks

## 1. Rendering

- [x] 1.1 Add `mermaid` (12.x, exact version) as a dev dependency of `apps/docs`, listed in the root `package.json` too if nx-astro needs it, and git-ignore `apps/docs/.cache/`. Verify: `pnpm install` and `pnpm nx run docs:build` still pass, and no page's bundle contains Mermaid (grep `dist/apps/docs` for a Mermaid-only string).
- [x] 1.2 Write the post-processing in `src/lib/diagrams/svg.ts`:
  - remove the `<style>` element, the inline `style` attributes and the root's `max-width`;
  - map the sentinel colors to `var(--token)`, and fail on any hex color left;
  - check that every id has the diagram's prefix;
  - check for the `<title>`, the `<desc>` and the root's role.

  Verify: unit tests on a fixture SVG that Mermaid rendered, covering each step and each failure.

- [x] 1.3 Write the renderer in `src/lib/diagrams/render.ts`:
  - one Playwright Chromium page per process, opened on the first diagram that isn't cached;
  - Mermaid's browser bundle and the site's `@font-face` rules with the self-hosted fonts;
  - `theme: 'base'` with the sentinel `themeVariables`, `htmlLabels: false`, `mermaid.render('diagram-<hash>', source)`;
  - the cache in `apps/docs/.cache/diagrams/`, keyed by the source, the Mermaid version and the settings;
  - errors that name the page, the diagram's `accTitle` and Mermaid's message, a failure without `accTitle` or `accDescr`, and an error naming the Playwright install command when Chromium is missing.

  Add an Astro integration that closes the browser in `astro:build:done` and when the dev server stops. Verify: unit tests for the cache key and the error messages; a build renders a diagram once, and a second build takes it from the cache without starting the browser ("An unchanged diagram").

- [x] 1.4 Add a fixture test that renders one flowchart, one sequence diagram and one state diagram, and lists the Mermaid class names `diagrams.css` relies on, so a Mermaid update that renames one fails. Verify: the test passes on the pinned version.

## 2. Component and styles

- [x] 2.1 Write `src/components/docs/Diagram.astro`: it takes the source text (`source`) and an optional `caption`, renders it through the renderer and puts the SVG inline in a `<figure class="diagram">` with a `<figcaption>`, at `width: 100%` and a `max-width` of the rendered width. Verify: a page that imports a `.mmd` file with `?raw` and renders `<Diagram source={…} caption="…" />` builds with the SVG inline ("Including a diagram"); a syntax error fails the build with the file's message ("A syntax error"); saving the source in the dev server updates the page ("Editing in the dev server").
- [x] 2.2 Write `src/styles/diagrams.css` with the tokens:
  - flowcharts (nodes, clusters, edges, edge labels, markers);
  - sequence diagrams (actors, messages, notes, activations);
  - state diagrams;
  - the site's fonts;
  - the `brand`, `accent`, `muted` and `code` node classes.

  Add it to `global.css` in the components layer, and to `STYLING.md`'s "What stays CSS". Verify: screenshots of the three fixture diagrams in light and dark mode, side by side with the design system's cards and code blocks.

## 3. The first diagram and the docs

- [x] 3.1 Write `src/diagrams/ssr-hydration/flow.mmd` (the flow in the design, `hydrate` as `accent`, with `accTitle` and `accDescr`) and include it in the SSR with hydration guide after the introduction, with a caption. Verify: `pnpm nx run docs:check`; screenshots in light and dark mode and at 375 px with no horizontal scroll ("A phone").
- [x] 3.2 Add an e2e test that the guide's diagram is inline in the HTML and that a node's fill changes when the theme switches ("Dark mode"), and add the guide to `A11Y_PAGES` for the axe check in both modes. Verify: `pnpm nx e2e docs`.
- [x] 3.3 Add a section on diagrams to `apps/docs/WRITING.md`:
  - when a diagram helps;
  - one diagram per file in `src/diagrams/<page>/`;
  - the `?raw` import and the `Diagram` component, with an example;
  - `accTitle` and `accDescr`, top-down layouts, the emphasis classes and the covered diagram types;
  - the one-time `playwright install chromium` on a new machine;
  - that `with { type: 'text' }` replaces `?raw` once Vite supports it.

  Verify: the section exists, and its example builds.

## 4. Gate

- [ ] 4.1 Run the gate: `pnpm nx format:check --all`, `pnpm nx run-many -t lint typecheck test --skip-nx-cache`, `pnpm nx run docs:check`, `pnpm nx e2e docs`. Verify: all of them pass.
