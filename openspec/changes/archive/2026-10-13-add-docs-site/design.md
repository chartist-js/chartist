# Design

## Context

- **Design:** `docs/visual-design` (snapshot `1791919724-153a`). `chartist.css` holds:
  - primitives (`--p-*`), semantic tokens on `:root, .cx` and `.cx.dark`, and mascot colors (`--m-*`);
  - chart tokens (`--ct-*`, now real library properties since `add-css-custom-properties`);
  - component styles (header, cards, buttons, docs layout, code blocks).

  The `.dc.html` artboards are reference markup: structure, copy, data.

- **Tooling:** `@geekvetica/nx-astro` 3.x infers `dev`, `build`, `preview`, `check` and `sync` for Astro projects. The workspace uses Nx 23, pnpm, TypeScript 6, Playwright 1.63, oxlint and oxfmt.
- **Playground spike:** `packages/playground` proved a static Astro-style build under a base path and the in-browser compile; the live editor comes later (`add-docs-examples`).

## Decisions

### D1: App and Nx wiring

- **Scaffolding:** `apps/docs` is created with `nx g @geekvetica/nx-astro:application` (via the `nx-generate` skill), then trimmed to the minimal template.
- **Dependencies:** `chartist: workspace:*`; `build` depends on `^build`.
- **Output:** static (`output: 'static'`), with `site` and `base` read from environment variables (defaults for local builds), because hosting is decided in the release phase.
- **E2E:** an `e2e` target runs Playwright against `astro preview` of the build.

### D2: Styles in layers

`src/styles/` has three layers:

- `tokens.css`: primitives, semantic tokens and mascot colors, copied from the design, with dark values under `:root[data-theme="dark"]`;
- `chart-theme.css`: maps site tokens to `--ct-*`, plus the design's dark lifts for series e, g and h (site-only, see `add-css-custom-properties`);
- `components.css` and `prose.css`: component and content styles, ported from the design classes, with names kept where they're clear.

`chartist/styles.css` is imported once; the design's mock chart rules (`.ct-dot`, `.ct-svg`) are not ported because real charts use the library's classes.

### D3: Theme switching

- **Before first paint:** an inline script in `<head>` sets `data-theme` on `<html>` from `localStorage` (try/catch), else `light`. Light is the default regardless of the OS preference (author decision 2026-10-13).
- **`color-scheme`:** CSS sets it per theme, so the accessible chart theme and form controls follow.
- **Toggle:** a button in `SiteHeader` flips the attribute and saves the choice. Charts don't re-render; their colors are custom properties.
- **Without JavaScript:** the light theme.

### D4: Fonts

- **Packages:** `@fontsource/zilla-slab` (500, 600, 700, italic 500), `@fontsource-variable/atkinson-hyperlegible-next` and `@fontsource-variable/atkinson-hyperlegible-mono`, imported in the base layout.
- **Loading:** the Zilla Slab 700 woff2 is preloaded (hero and headings). `font-display: swap`.

### D5: The `Chart` component

- **Markup:** `<Chart type="line" data={…} options={…} aspect="16/10" />` renders a `div` with `aspect-ratio`, so its box is reserved, plus a module script.
- **Loading:** the script imports only the needed preset from `chartist` and renders when the element enters the viewport (IntersectionObserver), or immediately above the fold.
- **Config:** passed through a `data-` attribute as JSON. Functions (e.g. `labelInterpolationFnc`) aren't serializable, so charts needing them use a small per-chart client module instead (the `Mascot` hero chart does).
- **Motion:** draw-in animation via CSS classes, disabled under `prefers-reduced-motion`.

### D6: The mascot

- **SVG:** `Mascot.astro` renders the design's mascot SVG with poses `hero`, `point` and `lost` (more in `add-landing-page`). Colors come from `--m-*` tokens, and the `lost` pose keeps the design's toppled board.
- **Board chart:** a real Chartist line chart, positioned over the board's rectangle with percentage coordinates of the SVG's viewBox, so it scales with the mascot. Its data, labels and series names follow the internal notes in the plan; the visible accessible name stays neutral.

### D7: Content and navigation

- **Collection:** `src/content/docs/**.mdx`, with a schema of `title`, `description`, `group` (`Start here`, `Chart types`, `Guides`, …) and `order`.
- **Navigation:** the sidebar and prev/next come from one sorted list. The TOC uses the h2/h3 headings Astro provides.
- **Edit link:** points to `https://github.com/chartist-js/chartist/edit/next/apps/docs/<path>`.
- **Version switcher:** a native `<select>` that navigates to the v1 site (chartist.dev) and the v0 archive (gionkunz.github.io/chartist-js), with a link fallback without JavaScript.
- **Code blocks:** Astro's Shiki with a theme built from the design's code tokens, in light and dark (CSS variables theme), plus a copy button as a tiny inline script.

### D8: Pages in this change

- **`/`:** a minimal hero (mascot with live chart, pitch, install tabs for npm and the CDN module). Replaced by `add-landing-page`.
- **`/docs/getting-started`:** the first real content.
- **`/404`:** the lost mascot.

Header links to sections that don't exist yet (Examples, API, Plugins) are hidden until their changes land, so there are no dead links.

### D9: Tests

Playwright runs in `apps/docs/e2e` against the preview server:

- every page loads without console errors and without requests to other origins;
- the theme persists across a navigation and is applied before paint (no `data-theme` change after load);
- charts render an `svg.ct-chart-*` in their box;
- the copied Getting started snippet, served as a static file with the CDN URL mapped to the local build, renders a chart;
- `@axe-core/playwright` reports no violations in light and dark;
- keyboard: skip link, focus visible on header controls.

They run in Chromium; Firefox and WebKit join in the release phase CI.

## Risks / Trade-offs

- **Charts need JavaScript:** a chart is an island, so without JavaScript the reserved box stays empty with its accessible label. Server-rendered charts (`toScene` + `renderToString`) are a later option.
- **Design CSS size:** the ported CSS is about 36 kB unminified; Astro bundles and minifies it. Unused design classes (mock charts) are left out.
- **Plugin maturity:** `@geekvetica/nx-astro` is a third-party plugin; if it gets in the way, plain inferred targets from `package.json` scripts are the fallback.

## Implementation notes

- **Plugin model for dependencies:** `@geekvetica/nx-astro` keeps `astro` and every `@astrojs/*` package at the workspace root (pinned) and copies them into `apps/docs/package.json` before each build; its `check` executor looks for `@astrojs/check` at the root. The app's own `package.json` holds the rest (Fontsource, `chartist`, Playwright, axe). `init` also added `@astrojs/node` (a server adapter), which was removed: the site is static.
- **Type checking:** `astro check` (target `check`) type-checks the app including `.astro` files; the `@nx/js` typecheck plugin excludes `apps/docs`. The app uses Astro's strict tsconfig instead of the generated React one.
- **E2E server:** `astro preview` detaches into the background when there is no terminal (agents, CI), which Playwright's `webServer` can't manage. `e2e/serve.mjs` serves the build like a static host instead, with `404.html` and status 404 for unknown paths. Vitest only looks at `src/**/*.test.ts`, so it doesn't pick up the Playwright specs.
- **Fonts:** Fontsource registers the variable fonts as "Atkinson Hyperlegible Next Variable" and "… Mono Variable"; the font stacks list those names first.
- **Paper texture:** the design's `paper.png` and `paper-dark.png` ("Cream Paper" from Subtle Patterns, CC BY-SA 3.0, recolored) are site assets in `src/assets/`, loaded through Vite so they work under any base path, on page grounds only. CC BY-SA requires attribution: the footer credits them and `src/assets/README.md` notes the license. (They were missed in the first snapshot download, which fetched an explicit list of files.)
- **Mascot board in dark mode:** the board stays paper-white, so its chart keeps light label and grid colors (scoped custom properties on `.mascot-board`).
- **Draw-in:** a v2 plugin (`compose` listener) gives lines, bars and slices `pathLength="1"`; CSS animates them, off with reduced motion.
- **Charts' svg is `display: block`:** an inline svg added a baseline gap, which grew the reserved box by 9 px after rendering (caught by the e2e layout-shift test).
- **Footer license:** "MIT or WTFPL", as in the repository (the design said MIT).
