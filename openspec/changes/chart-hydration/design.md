# Design

## Context

### The code today

- **`toScene(config, size)`** (`chart/toScene.ts`) runs the pipeline without a DOM and returns the scene. The root gets the layout size as its `width` and `height`, because no `rootSize` is passed. Labels default to SVG text.
- **`chart()`** (`chart/chart.ts`) renders through `render(from, cause)`: `runPipeline()` with the container's size and `rootSize: { width: config.width ?? '100%', height: … }`, then `renderer.render(scene, container, update)`, then the `render` and `mount` events.
- **The presets add an inline size style to the root** through an internal `preset-root-style` plugin. `presetConfig()` (behind `lineChartConfig()` and the others) leaves it out, because that markup isn't meant for a container. The chart-rendering spec says the same: same scene "apart from the root's size (`width`, `height` and the inline size style), which the host sets".
- **The renderers:**
  - `domRenderer()` (`render/dom.ts`) builds a new svg on every render. `removePrevious()` removes earlier svgs that have `xmlns:ct` in the xmlns namespace.
  - `liveDomRenderer()` (`live/renderer.ts`) patches its previous svg, found as `update.previous.elementOf(update.previousScene)`. When that svg isn't in the container, it silently renders fresh through the DOM renderer.
- **`renderToString()`** (`render/string.ts`) writes elements without content as `<name …/>`, HTML elements inside a `foreignObject` included.
- **Styles** go through the CSSOM (`setStyle`), so `chart()` works under `style-src 'self'` (security spec). Scenes still carry `style` attributes, for 1.x parity:
  - the label `foreignObject`'s `overflow: visible`;
  - the label `span`'s px size;
  - the presets' root size;
  - a donut's `stroke-width` with `donutWidth`.

  `renderToString()` writes them as attributes.

- **Size today** (size-limit, gzipped, this branch):
  - `lineChart` 14.28 kB (budget 14.3);
  - `chart` 5.57 kB (5.6);
  - everything 28.37 kB (28.45);
  - `liveDomRenderer` 2.66 kB (2.7);
  - `dist/live.min.js` 4.83 kB (4.9).

### What the HTML parser does to server markup

Checked in jsdom and Chromium:

- **`xmlns:ct` and `ct:value`** stay plain attributes with a colon in their name, not attributes in a namespace.
- **The parser ignores `/>` on HTML elements.** An empty label `<span …/>` stays open and takes in everything after it, including page content outside the chart's container.
- **Under a strict style policy,** parsed `style` attributes stay in the DOM but aren't applied, and `element.style` is empty.

### Evidence from the proof of concept

The PoC was a throw-away branch, so its results are recorded here. It tested Next.js 16 (React 19, App Router), Nuxt 4 (Vue 3.5), Angular 22 (zoneless and Zone.js) and SvelteKit 3 (Svelte 5) in three rounds. It ran in dev and production, at 375 and 1280 px, with and without a 4× slower CPU and a slow network. It measured frames, DOM mutations, LCP, CLS and CSS animations, and took screencasts.

- **Feasibility.** Every framework can deliver server markup that it never touches again, and `chart()` can adopt it afterwards. React, Vue, Angular and Svelte reported no hydration errors with the right recipe.
- **Adopting against drawing fresh.** Drawing a fresh chart over the markup in the same task as the framework's hydration never painted a blank or doubled frame. Adoption still wins:
  - CSS animations that started at page load restart with a fresh chart, visibly on slow devices and with lazy hydration;
  - a lazily imported Chartist leaves up to 26 blank frames (about 440 ms) when the framework cleared the markup first;
  - LCP moved from 0.74 s to 2.04 s (Nuxt) and from 0.48 s to 2.88 s (Angular) on throttled phones, because fresh, larger label spans counted as a new LCP entry.

  With adoption, LCP stayed at first paint.

- **Cost.** At equal size, hydration with the decided behavior was one render, with only these mutations: the marker, the scaling `viewBox` and two per `ct:` attribute.
  - `chart()` took 5 to 7 ms adopting, against 4 to 6 ms fresh; 23 to 36 ms against 17 to 28 ms throttled.
  - Without the root size fix, every hydration rendered twice and ran `mount` twice.
- **The framework traps.** Every framework's raw-HTML feature writes the markup again in some situation, with no error:
  - React: a changed `__html` string;
  - Vue: any string in the browser, during hydration;
  - Angular: any `[innerHTML]` binding;
  - Svelte: a reactive `{@html}`.

  `{@html ''}` in the browser is worse: Svelte throws `hydration_mismatch` and re-mounts the whole app. In every case, live updates then go into a detached svg.

- **CLS.** CLS was 0 at equal size. At other sizes it was 0.002 to 0.03, from adopted HTML label spans moving; new spans don't count as shifts. That's an artifact of the metric, since the visible relayout is the same either way.
- **Size.** The PoC's first version added 1.1 kB gzipped to a `lineChart()` app. Moving adoption into `chartist/live` and replacing the string comparison brought that to 0.55 kB. What remained in the core was `hydrate()`: the replay, the event, a scene comparison and the warning text, about 1.3 kB minified.

## Goals / Non-Goals

**Goals:**

- Charts that never see server markup pay at most 0.3 kB gzipped (library-distribution spec).
- No framework-specific code in Chartist: the contract is server markup in a container, and `chart()` with an adopting renderer.
- A taken-over chart is indistinguishable from one drawn in the page, apart from keeping its elements.
- Wrong integrations show up: a structural mismatch or replaced markup warns, and differences in values are reported on the event.

**Non-Goals:**

- Reading the server's data from the markup. The browser rebuilds the scene from its own config; the framework already ships the data to the browser.
- Hydration without `liveDomRenderer()`. The default renderer replaces its svg on every render, so adopting would only last until the first update.
- Making the server markup itself pass a strict style policy (proposal, Out of scope).

## Decisions

### Adoption is a renderer capability; the core only finds the markup and replays

`Renderer.adopt(scene, svg)` is optional. `liveDomRenderer()` implements it in `chartist/live`; `domRenderer()` doesn't. `chart()` does the parts only it can do:

- find a direct child svg with `data-ct-hydrate`;
- parse the marker;
- replay the server's scene with its own emitter, so plugins and listeners run as on any render;
- call `adopt`;
- emit `hydrate`;
- run the correction render.

- _Alternative, adoption in the core (`domRenderer().adopt`):_ the PoC's first version. It costs every chart about 1.5 kB minified for the walk, and adoption is useless without patching anyway.
- _Alternative, the whole hydration behind a renderer hook (`adopt(container, replay)`, with the renderer finding and parsing the marker):_ smaller core, but marker parsing is about 100 bytes. The core would hand out a replay closure whose environment the renderer can't check. Only if the first measurement is over budget do the marker lookup and parsing move behind the renderer.

### The correction render skips itself through the live renderer's diff

After adoption, `chart()` renders at the container's real size with the cause `resize`, through the normal path, so the live renderer patches. If the renderer reports `patched` with no changes, the chart keeps the new state and output but emits no `render` or `mount`, and runs no cleanups. So at equal size there's exactly one `mount`.

- _Alternative, compare the scenes in the core_ (the PoC): a structural comparison, about 0.3 kB minified. The live renderer already diffs.
- _Alternative, `renderToString()` both scenes_ (the PoC's first version): it pulls the string renderer into every `chart()` bundle.
- The skip applies to the correction render only. Skipping every render without changes, for `update()` with the same data for example, would change what `mount` listeners of live charts see today. That's a separate decision.

### The server markup has the root `chart()` draws

With `hydrate`, `toScene()` passes the same `rootSize` that `chart()` uses (`config.width ?? '100%'`). For a preset config, it also adds the inline size style the preset adds in the browser. `presetConfig()` marks its config for that with a symbol property, which `toScene()` reads; it isn't part of the public `ChartConfig` type.

Without this, the server root was `width="600"` against the browser's `100%`, so the comparison could never find the same scene, and every hydration rendered twice. The preset style appeared only at hydration and overrode page CSS that had sized the svg before (round 3).

- _Alternative, adoption ignores the root's size:_ the double render goes away, but the no-JS chart then has a px size, which overflows on phones.

### The scaling viewBox

Unless the config sets a `viewBox`, the hydration markup gets `viewBox="0 0 <layout size>"`, and the marker records `scale: true`. So the no-JS chart scales into a container of any width. The PoC compared the strategies:

- px markup overflowed or was cropped on phones;
- a `viewBox` on both sides kept tiny text on phones for good;
- a width hint needs per-client HTML.

The browser replays the scene with the same `viewBox`, so adoption matches. The `viewBox` is removed with the correction render, after the `hydrate` mount. A plugin measuring in that mount then sees the server's layout consistently scaled.

### Adoption's rules

The walk compares element names, namespaces and child element counts; text and comment nodes don't count. A difference stops it, and `adopt` returns nothing. Otherwise it repairs:

- **Attributes:** reads them by namespace and local name, so it finds the plain `ct:value` the parser left, moves it into the Chartist namespace, and sets values that differ.
- **Extra attributes:** removes the ones the scene doesn't have, except `class`, the `xmlns` declarations and `data-ct-hydrate`.
- **Styles:** compares `element.style.cssText` with the scene's style, ignoring whitespace, and sets it through the CSSOM where they differ. A blocked style reads as empty, so it's applied.
- **Classes and texts:** sets them where they differ.

`repaired` counts the repairs, with two exceptions: the root's size and inline size style, and a style whose attribute text already equals the scene's (a policy blocked it). With the same data and options, it's 0 under any policy (round 3 counted 34 under a strict policy before this rule).

### The marker

The marker is JSON in `data-ct-hydrate`, with fields for the version (`v: 1`), width, height, labels, text (`estimate` or `custom`) and scale. A marker that doesn't parse, or has an unknown version, means no adoption: the chart draws fresh and warns. That covers a server and a browser on different Chartist versions with a different marker.

The browser always replays with the built-in text estimate. With `text: 'custom'`, adoption repairs the differences, or falls back if the structure differs. The guide says to use the estimate for hydration markup.

- _Alternative, the server's scene as JSON in the page:_ it doubles the bytes, and functions in the config can't be serialized anyway.

### The warning when markup was replaced

At the start of every render, the chart checks whether its previous svg is still in its container. If not, it warns and lets the renderer draw a new one, which the live renderer already does. The check is three lines on a path that exists. It runs at the next render, so with Angular's `[innerHTML]` binding, which writes after the component's effects, the first replacement goes unnoticed (round 3).

- _Alternative, a `MutationObserver` on the container while the chart lives:_ immediate, but bytes and an observer per chart, for an integration bug the guide prevents.

### The serializer and the cleanup fixes

- **`renderToString()`:** HTML elements inside a `foreignObject` get an end tag, also when they're empty. SVG elements without content stay self-closing.
- **`removePrevious()`:** also matches `getAttribute('xmlns:ct')`.

Both are independent of hydration, so they ship as `fix:` commits.

### Docs

- **The server rendering guide** gets a section on taking charts over. Its live example `server-rendering/hydrate` keeps the server markup in its `index.html`, between marker comments. A script writes the markup from `toScene()` and `renderToString()` of the example's own config; a check that's part of the docs `check` target fails when the committed HTML differs from the current build's markup.
- **A new guide, "Charts in frameworks"** (`/docs/frameworks/`, Advanced), gives the rule and the four recipes from the PoC's final round:
  - React: a frozen `__html` via `useState(() => markup)`, `useLayoutEffect`, plain `destroy()`;
  - Vue: `import.meta.server ? markup : undefined` with `v-html`;
  - Angular: an empty template, `host.innerHTML` on the server in an `effect`, `afterNextRender`;
  - Svelte: a constant placeholder with `svelte-ignore hydration_html_changed` and the comment about `{@html ''}`.

  Each recipe also names its framework's specific trap. The guide's live example is the framework-free lifecycle: create, update through the handle, destroy.

- **Recipe fences** are `tsx`, `vue`, `svelte`, and `ts nocheck` for Angular. `docs:samples` checks only `ts` fences against Chartist's types, and framework types aren't dependencies of the docs.

### Testing

- **Unit tests** (jsdom; markup parsed with `innerHTML`, the HTML parser path):
  - the marker and the root;
  - one `mount` at equal size;
  - `hydrate` then `resize` at another size;
  - equal to a fresh chart;
  - strict repairs and `repaired`;
  - blocked styles, simulated by an empty `cssText`;
  - the fallbacks;
  - the warning;
  - closing HTML elements;
  - replacing parsed svgs.
- **The CSP smoke test** gets cases whose served HTML contains hydration markup: a line chart with HTML labels and a donut with `donutWidth`, under `strict` and `trustedTypes`.
- **The browser smoke test** gets one case for element identity and a CSS animation that continues.
- **The API recordings** cover `adopt`, the `hydrate` cause, the `hydration` field and the `adopt` option; the size-limit entries get new budgets.
- **Framework apps:** none in the repository. Four frameworks as dev dependencies, kept up to date, would cost more than they protect. The contract they rely on is tested above, and the guide's recipes state the rules the PoC proved.

## Risks / Trade-offs

- **[The server's config differs from the browser's]:**
  - different values → repaired and reported in `hydration.repaired`;
  - a different structure → a warning and a fresh chart.

  → The guide shows how to log `hydration.repaired` in development.

- **[A container without a height]** → the no-JS chart looks right, but `chart()` measures 150 px and the chart collapses at hydration. This also happens without hydration; the scaling `viewBox` only hides it until JavaScript runs. → The guide says to give the container a height or an `aspect-ratio` matching the server size, and `svg { display: block }`.
- **[Frameworks change their raw-HTML behavior]** (Svelte fixing `{@html ''}`, React changing `dangerouslySetInnerHTML`) → the recipes date. → The guide states the rule first, so a recipe that breaks is easy to recognize, and the replaced-markup warning shows when it happens.
- **[Hydration costs a second pipeline run]** (the replay, plus the correction at another size): 2 to 10 ms measured, and one long task on throttled phones. → The correction is skipped at equal size; servers can lay out at the most common container size.
- **[Custom renderers that wrap `liveDomRenderer()`]** lose adoption unless they pass `adopt` on. → The `Renderer` docs say so; spreading the live renderer keeps it.
- **[CLS from adopted HTML labels]** at other sizes (0.002 to 0.03) → it's below 0.1 and an artifact of the metric; SVG labels avoid it.

## Migration Plan

Additive, for a 2.x minor release. The changelog notes the 2.0 changes the proposal lists:

- `RenderCause` gains `'hydrate'`;
- `renderToString()` closes empty HTML elements;
- parsed Chartist svgs are replaced.

No migration is needed: without `hydrate: true` on the server, nothing changes. On archive, `docs/decisions.md` gets a hydration entry: the contract, adoption in the live renderer, recipes instead of wrapper packages, and how that relates to the planned web component.

## Open Questions

- The exact wording of the two warnings, which can be settled in review of the implementation.
