# Styling the docs site

The site uses **Tailwind v4** (Vite plugin) on top of the brand's design tokens. This note is the contract for everyone changing styles, people and agents alike.

## The cascade

`src/styles/global.css` sets three layers, in this order:

1. `theme`: Tailwind's theme, from `src/styles/theme.css`.
2. `components`: all of the site's own CSS, in its original order.
3. `utilities`: Tailwind utilities. **They win over everything in `components`.**

There is no preflight: `base.css` sets the element defaults (box sizing, headings without margins, links, inline code). Astro's scoped `<style>` blocks are unlayered and win over all layers, utilities included, so keep them for what utilities can't express.

## Tokens and the theme

`src/styles/tokens.css` is the single source; `theme.css` exposes it to Tailwind with `@theme inline`, so light and dark switch at runtime without `dark:` classes. Tailwind's own palette, fonts, sizes, radii and shadows are cleared: only these exist.

| Utilities                                | Values                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colors (`text-*`, `bg-*`, `border-*`, …) | `bg`, `bg-sunken`, `surface`, `surface-raised`, `line`, `line-strong`, `ink`, `ink-2`, `ink-inverse`, `brand`, `brand-hover`, `on-brand`, `accent`, `on-accent`, `link`, `focus`, `ok`/`ok-bg`, `warn`/`warn-bg`, `danger`/`danger-bg`, `info`/`info-bg`, `code-bg`, `code-ink`, `code-muted`, `black`, `white`, `transparent`, `current` |
| Fonts                                    | `font-slab` (Zilla Slab, headings), `font-sans` (Atkinson, body), `font-mono` (JetBrains Mono)                                                                                                                                                                                                                                            |
| Sizes                                    | `text-xs` 12, `text-sm` 14, `text-md` 16, `text-lg` 18, `text-xl` 22, `text-2xl` 28, `text-3xl` 36, `text-4xl` and `text-5xl` (fluid). They set only the font size.                                                                                                                                                                       |
| Line heights                             | `leading-tight`, `leading-snug`, `leading-body`, plus Tailwind's `leading-none` and numbers                                                                                                                                                                                                                                               |
| Radii                                    | `rounded-sm` 6, `rounded-md` 10, `rounded-lg` 16, `rounded-xl` 24, `rounded-pill`                                                                                                                                                                                                                                                         |
| Shadows                                  | `shadow-line`, `shadow-print-sm` (2 px offset), `shadow-print` (4 px offset, cards that pop), `shadow-float`                                                                                                                                                                                                                              |
| Easings                                  | `ease-gentle`, `ease-bounce`                                                                                                                                                                                                                                                                                                              |
| Breakpoints                              | `sm` 720 px, `md` 860 px, `lg` 1100 px. The design is desktop-first: `max-md:` replaces `@media (max-width: 860px)`.                                                                                                                                                                                                                      |

Spacing is Tailwind's 4 px scale (`p-4` = 16 px, `gap-6` = 24 px, `gap-3.5` = 14 px). Values off the scale or fluid ones take arbitrary values: `p-[clamp(24px,4vw,40px)]`, `tracking-[-0.02em]`, `grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))]`. Never write raw colors; use a token, or `[color-mix(in_oklab,var(--bg)_92%,transparent)]` built from tokens.

Dark mode: `dark:` follows `data-theme="dark"` on `<html>`. Most components need none; use it only where more than a token changes.

## Shared classes (`src/styles/ui.css`)

Patterns used across the site stay as plain classes in the `components` layer. Modifiers chain, and utilities override them:

- Layout: `wrap` (page width and gutters), `section`, `section-head`, `grid-auto`, `grid-auto-sm`
- Type: `eyebrow`, `display`, `lead`, `muted`, `hl`
- Controls: `btn` (`primary`, `sm`), `icon-btn` (`sm`), `chip`, `pill-link`
- `tag` (`brand`, `accent`, `ok`)
- `card` (`flat`, `link`), `dot-grid`

Use them as they are; add a new shared class only for a pattern repeated in three or more components.

## What stays CSS

- `tokens.css`, `theme.css`, `chart-theme.css` (the `--ct-*` chart theme: Chartist's own CSS API, which the site demonstrates), `mascot.css`.
- `motion.css`: scroll and view timelines (`.reveal`, the chapter progress), keyframes and their reduced-motion alternatives. Keep using the `reveal` class.
- Generated HTML: `base.css` (Shiki code blocks), `prose.css` (MDX content), `live.css` (the editor).
- Selectors into Chartist's SVG (`.ct-*`) or complex states (`:has()`, sibling chains): a scoped `<style>` in the component.

`components.css` and `landing.css` hold the **legacy rules** of components not migrated yet. They shrink as components migrate and go away in the end.

## Migrating a component

1. Move its styles onto its markup as utilities, removing its scoped `<style>` where utilities cover it.
2. Remove the component's classes that only served legacy rules. **Keep** `id`s, `data-*` attributes (`data-section`, `data-visual`, `data-chart`, `data-stage-scene`, …), ARIA attributes, and classes that scripts or tests select (`grep` `src/scripts` and `e2e` before removing one).
3. Leave `components.css` and `landing.css` alone: dead legacy rules are deleted in one pass at the end.
4. Check: `pnpm nx run-many -t lint check build -p docs`, then `node e2e/visual.mjs --only <names>` (from `apps/docs`) against the baseline. Fix every difference you didn't intend; list the ones you did, with the reason.

Reference: `src/components/landing/ReleaseBanner.astro` and `Numbers.astro`.

## Screenshot comparison

`pnpm nx run docs:visual` builds the site and compares screenshots with the baseline in `apps/docs/.visual/baseline/` (git-ignored); `-- --update` takes a new baseline, `-- --only hero,story` limits the shots, `-- --baseline <dir>` uses another baseline, `-- --port <n>` changes the server port. Shots are named `landing-<data-visual>-<desktop|phone>-<light|dark>`, `getting-started-…` and `404-…`. The report is `apps/docs/.visual/report.html`.
