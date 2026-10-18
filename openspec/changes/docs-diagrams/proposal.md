## Why

Some docs explain a flow that prose and code don't show well: how the server's markup becomes a live chart in SSR with hydration, the pipeline's phases, what a renderer gets on each render. The site has no diagrams yet, and an ad-hoc SVG per diagram would drift from the design system and from the text.

Mermaid lets diagrams be written as text next to the docs, reviewed in diffs and kept up to date like code. Rendered at build time, a diagram is in the page's HTML: no Mermaid script in the browser, no layout shift, readable without JavaScript. Styled with the site's tokens, it looks like the rest of chartist.dev in both themes.

## What Changes

- **Diagram sources:** Mermaid files in `apps/docs/src/diagrams/<page>/<name>.mmd` (one diagram per file), each with an accessible title and description (`accTitle`, `accDescr`).
- **Rendering during the Astro build, not in the browser:** the build renders each diagram to SVG with Mermaid 12 in the repository's Playwright Chromium (Node has no layout engine, and Mermaid measures text), with the site's self-hosted fonts loaded so text is measured as it's shown. It post-processes the SVG:
  - Mermaid's own `<style>` element and inline sizes are removed;
  - colors become the site's tokens;
  - ids are prefixed per diagram;
  - the accessibility attributes are kept.

  A cache keyed by the source and the render settings keeps rebuilds and the dev server fast. Nothing rendered is committed. The build, the dev server and CI need Playwright's Chromium, which the docs deploy already installs for its e2e tests.

- **Authoring:** a page imports the source as text with Vite's `?raw` (`import flow from '../../diagrams/ssr-hydration/flow.mmd?raw'`) and passes it to a `Diagram` component (`<Diagram source={flow} caption="…" />`), which puts the SVG into the page inline, as a figure with an optional caption, so the page's CSS styles it. Saving a source re-renders it in the dev server. A syntax error, a missing `accTitle` or `accDescr`, or a color without a token fails the build and names the file.
- **Styling with the design system:** a diagram stylesheet in the site's CSS styles Mermaid's elements with the tokens, in light and dark mode, without rendering twice:
  - the palette, fonts (Zilla Slab and Atkinson), line weights, radii and the "printed card" look;
  - `brand`, `accent`, `muted` and `code` classes that a diagram's nodes can use.
- **The first diagram:** the SSR with hydration guide gets a diagram of the flow: on the server, the config becomes marked markup; in the browser, the page shows it scaled, the chart takes it over (`hydrate`), then lays itself out at the container's size (`resize`).
- **Writing guide:** `apps/docs/WRITING.md` says when a diagram helps, how to write one, which diagram types the styles cover, and how to render them.

## Breaking changes vs 1.x

None. This changes the docs site only.

## Out of scope

- Mermaid in the browser, in live examples or in the playground.
- Diagrams in the API reference, which is generated from doc comments.
- ` ```mermaid ` fences in MDX: Astro 7's default Markdown processor doesn't run rehype plugins, and sources in files keep diagrams intact under the formatter and reviewable in diffs.
- `with { type: 'text' }` imports instead of `?raw`: neither Vite 8.3 nor Node 22 supports the text type yet (checked); switching is a one-line change per page once Vite does.
- Styling every Mermaid diagram type: the stylesheet covers flowcharts, sequence diagrams and state diagrams; other types get the site's colors and fonts through the theme variables only.
- Converting existing figures (the mascot, the landing's pipeline section), which are hand-drawn components.

## Capabilities

### New Capabilities

- `docs-diagrams`: diagram sources and how pages include them, rendering during the build, the `Diagram` component, the diagram styles in both themes, accessibility, and the first diagram on the SSR with hydration guide.

### Modified Capabilities

None. The diagram on the SSR with hydration guide is part of the new capability; the guide's requirement in `docs-site` stays as it is.

## Impact

- `apps/docs`:
  - `src/diagrams/` (sources);
  - `src/lib/diagrams/` (the renderer, the post-processing and the cache, with unit tests);
  - `src/components/docs/Diagram.astro`;
  - `src/styles/diagrams.css`;
  - the SSR with hydration guide;
  - `WRITING.md` and `STYLING.md`.
- **New dev dependency:** `mermaid` (12.x, pinned) in `apps/docs`. It's loaded into the build's headless Chromium only, never shipped to readers. Playwright is already a dev dependency; the build now uses its Chromium too.
- **Docs e2e:** the guide's page loads cleanly and passes the axe check, and one test checks that the diagram follows the theme.
- `docs/decisions.md`: diagrams are Mermaid, rendered during the docs build in Playwright's Chromium and styled by the site. The published diagrams come from CI's Linux Chromium, the reference platform; local builds elsewhere may measure text slightly differently.
