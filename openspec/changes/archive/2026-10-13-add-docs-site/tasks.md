# Tasks

## 1. App and wiring

- [x] 1.1 Install `@geekvetica/nx-astro`, generate `apps/docs` (minimal), add `@astrojs/mdx`, `@astrojs/check`, Fontsource packages and `chartist: workspace:*`; `build` depends on `^build`; `site`/`base` from env.
- [x] 1.2 Lint and format setup for `.astro` files consistent with the workspace (oxfmt, oxlint where supported).

## 2. Design system and theme

- [x] 2.1 `tokens.css`, `chart-theme.css`, `components.css`, `prose.css` from the design (D2); fonts (D4).
- [x] 2.2 Theme script and toggle (D3).

## 3. Components and layouts

- [x] 3.1 `Logomark`, `Mascot` (D6), `SiteHeader`, `SiteFooter`.
- [x] 3.2 `Chart` component (D5).
- [x] 3.3 Base and docs layouts: sidebar, TOC, prev/next, edit link, mobile menu, version switcher (D7); code block theme and copy button.

## 4. Pages

- [x] 4.1 Minimal landing hero, Getting started (MDX), 404 (D8).

## 5. Verification

- [x] 5.1 E2E and accessibility tests (D9) as the `e2e` target of `docs`.
- [x] 5.2 Plan updated; full gate including `docs` build, check and e2e; screenshots of the pages reviewed against the design.
