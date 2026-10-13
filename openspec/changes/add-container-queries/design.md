# Design

## Context

- Presets resolve responsive options in `presets/preset.ts`: `withResponsive()` merges the matching `matchMedia` entries over the base options, `change` listeners re-render and emit `responsive`. `chart()` has no responsive options; it observes its container with a `ResizeObserver` and re-runs the layout.
- `Element.matchContainer()` (csswg-drafts#6205) returns a query list with `matches`. The draft spec PR has no `change` event yet; the `match-container` polyfill fires one. The polyfill works through a generated `@container` rule and a style observer, so its `matches` may update slightly after a resize.

## Decisions

### D1: Per-entry conditions with a tagged object

`container(query)` returns `{ type: 'container', query }`, a frozen plain object. A responsive entry is `[string | ContainerCondition, overrides]`.

- **Why per entry:** it keeps the 1.x mechanics (entries merged in order). It also lets users copy their CSS conditions unchanged: `@media` conditions as plain strings, `@container` conditions wrapped in `container()`.
- **Rejected:** a mode switch per chart. It forces one kind per chart and needs a second option.

### D2: One shared responsive module

`responsive/` exports `container()` and an internal `watchResponsive(entries, host, onChange)`. Presets and `chart()` both use it. It returns:

- the matching indexes;
- a `stop()` function.

It creates one `MediaQueryList` per media entry and one container query list per container entry. `onChange` fires only when the matching set changes. The module is tree-shaken from bundles that never pass responsive entries.

### D3: A stable probe element

`matchContainer()` asks an element about its ancestor containers. The chart's svg is replaced on every render, so Chartist inserts one stable probe into the chart container:

- **What it is:** an empty `<span aria-hidden="true">` positioned absolutely with zero size and the class `ct-probe`.
- **Lifetime:** it is created on the first render with container entries and removed by `destroy()`.
- **Why one probe:** query lists are created once per chart, never per render, so the polyfill doesn't accumulate CSSOM rules.

### D4: Re-evaluation

Container entries are re-read:

- when the chart container is resized (the same `ResizeObserver` timing as the layout);
- on the query list's `change` event, where one exists (the polyfill).

A re-read compares the matching set with the previous one, so a resize that doesn't cross a breakpoint costs only the reads. The order on a crossing resize is: the responsive merge, then the render, once. If the size and the matches change together, the resize render and the responsive render collapse into one.

### D5: Missing API and errors

- **Missing API:** if `Element.prototype.matchContainer` is undefined, container entries don't match. `console.warn` fires once per page (a module flag):
  `Chartist: container() conditions need Element.matchContainer(); load the match-container polyfill (https://github.com/teetotum/match-container). Container entries are ignored.`
- **Rejected conditions:** if `matchContainer()` throws, Chartist throws `Chartist: invalid container condition "<query>": <message>`.
- **No DOM:** `toScene()` has no container. Container entries don't match there, without a warning, and media entries don't match either (no window), as today.

### D6: `chart()` overrides

- **Merge:** `responsive` entries hold partial configs. The effective config is `{ ...config, ...matching overrides in order }`, a shallow merge, so `layers` or `axes` in an override replace the whole value.
- **`update()`:** replaces `responsive` like any other key and re-creates the watcher.
- **Events:** `chart()` emits `responsive` with `{ previousConfig, currentConfig }`; presets keep their 1.x-shaped payload.

### D7: 1.x classes

`PresetChart` filters container entries out of the responsive options before passing them to the preset. 1.x classes stay media-only (no new features); a JS user passing `container()` to a class gets the 1.x behavior (the entry never matches).

## Testing

- **jsdom:** no `@container`. Unit and API tests install a fake `Element.prototype.matchContainer` whose results the test controls, with and without `change` events.
- **Browser:** `match-container` is a dev dependency of `@chartist/examples`, imported by the container examples.
  - A visual example `composed/container-queries` renders one chart config twice on one page: in a 300 px wide container and in a 700 px wide one. Both screenshots differ as the conditions say.
  - The examples manifest marks it `v2`.

## Risks / Trade-offs

- **The standard may diverge from the polyfill:** names, element semantics (whether the element itself counts as a container) and the change mechanism are still open. Chartist depends only on `matchContainer(query).matches` plus an optional `change` event, and the plan lists the issue under "Standards to monitor".
- **Polyfill timing:** with the polyfill, `matches` may lag the resize. The `change` listener catches the late update, at the cost of one extra render in that case.
- **`container-type` is required** and easy to forget; without it nothing matches. The docs show it in every container example. Chartist doesn't detect it, because a container may be any ancestor.
- **Size:** the shared module adds weight to `chart()` only if responsive code is reachable from it. If measured `chart()` growth exceeds ~0.3 kB, `chart()`'s support moves into an opt-in helper.
