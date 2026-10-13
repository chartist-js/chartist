# Proposal

## Why

The library is feature-complete for v2, and the brand and docs design (`docs/visual-design`, including the landing prototype) is ready. Chartist needs its own site again: crafted and playful like 0.x, fast, and built on the real library. This change lays the foundation every later site change builds on (landing page, content, examples, API reference) and proves the whole pipeline with one real page: Getting started.

## What Changes

- **The Astro app** `apps/docs` (project `docs`), static output, wired into Nx with `@geekvetica/nx-astro` (author decision 2026-10-13). It depends on the workspace `chartist` build, so the site always shows the current library.
- **The design system as site CSS:** the tokens and component styles of the design's `chartist.css` (palette, semantic tokens for light and dark, type scale, spacing, radii, shadows, motion), split into token and component layers. Charts are themed only through the library's `--ct-*` properties.
- **Self-hosted fonts** (Fontsource): Zilla Slab, Atkinson Hyperlegible Next and Mono, with the display font preloaded. The site makes no third-party requests.
- **Light and dark mode:** the OS preference by default, a toggle that persists, no flash of the wrong theme, and `color-scheme` set, so charts and the accessible theme follow.
- **Brand components:** `Logomark`, `Mascot` (poses `hero`, `point`, `lost`; all colors from tokens), `SiteHeader` (nav, GitHub, theme toggle, mobile menu) and `SiteFooter` (with the Cube sponsor line).
- **`Chart` component:** renders a real Chartist chart with the functional API (`lineChart`, `barChart`, `pieChart` or a `chart()` config) as a small client island in a box of reserved size, so nothing jumps. The mascot's easel shows one.
- **Docs layout:** sidebar from the content collection, an on-page TOC, prev/next, "Edit this page on GitHub", a mobile docs menu, and a version switcher (v2 current, links to the v1 and v0 sites).
- **Content pipeline:** an MDX content collection (`src/content/docs`) with frontmatter for title, description, group and order; code blocks with a theme from the design tokens; components usable in MDX.
- **Getting started**, the first real page: no bundler first (`<script type="module">` from a CDN with the real `dist/index.min.js` and `dist/index.min.css` paths), then npm, then styling with custom properties. Functional API throughout, with a live chart.
- **A minimal landing hero** (the mascot presenting a live chart, the pitch, the install tabs) as a placeholder until `add-landing-page` builds the full scroll story.
- **404 page** with the `lost` mascot.
- **Quality gates:**
  - Playwright end-to-end tests on the built site: pages render, no console errors, the theme toggle persists, charts render;
  - automated accessibility checks (axe, WCAG AA);
  - `astro check` for types.

## Out of scope

- The full landing page (`add-landing-page`), guides and the migration guide (`add-docs-content`), the examples gallery and live editor (`add-docs-examples`), the API reference (`add-api-reference`), search, OG cards (polish).
- Hosting, domains and deployment (release phase, at the end).
- Server-rendered charts (`toScene()`) on the site; possible later for charts that should show without JavaScript.

## Breaking changes vs 1.x

None. This adds a new app; the library is unchanged.

## Capabilities

### New Capabilities

- `docs-site`: the documentation website: build, design system, themes, live charts, docs layout and content pipeline, accessibility.

### Modified Capabilities

None.

## Impact

- New `apps/docs` (Astro 7, `@astrojs/mdx`, `@astrojs/check`, Fontsource packages) and the `@geekvetica/nx-astro` plugin in `nx.json`.
- Dev dependencies: `@axe-core/playwright` for the site's e2e tests.
- Root gate gains the site's `build`, `check` and `e2e` targets.
