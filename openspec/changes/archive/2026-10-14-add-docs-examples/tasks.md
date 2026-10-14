# Tasks

## 1. Foundation (lead)

- [x] 1.1 Manifest: `description`, `classic`; harness renders both entries against one baseline, 1.5.0 renders the classic entry; per-entry baseline override.
- [x] 1.2 `packages/examples/CONVERTING.md`; reference conversions `line/simple` and `line/modify-drawing` (copy commit, rewrite commit).

## 2. Converters (subagents in parallel, one worktree each)

- [x] 2.1 Line A.
- [x] 2.2 Line B.
- [x] 2.3 Bar.
- [x] 2.4 Pie.
- [x] 2.5 Composed and styling (descriptions; classic entries only where 1.x code exists).

## 3. Playground library (lead)

- [x] 3.1 Toolbar actions (`resetAction`, `copyAction`, `shareAction`, `openAction`, `stackblitzAction`, custom), `layout: 'inline' | 'full'`.
- [x] 3.2 `createPreview()`; the playground uses it internally.
- [x] 3.3 `--pg-*` theming in `@layer playground`; the docs' `live.css` reduced to assignments and token colors; `LiveExample` drops its toolbar patching.
- [x] 3.4 `encodeShare()`/`decodeShare()` (`share.ts`) with unit tests (round trip, unicode, size, bad input).
- [x] 3.5 Unit tests and the playground's e2e for actions, layouts and the preview component.

## 4. Site (lead)

- [x] 4.1 Package example loader; `LiveExample` classic tab.
- [x] 4.2 `/examples/` gallery with live thumbnails and type filter.
- [x] 4.3 `/examples/<type>/<name>/` pages with prev/next and the playground link.
- [x] 4.4 `/playground/` full-screen playground: `#example=` and `#code=`, the address follows edits (debounced), Share, Reset, StackBlitz export; header link.
- [x] 4.5 `LiveExample`: "Open in playground" with its current files, replacing StackBlitz.
- [x] 4.6 e2e: every gallery example runs without errors; axe on the gallery, an example page and the playground; a shared address reopens the same edited code.

## 5. Integration (lead)

- [x] 5.1 Merge; findings (examples that can't match 1.x) listed.
- [x] 5.2 Review with the author in Chrome; fixes.
- [x] 5.3 Plan updated; full gate.
