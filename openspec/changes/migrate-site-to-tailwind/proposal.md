# Proposal

## Why

The site's styles live in eight global CSS files (about 2,300 lines). Most of them style one landing section or one component, far from the markup they style, and dead rules are hard to spot: the browser review on 2026-10-13 found a duplicated `.card` rule that silently overrode a new class. Before more pages are styled (docs content, examples, API reference), the author decided on 2026-10-13 to move the site to Tailwind, so component styles live in the markup and the design tokens become the one theme everything uses.

## What Changes

- **Tailwind v4** in `apps/docs` through its Vite plugin, with no runtime and no third-party requests.
- **The design tokens become the Tailwind theme:** colors, fonts, type scale, spacing, radii, shadows, durations and easings, still defined once as CSS custom properties, so light and dark keep switching without rebuilding classes.
- **Dark mode** as a `dark:` variant keyed to the existing `data-theme` attribute.
- **Every page and component** in `apps/docs` moves to utility classes, with a few component classes (`@utility` or `@layer components`) for patterns used many times, such as the printed card (thick border, offset shadow) and tags.
- **What stays plain CSS:**
  - scroll-driven and view timelines, keyframes and the mascot's animations;
  - the chart theme (`--ct-*` custom properties: the library's own CSS-first API, which the site demonstrates);
  - HTML the site doesn't write: MDX prose and Shiki or CodeMirror output (`prose.css`, `live.css`);
  - the tokens themselves.
- **A screenshot comparison for the site:** a Playwright script that captures every landing section and docs page at desktop and mobile widths in light and dark, compares them with a baseline taken before the migration, and reports the differences. It guards this migration and stays as a target for later design work.
- **Mobile review:** the first visual pass at phone widths, which the landing review skipped.

The migration runs in parallel: after a shared foundation, about five subagents migrate separate component groups in their own git worktrees, each checked against the screenshot baseline (see design D5).

## Capabilities

### Modified Capabilities

- `docs-site`: the brand design system requirement says how styles are authored (Tailwind theme from the tokens, what stays CSS), and a new requirement covers the site screenshot comparison.

## Impact

- `apps/docs`: new dev dependencies `tailwindcss` and `@tailwindcss/vite`; most of `components.css` and `landing.css` is deleted; every `.astro` component changes its markup classes.
- No library or playground changes. Pages, copy, behaviour and accessibility stay as they are; the visual result stays the same except for differences listed in the review.
- New Nx target `docs:visual` (screenshots and comparison).
