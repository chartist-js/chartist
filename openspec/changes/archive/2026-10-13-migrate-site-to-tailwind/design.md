# Design

## Context

- `apps/docs/src/styles`: `tokens.css` (172 lines, light and dark semantic tokens), `components.css` (843), `landing.css` (679, ported from the design prototype, partly duplicating `components.css`), `mascot.css` (208), `chart-theme.css` (122), `live.css` (182), `prose.css` (82), `global.css` (9).
- Components: `SiteHeader`, `SiteFooter`, `InstallTabs`, `LiveExample`, `Chart`, `Mascot`, `Logomark`, `docs/Step`, `docs/Callout`, twelve landing sections, `BaseLayout`, `DocsLayout`, pages `index`, `404`, `docs/[...slug]`.
- Tests: `e2e/site.spec.ts` and `e2e/landing.spec.ts` (behaviour, axe), served by `e2e/serve.mjs`.

## Decisions

### D1: Tailwind v4 with the Vite plugin, tokens as the theme

`@tailwindcss/vite` in `astro.config.mjs`; `global.css` imports `tailwindcss` and the theme. The theme uses `@theme inline` and points at the existing custom properties (`--color-ink: var(--ink)`, `--font-display: var(--font-display)`, …), so `tokens.css` stays the single source and the dark tokens keep working at runtime. Tailwind's default palette is cleared (`--color-*: initial`) so only brand colors exist.

Alternative: the `@astrojs/tailwind` integration. It targets Tailwind 3 and is deprecated for v4.

### D2: Dark mode on `data-theme`

`@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`. Most components need no `dark:` classes at all, because the semantic tokens already switch; `dark:` is for the few places that change more than a color (the card border, for example).

### D3: Shared classes in the components layer

Utilities in the markup by default. Patterns used across the site stay plain classes in `ui.css`, in the `components` layer below utilities: `wrap`, `section`, `section-head`, `grid-auto`, `eyebrow`, `display`, `lead`, `muted`, `hl`, `btn`, `icon-btn`, `chip`, `pill-link`, `tag`, `card`, `dot-grid`, with their chained modifiers (`card flat`, `tag brand`, `btn primary sm`).

Changed during the foundation (2026-10-13): the proposal said `@utility`. Utilities sort among themselves by Tailwind's own order, so a modifier like `tag-brand` can't reliably override `tag`; classes in a lower layer keep today's names and modifiers, need no markup changes, and every utility still overrides them. All existing site CSS moved into that layer in its original order, so the switch changed no pixel.

### D4: What stays CSS

- `tokens.css`, `chart-theme.css` and `mascot.css`: unchanged.
- `prose.css` and `live.css`: generated HTML; they may use `@apply` or theme variables but stay files.
- Scroll and view timelines (`.reveal`, chapter progress, the story stage) and keyframes: in one `motion.css`, because timelines and `@keyframes` don't map to utilities well and must keep their reduced-motion alternatives side by side.
- A component's scoped `<style>` is allowed for anything Tailwind can't express cleanly (complex selectors into Chartist's SVG, `:has()` chains).

### D5: Parallel migration with subagents

1. **Foundation (lead, serial):** install, theme (D1), dark variant (D2), component utilities (D3), `motion.css` (D4), the conventions note `apps/docs/STYLING.md`, the screenshot script with its baseline (D6), and one reference section (`ReleaseBanner` + `Numbers`) migrated end to end.
2. **Groups (subagents, parallel, one git worktree each, branched from the foundation commit):**
   - A: `BaseLayout`, `DocsLayout`, `SiteHeader`, `SiteFooter`, `404`, docs pages;
   - B: `index` hero, `InstallTabs`, `ChapterNav`, `Story`;
   - C: `Features`, `Extend`;
   - D: `Gallery`, `TryIt`, `LiveExample`, `Responsive`;
   - E: `Animations`, `Compare`, `Outro`, `docs/Step`, `docs/Callout`.

   Rules for every group: change only the group's components; never edit the global CSS files (the lead deletes dead rules later); use only theme tokens and the D3 utilities; done means `lint`, `check` and `build` pass and the group's screenshots match the baseline, with every intended difference listed in the report.

3. **Integration (lead, serial):** merge the group branches in order, delete CSS no component uses any more, run the full screenshot comparison, e2e and axe, then review with the author in Chrome, including phone widths.

Groups are cut so no two touch the same file. Shared needs found by a group (a missing utility, a token) are reported, not added, and the lead adds them during integration.

### D6: Screenshot comparison (`docs:visual`)

A Playwright script (`e2e/visual.mjs`) builds nothing itself; it serves `dist/` with `serve.mjs` on a given port and captures:

- the landing page section by section (each `[data-section]`, plus hero and footer), the Getting started page and the 404 page;
- at 1440 × 900 and 390 × 844, light and dark;
- with motion settled: `prefers-reduced-motion: reduce`, charts rendered (`.ct-chart svg` present, draw-in finished), and the facts date fixed from the snapshot.

`--update` writes the baseline; otherwise it compares with `pixelmatch` and writes an HTML report of differing shots (before, after, diff). Baselines live in `apps/docs/.visual/` (git-ignored): they are a working tool for design changes, not a committed gate, because the site's design keeps moving. Worktrees use the lead's baseline by absolute path (`--baseline <dir>`).

## Risks / Trade-offs

- **Inconsistent class style between agents** → `STYLING.md`, the reference section, and the lead's review of each branch before merging.
- **Visual drift** → the screenshot comparison; tolerance is per pixel (antialiasing), not per image.
- **Font and layout shifts in screenshots** → fonts are self-hosted and awaited (`document.fonts.ready`) before each capture.
- **Long class lists in markup** → accepted; `@utility` for repeated patterns.
- **Token cost of parallel agents** → each reads only `STYLING.md`, the reference section and its own files.
