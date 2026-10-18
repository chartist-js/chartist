# Design

## Context

- **The docs stack:**
  - Astro 7.3.6 with `@astrojs/mdx` 8.0.2, a static build, Tailwind v4 on design tokens (`src/styles/tokens.css`, `STYLING.md`).
  - Light and dark mode through `data-theme` on `<html>`.
  - Self-hosted fonts: Zilla Slab, Atkinson, JetBrains Mono.
  - No third-party requests.
  - The site sends no Content Security Policy.
- **Markdown processing:** Astro 7's default Markdown engine (Sätteri) runs its own `mdastPlugins` and `hastPlugins`, not rehype plugins. Rehype plugins need the `unified()` processor from `@astrojs/markdown-remark`.
- **Playwright** 1.63 is already a dev dependency, with Chromium, for e2e and the visual tests.
- **Text metrics** differ between the author's WSL host, CI and the dev container. The visual baselines are therefore recorded on the reference platform only (`docs/decisions.md`).
- **The Mermaid options** (checked on npm today):
  - **Mermaid 12.2.0** (2026-10-13). It has no DOM-free renderer: layout calls `getBBox()` and `getComputedTextLength()`, so it needs a browser.
  - **`@mermaid-js/mermaid-cli` 12.0.0** needs Puppeteer 25, a second Chromium.
  - **`rehype-mermaid` 3.0.0** (2024) runs on `mermaid-isomorphic` with Playwright, but is tied to Mermaid 11 and is a rehype plugin.
  - **`astro-mermaid`** renders in the browser.
  - **`beautiful-mermaid` 1.1.3** is DOM-free but a reimplementation of six diagram types. It has no accessibility output and fixed marker ids, and it imports Google Fonts.
- **Mermaid's SVG:**
  - a `<style>` element scoped to the SVG's id;
  - `style="max-width: …"` on the root;
  - inline styles in HTML labels;
  - `role="graphics-document document"`, `aria-roledescription`, and with `accTitle`/`accDescr` a `<title>` and `<desc>` referenced by `aria-labelledby`/`aria-describedby`.

  `themeVariables` take hex colors only, since Mermaid derives shades from them.

## Goals / Non-Goals

**Goals:**

- Diagrams written as text, reviewed in diffs, shown as inline SVG without a Mermaid script.
- One SVG per diagram that follows light and dark mode through the site's CSS.
- Authoring in one step: write a `.mmd` file, include it in the page, see it in the dev server, with errors failing the build.
- The design system's look, with as little Mermaid-specific CSS as it takes.

**Non-Goals:**

- Mermaid in the browser or the playground.
- Styling every diagram type.
- Pixel-identical rendering on every machine.

## Decisions

### Rendering during the Astro build, with Mermaid 12 in the repository's Playwright

Mermaid can't render in Node: its layout measures text with the browser's layout engine (`getBBox()`, `getComputedTextLength()`), which Node and jsdom don't have. So the build starts a headless Chromium for it, the one Playwright already installs for the e2e tests.

`src/lib/diagrams/render.ts` keeps one browser page per process, opened on the first diagram and closed when the build ends. The page loads Mermaid's browser bundle from `node_modules` and the site's `@font-face` rules with the self-hosted font files. For each diagram it calls `mermaid.render(id, source)`, and Node post-processes the result (`src/lib/diagrams/svg.ts`, under unit tests). An Astro integration closes the browser in `astro:build:done` and when the dev server stops.

- **Cache:** rendered SVGs are stored in a git-ignored folder (`apps/docs/.cache/diagrams/`), keyed by a hash of the source, the Mermaid version and the render settings (the theme variables and the post-processing version). An unchanged diagram never starts the browser, so rebuilds and the dev server stay fast.
- **Where Chromium is needed:** the docs build, the dev server and CI. The docs deploy (`docs.yml`) and CI already install Playwright's Chromium before they build. `WRITING.md` says to run `pnpm --dir apps/docs exec playwright install chromium` once on a new machine, and the renderer's error says so too.
- **Text metrics:** the published site is built in CI on Linux with Playwright's Chromium, the reference platform, with the site's fonts loaded in the page, so its diagrams are measured consistently. A local build in the dev container may measure slightly differently; that only affects the author's preview.
- _Alternative, a script that renders to committed SVGs, checked by hash (the first draft):_ the build needs no browser, but authors run an extra command, a check is needed for stale files, and generated SVGs go into the repository. With Chromium already in CI and the deploy, rendering in the build is simpler.
- _Alternative, Mermaid in the reader's browser (`astro-mermaid`):_ a large script on every page with a diagram, a diagram that appears only after JavaScript, and dark mode handled at runtime.
- _Alternative, `@mermaid-js/mermaid-cli`:_ official, but Puppeteer brings a second Chromium.
- _Alternative, `rehype-mermaid`:_ convenient fences, but it is tied to Mermaid 11 and needs the `unified()` processor on Astro 7.
- _Alternative, `beautiful-mermaid`:_ no browser, but not Mermaid, six types, no accessibility, fixed ids and a Google Fonts import.

### Sources in files, imported as text, rendered by a component

- **Sources:** `src/diagrams/<page>/<name>.mmd`, one diagram per file.
- **A page includes one** with Vite's raw import and the component:

  ```mdx
  import Diagram from '../../components/docs/Diagram.astro';
  import flow from '../../diagrams/ssr-hydration/flow.mmd?raw';

  <Diagram source={flow} caption="From the server's markup to a live chart." />
  ```

- **`Diagram.astro`** renders the source (from the cache or the browser) and puts the SVG inline in a `<figure class="diagram">` with an optional `<figcaption>`. The diagram's id comes from a hash of its source, so two diagrams on a page never share ids. In the dev server, Vite reloads the page when the imported `.mmd` file changes.
- **Errors fail the build and name the file:** a Mermaid syntax error, a missing `accTitle` or `accDescr`, or a color the token mapping doesn't cover. The component knows the source text, not its path, so the error names the page and the diagram's `accTitle`, which the source requires anyway.
- Inline, not `<img>`: an image can't see the page's custom properties, so it would need two renderings for the two modes.
- _Alternative, ` ```mermaid ` fences:_ a plugin on Astro 7's Markdown processor, a different API than rehype's (not verified), or a switch to `unified()` for the whole site. Separate files also stay intact under the formatter, which strips indentation from strings in MDX.
- _Alternative, `with { type: 'text' }` imports:_ the standard-track way to import text, but neither Vite 8.3 nor Node 22 supports the text type yet (checked: Vite parses the file as JavaScript, Node rejects the extension). JSON imports work because JSON modules are standard. Switching from `?raw` is a one-line change per page once Vite supports it.

### The site styles the diagram; Mermaid's styles are removed

The post-processing makes the SVG neutral:

- it removes Mermaid's `<style>` element, the root's inline `max-width`, and every `style` attribute;
- it renders with `htmlLabels: false`, so labels are SVG `text`, with no `foreignObject` and its inline styles;
- it replaces colors with tokens. Mermaid renders with `theme: 'base'` and a set of distinct sentinel hex colors as `themeVariables`. The post-processing maps each sentinel in the attributes Mermaid writes (marker fills, some `fill`/`stroke` attributes) to `var(--token)`, and fails on any hex color left;
- it sets the root's `width="100%"` and a `max-width` through a class.

`src/styles/diagrams.css` (plain CSS, as `STYLING.md` keeps it for generated HTML) styles Mermaid's class names inside `.diagram`:

- **Flowcharts:** `.node rect`, `.cluster rect`, `.edgePath path`, `.edgeLabel`, `.marker`.
- **Sequence diagrams:** `.actor`, `.messageLine0`, `.messageText`, `.note`, `.activation`.
- **State diagrams:** `.stateGroup`, `.transition`.
- **Text:** the site's fonts.
- **The look:**
  - `--line-strong` borders at 2 px with `--ink` text on `--surface` cards;
  - `--accent` and `--brand` for the emphasis classes, and `--code-bg` for `code` nodes;
  - rounded corners from the radius tokens, and the print-offset shadow as a second rectangle where the design has it.

The selectors are pinned to the Mermaid version in the lockfile, and a unit test on a rendered fixture lists the class names the stylesheet relies on. A Mermaid update that renames one fails that test.

- _Alternative, `themeCSS` with `var()`:_ it works inside Mermaid's `<style>`, but that element is id-scoped, repeats per diagram, and mixes Mermaid's defaults with ours.

### Ids and accessibility

`mermaid.render()` gets the id `diagram-<hash>`, from a hash of the source, which prefixes the markers and other ids. The post-processing checks that every id carries the prefix. The render fails when a source has no `accTitle` or `accDescr`. The component adds no `alt` or `aria-label` of its own: the SVG's title and description name it, and the caption is visible text.

### Sizing

The SVG keeps Mermaid's `viewBox`. The component's figure gives it `width: 100%` and a `max-width` of its rendered width, so it scales down in narrow columns and is never drawn larger. `WRITING.md` asks for top-down layouts (`flowchart TD`) for anything wider than a few nodes, so text stays readable on phones.

### The first diagram

`src/diagrams/ssr-hydration/flow.mmd`, a flowchart in two clusters:

- **Server:** config and `renderForHydration()` to the markup, with the server's size;
- **Browser:**
  - the page shows the markup, scaled (`viewBox`);
  - `lineChart()` with `liveDomRenderer()` gives `hydrate`, binding the server's elements;
  - when the size differs, `resize` relays out at the container's size.

The `hydrate` node is `accent`. It goes after the guide's introduction, with a caption.

## Risks / Trade-offs

- **[Mermaid's class names change]** → Pinned version; the fixture test fails on renames, and updating Mermaid means re-rendering and adjusting the stylesheet.
- **[Sentinel colors collide with real colors]** → The sentinels are values no token uses, and the post-processing fails on any unmapped hex color.
- **[Text metrics differ by machine]** → The published site is built in CI, the reference platform; labels get padding so small differences in a local preview don't overflow.
- **[A build without Chromium]** fails on the first diagram. → The renderer's error names the install command, `WRITING.md` lists it, and CI and the deploy already install Chromium.
- **[Build time]** → One browser per build, started only for diagrams missing from the cache; a cold build renders a handful of diagrams in a few seconds.
- **[Inline SVGs add page weight]** → A flowchart of ten nodes is a few kB of markup, less than Mermaid's script would be.

## Migration Plan

Additive. No existing page changes, apart from the SSR with hydration guide getting its diagram. On archive, `docs/decisions.md` records the choice (Mermaid, rendered during the docs build in Playwright's Chromium, styled by the site) and `STYLING.md` lists `diagrams.css`.

## Open Questions

- Whether the landing's pipeline section and the events and plugins guide should get diagrams too. They're follow-ups once the first diagram is reviewed.
