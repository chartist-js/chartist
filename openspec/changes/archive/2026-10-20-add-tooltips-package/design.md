# Design

## Context

- **The plugin contract** (`packages/chartist/src/chart/plugins.ts`, `chart/types.ts`): a v2 plugin is `{ name, install(chart, options) }`. `install` runs once before the first render; its return value is called once on `destroy()`, after the output is removed. `chart.container` is the chart's element, `undefined` in `toScene()`.
- **`mount`** (`pipeline/types.ts`) runs after every render with `scene`, `changes` (`add`, `update` with `previous`, `remove`, in document order), `cause` (`create`, `hydrate`, `update`, `resize`, `responsive`, `fonts`), `elementOf(node)` and, when the live renderer animated, `animation` (`{ duration, easing }`). With `domRenderer()` every node is `add` on every render; a `hydrate` mount has `add` for every node with the adopted elements. A listener may return a cleanup that runs before the next render changes the output.
- **Roles and their `ctx`** (`scene/roles.ts`): `point` has `x`, `y`, `seriesIndex`, `valueIndex`, `value` (normalized `{ x, y }` or a hole), `meta`, `series` (as given, so `series.name` when it's an object); `bar` has `x1..y2` (base to value end); `slice` has `center`, `radius`, `startAngle`, `endAngle`, `value`; `line` and `area` have `seriesIndex` and no `valueIndex`. Labels aren't in a node's `ctx`; the `prepare` event carries `data.labels` and `data.flat`.
- **Strict CSP** (`docs/decisions.md`, "Security"): charts set styles through the CSSOM (`render/style.ts`, `element.style.cssText`), which `style-src 'self'` allows; no `innerHTML` in the DOM path.
- **The live renderer keeps elements** and keeps what listeners add (live-updates spec, "What listeners add stays"); the `events-and-plugins/live-tooltip` docs example already shows a tooltip that attaches listeners on `add` changes only and moves with `animation` through the Web Animations API.
- **The 1.x classes pass v2 plugin objects through** (`charts/PresetChart.ts`, `v2Plugins`): only plain functions need compat. `tooltips()` is a new 2.x feature, so it's for the functional API only (`docs/decisions.md`, "1.x compatibility"): it may happen to work in `new LineChart(…, { plugins: [tooltips()] })` through that pass-through, but it isn't offered, documented or tested there.
- **`@chartist-js/terminal`** is the template: `package.json` `exports` and `nx` targets, tsdown with ESM, CJS and declarations, vitest, a README test, `test/entry.spec.ts` checking what the build imports, and Playwright smoke tests (`pack.test.mjs`, `csp.test.mjs`). It has no browser build and no size budget; `chartist` has both (`.size-limit.json`, `test:size`).
- **The 1.x plugins.** `chartist-plugin-tooltips` 0.0.17 (about 21,600 downloads a month; repository gone) and `@stklcode/chartist-plugin-tooltips` (about 800, maintained, written for 1.x): options `tooltipOffset`, `anchorToPoint` (default `false`, follows the mouse), `appendToBody`, `class`, `pointClass`, `currency`, `currencyFormatCallback`, `tooltipFnc(meta, value)` returning HTML, `transformTooltipTextFnc(value)`, `metaIsHTML`. Content: `meta` (or, on pies, the series name or the label) and `ct:value`, written with `innerHTML`. Mouse only.
- **The docs today:** the plugins page lists both tooltip plugins with live examples (`src/data/plugins.ts`, `src/examples/plugins/tooltips`, `stklcode-tooltips`); the 0.x site's tooltip anchors redirect to `/plugins/chartist-plugin-tooltips/` (`src/lib/v0-redirects.ts`); `/plugins/#<slug>` anchors redirect only for listed slugs (`src/pages/plugins.astro`); removed pages go into `MOVED_PAGES` (`integrations/redirects.mjs`). "Why Chartist" has a section "No built-in tooltips".

## Goals / Non-Goals

**Goals:**

- One call, `tooltips()`, gives every point, bar and slice an accessible tooltip that works with mouse, touch and keyboard, in every renderer and after hydration.
- Nothing in it needs `'unsafe-inline'` or HTML strings.
- Small: one browser module of about 2 kB gzipped with no runtime imports.
- Looks come from CSS custom properties, as the rest of Chartist.

**Non-Goals:**

- Shared (all series at one X) tooltips and nearest-value hit testing; HTML content (see proposal, "Out of scope").
- Changing anything in `chartist`. Everything the plugin needs is in the public plugin API today.

## Decisions

### One delegated set of listeners per chart, and a map from elements to items

`install` adds `pointerover`, `pointerout`, `pointermove`, `pointerdown`, `focusin`, `focusout` and `keydown` listeners once, on the container. A `mount` listener walks `changes` and keeps a `WeakMap<Element, Item>` from each listed role's element to its item (role, indexes, `ctx`, element): `add` and `update` set the entry, `remove` deletes it. Events find their item by looking up `event.target` (or its closest mapped ancestor).

- Listeners are never added to chart elements, so kept elements can't collect duplicates, replaced svgs need nothing, and `destroy()` has one place to clean up (the cleanup `install` returns).
- `update` changes refresh the item, so a kept point that got a new value shows it; the text is built when the tooltip shows, not on every render.
- _Alternative, listeners per element on `add` changes (the docs example):_ fine for a teaching example, but it needs care for every kept element and doesn't remove listeners from elements the live renderer keeps after `destroy()`.

Labels come from a `prepare` listener that records `data.labels` (and `flat`) for the current render; it returns nothing, so the pipeline is unchanged.

### The active value is an identity, not an element

The plugin remembers the shown value as `role / seriesIndex / valueIndex` and the reason it shows (hover, tap, focus). After each `mount`, it looks the identity up among the mapped items: found, it re-renders text and position (the element may be new, as with `domRenderer()`); not found, it hides. If the focused element was replaced, it moves focus to the new element of the same identity with `focus({ preventScroll: true })`. This is what keeps tooltips and focus through updates, resizes and the hydration takeover's `resize` correction.

### The tooltip lives in the container and shows in the top layer

The tooltip is a `div` appended to `chart.container`, with `popover="manual"`, shown with `showPopover()` and hidden with `hidePopover()`. In the top layer, an ancestor's `overflow: hidden` or `z-index` can't clip or cover it, which is what `appendToBody` was for in 1.x. Staying in the container keeps it in the DOM next to its chart, so it inherits the page's `color-scheme`, fonts and the custom properties set on the container.

- Where `showPopover` is missing (old browsers, jsdom), the tooltip is toggled with the `hidden` attribute and positioned `fixed`; only the top layer is lost.
- The stylesheet resets the user agent's popover styles (`inset`, `margin`, `border`, `padding`, `overflow`), and hides `.ct-tooltip:not(:popover-open)` in the fallback through `[hidden]`.
- _Alternative, absolute in the container (1.x default):_ needs `position: relative` on the user's element and is clipped by `overflow`. _Alternative, appended to `body`:_ loses the container's custom properties and `color-scheme`. _Alternative, CSS anchor positioning:_ not in every evergreen browser yet, and it can't anchor to an SVG `line` of 0.01 px in a useful place; it can replace the JavaScript placement later.

### Position through custom properties set with the CSSOM

The plugin computes the anchor in SVG coordinates from the item's `ctx` (point: `x`, `y`; bar: `x2`, `y2`; slice: the point at `radius` on the bisector of `startAngle` and `endAngle` around `center`) and converts it to viewport coordinates with the svg's `getScreenCTM()`, so a `viewBox` (hydration markup, a scaled chart) is respected. It measures the tooltip once it has its text, picks `top`, or `bottom` when the top doesn't fit, clamps X into the viewport minus a margin, and sets `--ct-tooltip-x` and `--ct-tooltip-y` with `element.style.setProperty()`, plus `data-placement="top|bottom"` and `--ct-tooltip-anchor-x` (the anchor's distance from the tooltip's left edge, right even when the tooltip was moved sideways) for CSS arrows; the styling example draws one. The stylesheet places it with `translate: var(--ct-tooltip-x) var(--ct-tooltip-y)`.

- `style.setProperty` is CSSOM, allowed under `style-src 'self'`; no `style` attribute is written as markup and no `<style>` is injected.
- The distance from the anchor is `--ct-tooltip-offset`, read once per show with `getComputedStyle` so it stays a CSS setting (1.x `tooltipOffset`).
- With `position: 'pointer'`, mouse and pen moves update the position from `clientX`/`clientY`, at most once per animation frame.
- While a tooltip shows, a passive `scroll` (capture) and `resize` listener on the window re-places it; both are added on show and removed on hide and `destroy()`.
- Placement is a pure function (anchor, tooltip size, viewport, offset → x, y, placement) with its own unit tests.

### Moving with update animations

When `mount` has `animation` and the tooltip shows on a kept value, it moves with `element.animate({ translate: [from, to] }, animation)`, as the docs example does. Without `animation` (no live renderer, a resize, reduced motion), it jumps. The core already leaves `animation` out under `prefers-reduced-motion`.

### Show and hide timing in CSS

Hover shows at once. Leaving sets the state to hidden, and CSS keeps it visible for `--ct-tooltip-hide-delay` (a `transition` on `opacity` and `visibility` with that delay), and `.ct-tooltip:hover` keeps it visible, so the tooltip can be hovered (WCAG 1.4.13) without a JavaScript timer. Leaving a value and entering another within the delay simply moves the tooltip. The stylesheet turns the transition off under `prefers-reduced-motion`.

- _Alternative, a `hideDelay` option:_ a timing value is the kind of thing Chartist keeps in CSS (`--ct-update-duration`).

The popover stays open during the delay; the hidden state is a class (`ct-tooltip-hidden`) that the CSS animates, and `hidePopover()` runs on `transitionend` (or at once when no transition runs). This keeps the hover target alive during the delay.

### Touch

`pointerdown` with `pointerType === 'touch'` on a value shows its tooltip anchored to the element, regardless of `position`; `pointerover`/`pointerout` from touch are ignored, since browsers send them around every tap. A `pointerdown` on the document outside the chart's values (listener added while a tap tooltip shows, removed when it hides) hides it. The plugin calls no `preventDefault()` and sets no `touch-action`, so scrolling and zoom stay the browser's.

### Keyboard: a roving tab stop

With `keyboard: true`, the plugin makes one value focusable at a time (`tabindex="0"`) and every other listed value `tabindex="-1"`, the WAI-ARIA roving tabindex pattern for composite widgets. A chart of 365 points is one tab stop, not 365.

- The order is computed per render from the map: values grouped by series index, sorted by value index. Left and right step within the series, or across series when every series has one value (pies, distributed bars); up and down go to the same value index in the next or previous series that has it (the nearest index when it doesn't); `Home`/`End` go to the series' ends. Keys the plugin handles get `preventDefault()` so the page doesn't scroll; others pass.
- After each render, the stop moves to the remembered identity, or the first value.
- `focusin` shows the tooltip anchored to the element; `focusout` to outside the chart hides it; `Escape` hides it and keeps focus (WCAG 1.4.13, "dismissible").
- `tabindex`, `role` and `aria-label` are set on `add` and `update` changes only; kept elements keep theirs, so a live chart doesn't rewrite hundreds of attributes per update. `keyboard: false` sets none of them.

### Accessible name on the value, tooltip hidden from assistive technology

The focusable value gets `role="img"` and an `aria-label` with the tooltip's text (its parts joined with ", "). The tooltip element has `aria-hidden="true"`, since it repeats the focused element's name. To keep `format` calls lazy, only the element holding the tab stop gets its `aria-label` in advance; an element gets its label just before the plugin moves focus to it.

- _Alternative, `role="tooltip"` and `aria-describedby`:_ the tooltip is the value's only text, not a supplementary description, and a value without a name would be announced as nothing, then described. With `aria-label`, screen readers announce the value as they land on it.
- _Alternative, `role="graphics-symbol"` (ARIA Graphics module):_ more precise, but less consistently mapped by screen readers than `img`; worth revisiting.
- The chart's own `svg` keeps whatever role and name the page gives it; the plugin doesn't touch it.
- Without `keyboard`, no element gets a role or a name, so the chart's accessibility is exactly what it was.

The focus indicator is CSS: `.ct-tooltip-target:focus-visible` (a class the plugin adds with the tab stop) gets a wider stroke in `--ct-tooltip-focus-color`, since `outline` isn't drawn on SVG shapes in every browser.

### Content: text parts, `format`, `numberFormat`

The default content is up to three `span`s (`ct-tooltip-title`, `ct-tooltip-series`, `ct-tooltip-value`) filled with `textContent`; see the spec for which parts show. The value is formatted with one `Intl.NumberFormat(undefined, numberFormat)`, created at install. `format(item)` returns a string, shown in one `span` with `white-space: pre-line` for line breaks; `null` or `''` means no tooltip, and `undefined` keeps the default text (the author's question about third-party roles, 2026-10-19: a `format` can handle some roles and leave the rest).

- The item passed to `format`: `{ role, seriesIndex, valueIndex, value, meta, series, seriesName, label, element }`, all `readonly`. `value` is what the node's `ctx` has: a number, `{ x, y }` or, for `line` and `area`, absent.
- `--ct-tooltip-series-color` is copied from the value element's computed `--ct-color` when it shows, so the CSS can draw a swatch; it costs one `getComputedStyle` per show.
- _Alternative, `format` returning parts or DOM nodes:_ returning a `Node` would let a page build markup, but also invites `innerHTML` in user code and complicates the accessible name. Text keeps the contract simple; richer content is out of scope.

### Your own content: `render`

`render(content, item, data)` lets a page fill the tooltip itself: DOM nodes with `append`, or a framework's template (Angular's dynamic components, a React root, a Vue app mounted into `content`). Asked for by the author on 2026-10-19, so that HTML and framework rendering stay possible without the plugin parsing HTML.

- **The plugin owns the box, the page owns the content.** The tooltip box keeps its popover state, classes, `aria-hidden` and position custom properties; `render` gets an inner `div.ct-tooltip-content`, emptied before each call. So a framework can't break the placement, and the stylesheet's box styles apply around any content.
- **Arguments:** `content` (that element), `item` (the `TooltipItem` `format` gets: role, indexes, value, `meta`, series, series name, label, element), and `data` (`{ labels, series, flat }` from the `prepare` phase, read-only), so a template can show neighbouring values or totals.
- **Cleanup:** `render` may return a function. The plugin calls it before the next `render` call, when the tooltip hides (after the hide transition), and on `destroy()`. That's where a framework unmounts its component; the plugin removes nothing a framework still owns.
- **Content that renders later:** frameworks may fill `content` after `render` returns. A `ResizeObserver` on the content element re-runs the placement when its size changes, while the tooltip shows; it's disconnected on hide and `destroy()`.
- **Which values show, and the accessible name:** `format` keeps deciding whether a value has a tooltip, and its text is the focused value's accessible name. Without `format`, every value in `roles` shows, and the name is `content.textContent` after `render` ran (and again after a size change). A rich tooltip is announced as its text.
- **Security:** the default stays text only, and the plugin never parses HTML. With `render`, the content is the page's code: `append` and framework templates need nothing extra; an HTML string set with `innerHTML` needs the page's own Trusted Types policy under `require-trusted-types-for 'script'`. The guide says so.
- _Alternative, `render` returning a `Node` or an HTML string:_ simpler for plain DOM, but no cleanup hook for frameworks, and a string return would bring HTML parsing into the plugin.

### Options

```ts
interface TooltipsOptions {
  readonly roles?: readonly (keyof NodeRoles)[]; // ['point', 'bar', 'slice']
  readonly format?: (item: TooltipItem) => string | null | undefined;
  readonly render?: (
    content: HTMLElement,
    item: TooltipItem,
    data: TooltipData
  ) => void | (() => void);
  readonly numberFormat?: Intl.NumberFormatOptions;
  readonly position?: 'element' | 'pointer'; // 'element'
  readonly keyboard?: boolean; // true
  readonly className?: string;
}
```

`tooltips(options)` returns `ChartPlugin` (the options are closed over, so `[plugin, options]` entries aren't needed). The plugin's `name` is `tooltips`.

**1.x options and what replaces them** (a reference; there's no migration page):

| 1.x option                              | `tooltips()`                                                         |
| --------------------------------------- | -------------------------------------------------------------------- |
| `anchorToPoint: true`                   | the default, `position: 'element'`; `false` is `position: 'pointer'` |
| `tooltipOffset`                         | `--ct-tooltip-offset` in CSS                                         |
| `class`                                 | `className`                                                          |
| `pointClass`                            | `roles`                                                              |
| `appendToBody`                          | not needed: the tooltip shows in the top layer                       |
| `currency`, `currencyFormatCallback`    | `numberFormat: { style: 'currency', currency }`, or `format`         |
| `tooltipFnc`, `transformTooltipTextFnc` | `format`, returning text, or `render` for markup                     |
| `metaIsHTML`                            | `render`: build the markup yourself; the default is text only        |

Defaults differ from 1.x on purpose: anchored instead of following the mouse (keyboard and touch have no pointer, the tooltip stays hoverable, and live updates move it with its value).

### Package shape

- `packages/tooltips/src/`: `index.ts` (exports), `plugin.ts` (install, mount bookkeeping), `content.ts` (default text, format), `place.ts` (pure placement), `keyboard.ts` (order and keys), `styles.css`. Specs next to them.
- Builds with tsdown: `dist/index.js` (ESM), `dist/index.cjs`, `.d.ts`/`.d.cts`, and `dist/index.min.js`, minified, `platform: 'browser'`. The sources import only types from `chartist` (`import type`), so no build has a runtime import; `test/entry.spec.ts` asserts it.
- `styles.css` is copied to `dist/styles.css` (plain CSS, no Sass needed).
- `package.json`: `"dependencies": { "chartist": "workspace:^" }` as the decisions require (the types reference it), `sideEffects: ["*.css"]`, `engines` like terminal's, `nx` targets `build`, `typecheck`, `test` (dependsOn `build`), `test:size` and `test:smoke`.
- `.size-limit.json`: `dist/index.min.js` gzipped, budget set from the first measurement plus a little headroom, and a `import { tooltips }` entry.
- `nx.json` release `projects` gets `tooltips`.

### Tests

- **Unit (vitest, jsdom, like `chartist`'s setup):** charts drawn with `lineChart`, `barChart`, `pieChart` from `chartist`'s published entry, with `domRenderer()` and `liveDomRenderer()`; synthetic pointer, focus and key events. Covers the spec's content, roles, `format`, text-only (an XSS spec like `terminal/src/xss.spec.ts`), keyboard order, identity across renders, `toScene()` no-op, cleanup and two charts. Placement as a pure function. jsdom has no layout or `getScreenCTM`, so the DOM tests stub them or check the custom properties are set, and leave real placement to the smoke test.
- **README test**, as terminal's: the README's `ts` blocks type-check against the build.
- **Smoke (Playwright Chromium, `node --test`):** `pack.test.mjs` packs `chartist` and the package, installs both, and imports both entries in ESM and CJS. `browser.test.mjs` checks only what jsdom can't, on one page with the strict policy from the security spec (including `require-trusted-types-for 'script'`) loading both `index.min.js` builds: hover shows the tooltip in full above an `overflow: hidden` box (the top layer), `Tab` focuses a value with its accessible name, `Escape` hides it, and no `securitypolicyviolation` or page error. Edge placement and touch stay in the unit tests (the author asked to keep the browser test lean, 2026-10-19).
- **Docs:** no new e2e spec. The overview's live example runs in the existing example loop, the repointed 0.x anchors are checked by `v0-redirects.test.ts` and by `docs:v0-redirects`, which checks every target against the build. The one interactive thing on the docs pages is the package's own feature, tested in the package.

### Docs

- `apps/docs/src/content/packages/tooltips/`: `index.mdx` (what it does, live example, install, CDN snippet with both stylesheets, quick start, keyboard and touch in two sentences, link to the guides), `content-and-styling.mdx` (default text, `format`, `numberFormat`, `roles`, `position`, the custom properties, a series swatch, dark pages), no migration guide of its own (the author decided on 2026-10-19 that the 1.x plugins' path, `fromLegacyPlugin` in the core's "Coming from 1.x", is enough; the overview says so in a sentence). The API page from TypeDoc.
- Examples in `apps/docs/src/examples/tooltips/` (`basic`, `format`, `styled`, `live`), where the terminal package's docs examples live. `packages/examples` holds chart examples that the visual tests screenshot; a tooltip shows only on interaction, so it has no example there. That's also why the convention of `@chartist-js/essentials` (every example in `packages/examples/essentials/` and the gallery's "Essentials" section) doesn't apply to this package.
- Registry and preview: `src/data/packages.ts`, `src/lib/package-previews.ts`: a chart rendered at build time with one tooltip shown over a point. The preview is static HTML, so no script calls `showPopover()`; it holds the tooltip's real markup (`.ct-tooltip` with its parts, placed with the same custom properties) next to the chart's SVG, styled by the package's real stylesheet, so it shows the actual look.
- Playground: `@chartist-js/tooltips` and its stylesheet in the playground library (`integrations/playground-lib.mjs`), the import map, the types service and StackBlitz dependencies, as for the terminal package.
- Guides: "Why Chartist" ("No built-in tooltips" becomes: the core has none, `@chartist-js/tooltips` adds them, and why it's a package); "Events and plugins" (the live tooltip example stays as a teaching example, with a line pointing to the package for real use); "Coming from 1.x" (plugins: the tooltip plugins → the package; the `@stklcode` plugin stays the example of an ES module plugin, the only listed one, but its link goes to `/packages/tooltips/`); "Live updates" ("charts with tooltips" links the package).
- Plugins page: both tooltip plugins leave the site without a redirect, as the author decided on 2026-10-19 for plugins an official package replaces. Their entries, examples, `plugin-files.json` entries and pinned dev dependencies go; no `MOVED_PAGES` entry. `plugins.astro` keeps redirecting old `#<slug>` anchors of listed plugins only, so an anchor of a removed plugin stays on the overview; the page's description and lead stop naming tooltips.
- Links to the removed pages, repointed: the 0.x redirect table's anchors `tooltip-plugin` and `example-plugin-tooltip` (`src/lib/v0-redirects.ts:225`, and its test at `v0-redirects.test.ts:97`) to `packages/tooltips/`; "Coming from 1.x" (`coming-from-1x.mdx:335`) to `packages/tooltips/`. The old site gets the regenerated redirect pages in a push to its `gh-pages` branch at release time, with the author's go; until then its tooltip anchors lead to the removed page.
- Tests that use the two plugins: `e2e/plugins.spec.ts` (the plugin page test's `@stklcode` page and "Repository gone" check, the old anchor test, the filter test that types "tooltip") move to listed plugins; `e2e/plugin-contract.spec.ts` drops their cases; `src/lib/plugins.test.ts` (`pluginBySlug` of the `@stklcode` slug) takes another plugin; `src/lib/release.test.ts` keeps its sample strings, which are inputs to the version rewrite and link nowhere.

## Risks / Trade-offs

- [A tab stop changes the page's tab order for every chart with tooltips] → It's what keyboard access needs, it's one stop per chart, and `keyboard: false` turns it off. The overview says so.
- [`role="img"` with `aria-label` on SVG shapes is announced differently across screen readers] → Test with VoiceOver and NVDA during implementation (manual check in tasks); the fallback is the tooltip text in a visually hidden live region, which would be a design change recorded here.
- [Top layer support] → Popover is Baseline since 2024; without it the fixed-position fallback works and only loses the top layer.
- [jsdom lacks layout, `getScreenCTM`, and maybe `showPopover` and `PointerEvent`] → Placement is a pure function tested on its own; DOM tests stub what's missing; the browser smoke test covers the real thing.
- [Hydration: the server markup has no `tabindex`, so the tab stop appears at the takeover] → Expected; before the takeover nothing is interactive anyway. `renderForHydration()` must not get the plugin's attributes, which the "No tooltips without a page" scenario checks.
- [Removing the maintained `@stklcode` plugin from the list hides a maintained 1.x option from 1.x class users] → `tooltips()` is for the functional API only, so 1.x class users keep the 1.x plugins: they still install and work through compat, and the migration guide says so. See Open Questions.
- [The essentials changes remove the axis title, legend and value label plugins the same way] → `add-essentials-package` states the same no-redirect rule in its own `essentials-package` capability; the requirement here is the general one for the docs site. Whichever change touches `e2e/plugins.spec.ts` and the plugins page's lead second rebases on the first.
- [Size] → No runtime imports and one module; budget checked in the gate. If keyboard support pushes it past ~2.5 kB gzipped, record the measured size and the reason when setting the budget.

## Migration Plan

New package, nothing to migrate in `chartist`. Before the 2.2.0 release, the author adds a trusted publisher for `@chartist-js/tooltips` on npmjs.com (repository `chartist-js/chartist`, workflow `release.yml`, environment `release`); without it the first publish fails. The removed plugin pages get no redirect; the 0.x site's tooltip anchors point to `/packages/tooltips/` once its regenerated redirect pages are pushed at release time, with the author's go.

## Open Questions

Answered by the author on 2026-10-19:

1. **Both tooltip plugins leave the plugins page,** including the maintained `@stklcode/chartist-plugin-tooltips`, with their pages and without a redirect.
2. **Keyboard on by default:** yes.
3. **Default text and look:** as designed (title from `meta` or the label, then the series name, then the value; dark on light pages, light on dark, a series swatch).
4. **`role="img"`** on focused values, checked by hand with screen readers during implementation.
5. **The package preview** shows the tooltip's real markup and stylesheet over a build-time chart (see "Docs").
6. **"Why Chartist":** "No built-in tooltips" is reworded: the core has none, `@chartist-js/tooltips` adds them, and why that's a package.
7. **`render` for your own content** is added (see "Your own content").
8. **No follow-up issues for now** (shared tooltips, nearest-value lookup).

Still open, additive later: custom events (`tooltips:show`, `tooltips:hide`).
