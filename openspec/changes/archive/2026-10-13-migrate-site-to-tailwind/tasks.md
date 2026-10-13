# Tasks

## 1. Foundation (lead)

- [x] 1.1 `tailwindcss` and `@tailwindcss/vite` pinned; Vite plugin in `astro.config.mjs`; theme from the tokens (D1); `dark` variant (D2); build passes with no visual change.
- [x] 1.2 `e2e/visual.mjs` and target `docs:visual` (D6); `.visual/` git-ignored; baseline taken from the current site before any markup changes.
- [x] 1.3 Component utilities `card`, `card-flat`, `tag`, `eyebrow`, `btn`, `dot-grid` (D3); `motion.css` (D4).
- [x] 1.4 `apps/docs/STYLING.md`: conventions, utilities, what stays CSS, the agent rules from D5.
- [x] 1.5 Reference section: `ReleaseBanner` and `Numbers` migrated; screenshots match; committed as the foundation.

## 2. Groups (subagents in parallel, one worktree each)

- [x] 2.1 Group A: layouts, header, footer, 404, docs pages.
- [x] 2.2 Group B: hero, `InstallTabs`, `ChapterNav`, `Story`.
- [x] 2.3 Group C: `Features`, `Extend`.
- [x] 2.4 Group D: `Gallery`, `TryIt`, `LiveExample`, `Responsive`.
- [x] 2.5 Group E: `Animations`, `Compare`, `Outro`, `Step`, `Callout`.

## 3. Integration (lead)

- [x] 3.1 Review and merge the group branches; add the shared needs the groups reported.
- [x] 3.2 Delete unused rules from `components.css` and `landing.css` (delete the files if empty); full screenshot comparison, `lint`, `check`, `build`, e2e and axe.
- [x] 3.3 Review with the author in Chrome: desktop and phone widths, light and dark; fix findings.
- [x] 3.4 Plan updated; full gate.
