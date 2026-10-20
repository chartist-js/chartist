## Why

Tooltips are what Chartist users install most: the three forks of the 1.x tooltip plugin together lead the plugin downloads (`chartist-plugin-tooltips` alone has about 21,600 a month), and they were asked for again and again (#978, #1142, #1257, Discussions #960 and #1391). The most used fork's repository is gone, it builds its content with `innerHTML` (so it breaks under Trusted Types and turns `meta` into markup), it can't be reached by keyboard or touch, and it doesn't know about live updates or hydration. The author decided on 2026-10-19 that tooltips become an official package, `@chartist-js/tooltips`, maintained in this repository and released with `chartist` (#1530, milestone 2.2.0).

## What Changes

- **A new package, `@chartist-js/tooltips`,** in `packages/tooltips`, built and tested like `@chartist-js/terminal`: ESM and CommonJS with declarations, plus a self-contained, minified browser ESM build for `<script type="module">` from a CDN, and a stylesheet (`@chartist-js/tooltips/styles.css`).
- **One export, `tooltips(options)`,** a v2 plugin (`{ name, install }`) for `chart()` and the presets, the functional API. It shows a tooltip for the value under the pointer, under a finger, or in keyboard focus:
  - on points, bars and slices by default; `roles` picks other roles, including roles from other layers;
  - with a default text from the value, its `meta`, the series name and the label, a `format` callback for your own text, and `numberFormat` for `Intl.NumberFormat` options (currency, units, digits);
  - a `render(content, item, data)` callback for your own content: DOM nodes or a framework's template (Angular, React, Vue) in the tooltip's content element, with an optional cleanup, so markup and framework rendering stay possible;
  - **text by default:** without `render`, content is set with `textContent`, never parsed as HTML, so it works under Trusted Types, and `meta` from data stays data;
  - anchored to the value's element by default, or following the pointer (`position: 'pointer'`), always kept inside the viewport, in the top layer (`popover`), so `overflow: hidden` and `z-index` don't clip it;
  - reachable by keyboard: the chart gets one tab stop, arrow keys move between values, `Escape` hides the tooltip; the focused value has an accessible name with the tooltip's text;
  - staying on its value through updates, resizes, live patching (`liveDomRenderer()`) and hydration, moving in step with update animations;
  - removing everything it added on `destroy()`; doing nothing where there's no container (`toScene()`, server rendering).
- **Styled with CSS only:** `.ct-tooltip` and its parts take their looks from `--ct-tooltip-*` custom properties with `light-dark()` defaults, and the position is set through the CSSOM as custom properties, so charts with tooltips still work under `style-src 'self'`.
- **Docs:** a package subsite at `/packages/tooltips/` (overview, a guide on content and styling, a guide for moving from the 1.x tooltip plugins, the API page), live examples, the registry entry and preview, and mentions in the guides that say Chartist has no tooltips ("Why Chartist", "Events and plugins", "Coming from 1.x", "Live updates").
- **The two tooltip plugins leave the plugins page** (`chartist-plugin-tooltips` and `@stklcode/chartist-plugin-tooltips`) with their pages and live examples, without a redirect: the author decided on 2026-10-19 that a plugin an official package replaces leaves the site, while a plugin the core replaces keeps its redirect (`chartist-plugin-targetline`). Every link to their pages points to the package's docs instead: the 0.x site's tooltip anchors to `/packages/tooltips/`, the "Coming from 1.x" link that names the `@stklcode` plugin to `/packages/tooltips/`. The plugins page requirement is widened from "the core" to "the core or an official package".
- **Release:** the package joins the fixed release group, so it's first published as `2.2.0` with `chartist`. It needs a trusted publisher on npmjs.com before that release.

## Breaking changes vs 1.x

None. Nothing in `chartist` changes. 1.x tooltip plugins keep working through `chartist/compat` as before; they are no longer listed on the plugins page, and the migration guide maps their options to `tooltips()`. The new plugin's options differ from the 1.x plugins' on purpose (no HTML content, no `appendToBody`, CSS for the offset); it's a new package, not a drop-in replacement.

## Out of scope

- Tooltips that collect all series at one X position (a crosshair or "shared" tooltip), and nearest-value lookup for pointers between values. Both need a hit model beyond the value's own element; a later minor can add them as options.
- HTML strings parsed by the plugin, and interactive content (links, buttons) the tooltip would have to keep open for; `render` can put any DOM in a tooltip, but the tooltip stays a hover and focus surface.
- Tooltips on axis labels, grid lines or the legend.
- Server-rendered tooltips: the plugin is browser interaction only; server markup stays unchanged.
- A UMD build: the plugin is for the v2 API, and UMD ships for 1.x compatibility only.
- A visual-regression example: a tooltip shows only on interaction; its rendering is checked in the package's browser smoke test instead. So the gallery convention of `@chartist-js/essentials` (its examples in `packages/examples/essentials/` and their own gallery section) doesn't apply: the tooltip examples stay docs examples in `apps/docs/src/examples/tooltips/`.
- The legend, axis title and value label plugins: they're `@chartist-js/essentials`, another change.

## Capabilities

### New Capabilities

- `tooltips`: the `@chartist-js/tooltips` package and its `tooltips()` plugin: builds and entry points, which values get tooltips, content and formatting, text-only output under strict CSP and Trusted Types, positioning, pointer, touch and keyboard interaction, accessibility, behavior across renders (updates, resizes, live patching, hydration), cleanup, several charts per page, the stylesheet, size budget, docs and tests.

### Modified Capabilities

- `docs-site`: the plugins page leaves out plugins that the core **or an official package** replaces, and those an official package replaces leave without a redirect, with every link to them repointed; old `#<slug>` anchors of plugins that left stay on the overview; the filter and old anchor scenarios no longer rely on the tooltip plugins being listed.

## Impact

- `packages/tooltips` (new): `src/` (plugin, content, positioning, keyboard), `styles.css` source and build script, `tsdown.config.ts`, `package.json` (`exports`, `nx` targets), `.size-limit.json`, `README.md`, licenses, unit tests (jsdom), a README test, smoke tests (pack and install, a strict-CSP and Trusted Types browser page in Playwright's Chromium).
- `nx.json`: `tooltips` in the release group. `pnpm-workspace.yaml` picks it up from `packages/*`.
- `apps/docs`: `src/content/packages/tooltips/`, `src/data/packages.ts`, `src/lib/package-previews.ts`, a TypeDoc options file, examples under `src/examples/tooltips/`, the playground library and import map (`integrations/playground-lib.mjs`), StackBlitz dependencies and types in `packages/playground`, `src/data/plugins.ts` and `plugin-files.json` (two entries out), their examples and pinned dev dependencies, `src/lib/v0-redirects.ts` and its test, `src/pages/plugins.astro` (description and lead), the tests that use the two plugins (`e2e/plugins.spec.ts`, `e2e/plugin-contract.spec.ts`, `src/lib/plugins.test.ts`, `src/lib/release.test.ts` samples), and the guides listed above. No `MOVED_PAGES` entry.
- The old 0.x site: the regenerated redirect pages for its tooltip anchors, pushed to its `gh-pages` branch at release time with the author's go.
- `docs/decisions.md`: the "Maintained packages" entry gets the package's shape (text only, top layer, keyboard), and the "Layers" entry about plugins that leave the list names official packages, whose plugins leave without a redirect.
- Author step, not done by this change: a trusted publisher for `@chartist-js/tooltips` on npmjs.com before the first release.
- No change to `chartist`'s code, exports or size. New dev dependencies: none beyond what `packages/terminal` uses.
