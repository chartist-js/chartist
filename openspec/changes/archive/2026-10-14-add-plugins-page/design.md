# Design

## Context

What the research found (2026-10-14):

- **Popularity.** The plugins ranked by monthly npm downloads, without framework wrappers:

  | Plugin                                                                  | Downloads | License                                          |
  | ----------------------------------------------------------------------- | --------- | ------------------------------------------------ |
  | `chartist-plugin-axistitle`                                             | 45k       | MIT                                              |
  | `chartist-plugin-legend`                                                | 29k       | ISC                                              |
  | `chartist-plugin-tooltips` (the Globegitter fork of the tooltip plugin) | 23k       | MIT; its repository is gone, the package remains |
  | `chartist-plugin-pointlabels`                                           | 12k       | WTFPL                                            |
  | `chartist-hover`                                                        | 10k       | MIT                                              |
  | `chartist-plugin-tooltip` (the original)                                | 9.5k      | ISC; needs jQuery                                |
  | `chartist-plugin-zoom`                                                  | 9k        | WTFPL                                            |
  | `chartist-plugin-fill-donut`                                            | 5k        | MIT                                              |
  | `chartist-plugin-barlabels`                                             | 2.6k      | WTFPL                                            |
  | `chartist-plugin-accessibility`                                         | 2k        | WTFPL                                            |
  | `chartist-plugin-threshold`                                             | 1.4k      | WTFPL                                            |
  | `@stklcode/chartist-plugin-tooltips`                                    | 811       | MIT; maintained, written for 1.x                 |
  | `chartist-plugin-targetline`                                            | 748       | ISC                                              |

  Everything else is under 100 a month. Where the package declares no license, the repository says WTFPL.

- **Shape of the code.** All of them except @stklcode's are 0.x-era UMD scripts. Without a module system, they read the global `Chartist` and register on `Chartist.plugins`. They use helpers such as `extend`, `noop`, `alphaNumerate`, `normalizePadding` and `Svg`, which v2 still exports, plus `getDataArray`, which it doesn't. They detect the chart type with `chart instanceof Chartist.Line`, `Bar` or `Pie`, the 0.x names that 1.x renamed to `LineChart` and so on. So most of them were already broken on 1.x without a shim, which matches the 1.x site never listing them.
- **The probe.** A browser test ran each plugin on v2's UMD builds. A small shim provided `plugins` and the 0.x names, and each plugin ran in two modes: on the 1.x classes with `compat`, and through `fromLegacyPlugin` on the functional API.

  | Plugin                                         | 1.x classes | `fromLegacyPlugin` | Cause                                                                   |
  | ---------------------------------------------- | ----------- | ------------------ | ----------------------------------------------------------------------- |
  | axistitle, tooltips (fork), @stklcode tooltips | ✓           | ✓                  |                                                                         |
  | pointlabels, threshold, fill-donut             | ✓           | ✗                  | `instanceof`                                                            |
  | legend                                         | ✓           | ✗                  | `chart.data` missing at install                                         |
  | barlabels, hover                               | ?           | ✗                  | `instanceof`; hover also reads `chart.options.classNames`               |
  | zoom                                           | ✗           | ✗                  | `chart.svg.querySelectorAll`                                            |
  | accessibility                                  | ✗           | ✗                  | `chart.optionsProvider.getCurrentOptions()` and `Chartist.getDataArray` |
  | targetline                                     | ✗           | ✗                  | `created` payload's `bounds`, a 0.x field                               |
  | tooltip (original)                             | ✗           | ✗                  | jQuery and a lowercase `chartist` global                                |

  For barlabels and hover, the probe looked for the wrong markup ("?"). The contract test settles them.

- **The site.** Live examples run in a sandbox that resolves bare imports through an import map. The site serves Chartist's builds from `/playground-lib/` (`integrations/playground-lib.mjs`). Guide examples live in `apps/docs/src/examples/<page>/<name>`, outside the library's examples package, so they get no gallery entry and no visual baseline. The design canvas has a `Plugins` board: a header item, filter chips, cards with a "v2:" status, and "Write your own".
- **0.x and 1.x.** The 0.x site had a plugins page with eight plugins, each with a live example, an author and a link (`tmp/chartist-v0/site/data/pages/plugins.yml`). 1.x's page said "Coming soon".

## Goals / Non-Goals

**Goals:**

- A plugins page that credits the authors of the popular plugins and shows each one working on v2, live.
- Compat that makes those plugins run on v2, on both APIs, proven by a test that runs their published code.
- A filter that finds a plugin on the page quickly.

**Non-Goals:**

- v2-native ports or official plugins, use with bundlers, plugins with other dependencies, patching plugin code (see the proposal).

## Decisions

### The plugins run as scripts, the way they were made

These plugins are browser scripts that read the global `Chartist`. The page shows them that way: Chartist's UMD build, the compat UMD build, then the plugin. The example code reads `Chartist` and uses `fromLegacyPlugin`:

```html
<script src="chartist/umd"></script>
<script src="chartist/compat/umd"></script>
<script src="chartist-plugin-pointlabels"></script>
```

```ts
const { lineChart } = Chartist;
lineChart('#chart', data, {
  plugins: [Chartist.fromLegacyPlugin(Chartist.plugins.ctPointLabels())]
});
```

Each entry also shows the same three script tags with jsDelivr URLs (`chartist@next` for v2 until the release, the plugin at its listed version), ready to copy. A global `Chartist` declaration in the example gives the editor types.

Alternatives:

- _Wrap each plugin in an ES module at build time_, running its code against a generated namespace. That's tidier for the sandbox, but readers can't copy it: nobody's site does that.
- _Import them as ES modules_: their CommonJS entry would get v2's module object, which has no `plugins` namespace and no 0.x names, so they can't work that way (see the proposal's out of scope).

`@stklcode/chartist-plugin-tooltips` has an ES module build and imports `chartist`. Its entry shows the import, and its example uses it.

### Bare names for classic scripts in the sandbox

The sandbox resolves `import 'x'` through its import map, but classic `<script src>` tags don't use import maps. Examples are HTML projects, so the plugin scripts belong in `index.html`. The sandbox has no base URL, and a relative path would depend on the page's depth. So the compiler gets one rule: a classic script whose `src` is a key of the import map gets that URL. The site's import map gains the keys `chartist/umd`, `chartist/compat/umd` and one key per plugin package name.

This keeps examples identical across the page, the playground and shared links, because all three build the same import map. "Open in StackBlitz" is turned off for plugin examples: StackBlitz can't resolve those names, and the CDN snippet covers the real setup.

### Compat brings back what plugins of 0.x and 1.x relied on

The probe pins the gaps. Each is filled where 1.x code expects it:

- **The global for plugin scripts.** Importing `chartist/compat`, from any build, adds to the global `Chartist` what it lacks: the library, compat, `plugins`, `Line`, `Bar` and `Pie` (the 1.x classes) and `getDataArray` (rebuilt from 1.x's data normalization). Decided with the author while building the page: first only the compat UMD build did this; then the author asked to do it as a module side effect, so a 0.x plugin script works after a module import of compat, with one Chartist instance and no UMD build.
  - A test showed the plugin has to stay a classic script: imported as a module, 9 of the 12 fail, because their UMD wrapper writes to the top-level `this`, which modules leave `undefined`. A `defer` script after the module import works for all 12 (deferred and module scripts run in document order); with a bundler, a script loaded at runtime does.
  - The names are on the global only, never exports. The package lists `./dist/compat.*` under `sideEffects`; the core stays free of side effects. A separate compat package was considered and not needed for this, since `sideEffects` lists files.
  - If the global belongs to another copy of Chartist (the UMD build next to modules), compat leaves it alone and warns: two copies would break `instanceof` in the plugins. Outside a browser it does nothing.
- **The legacy chart object.** `fromLegacyPlugin` builds the object with `Object.create` of the chart type's 1.x class prototype. `instanceof` then holds without constructing a 1.x chart. The type comes from the preset: `lineChart`, `barChart` or `pieChart`.
  - For `chart()` compositions, there is no 1.x class, so the object stays a plain object. Plugins that check the type skip such charts, as they would skip an unknown chart in 1.x.
  - `data`, the resolved `options` with the preset's 1.x defaults, and an `optionsProvider` are set before `install` returns.
- **`chart.svg` on both APIs.** It's the root element wrapped in the 1.x `Svg` API (`querySelectorAll`, `elem`, `addClass`, …), set before the first `draw` event. On the classes it has to be in place by the time `draw` listeners run. The probe's zoom error on the classes shows it isn't today.
- **`created` gets `bounds`.** It comes from the value axis's bounds, which compat's axis object already computes for `axisY`, mapped to 0.x's shape (`min`, `max`, `range`, `step`, `values`).

The legacy chart object stays only as wide as the plugins on the list need. A new field is added when a plugin we list needs it, not ahead of time.

### A contract test with the real plugins

Compat is tested against the published plugins, not against imitations. The test lives in the docs app's e2e suite: the site already serves the plugin files and the UMD builds, so it can load each plugin as the page does.

- It runs each listed plugin in both modes, checks its markup (labels, titles, a legend, a tooltip after hovering a point, a zoom rectangle after dragging, a hidden table) and fails on any page error.
- Compat's own unit tests in `packages/chartist` cover each behavior above without third-party code.

A plugin whose remaining failure is in its own code is moved off the list, with the reason written down in `src/data/plugins.ts`.

### Curated list, measured popularity

`src/data/plugins.ts` holds what can't be measured: title, description, author, links, license, chart types, the v2 status, the example and an optional note. The facts script adds `plugins: { "<package>": { monthlyDownloads } }` for each listed package, so downloads are never typed in. The page sorts by them.

- **Validation:** a zod schema checks the list and the snapshot. The build fails when a listed package has no count.
- **Code and licenses:** the plugins are pinned dev dependencies of the docs app. `playground-lib.mjs` serves each one's script and its license file at `/playground-lib/plugins/<package>/`, and fails the build if either is missing.

### The v2 status says how it loads

Every listed plugin runs on v2 through `chartist/compat`: the 0.x-era scripts on the global it sets up, and the 1.x-style @stklcode plugin through `fromLegacyPlugin`. So the status tells how a plugin loads:

- **"ES module"**: it imports `chartist` and works with bundlers (@stklcode).
- **"Global"**, marked as a warning: a script that reads the global `Chartist`, which compat sets up for backwards compatibility (everything else). Named "Global" with a warning icon at the author's request, instead of "Script".

Every entry says "Runs on v2 with `chartist/compat`". An `SSR` or `No SSR` tag says whether the plugin draws in server rendering (asked by the author). Every listed plugin is `No SSR`: compat emits the 1.x events from the `mount` phase, which `toScene()` never reaches (checked in Node: no `draw` event, nothing added to the markup). Only v2-native plugins, working in `compose`, can be `SSR`, and the data refuses `ssr: true` for a 0.x or 1.x plugin. A tag shows the Chartist API version the plugin was written for (`API v0.x`, `API v1.x`, `API v2.x`; asked by the author while building the page, with "API" so it isn't read as the plugin's own version): eleven are `API v0.x`, @stklcode's is `API v1.x`, and `API v2.x` is there for v2-native plugins to come. The design canvas's "Official" and "Community" chips are dropped: none is official. Entries also carry a short note when it matters, such as "Repository gone; the npm package remains" or "Not updated since 2016".

### Page layout and the filter

The header is "Plugins", with the canvas's "Small add-ons, big tricks", a sentence on what plugins do and a link to the guide. Then come the filter and the list. Each entry is a section:

- the title and the package name;
- the description;
- a credits row: the author, links, license, downloads and the status tag;
- the live example (lazy, as elsewhere);
- the CDN snippet.

"Write your own" closes the page with a short v2 plugin from the guide and a link to it. The canvas's sample uses the 1.x `draw` event, so it isn't used.

The filter is a text field plus chips for all, line, bar and pie, in a small inline script.

- It hides non-matching entries.
- It updates a live region ("3 plugins").
- It shows the empty message.

The controls render hidden and the script reveals them, so without JavaScript the page shows every entry and no dead controls.

The page joins the header navigation after Examples, as in the canvas. It gets a share card and a Markdown version, like the guides. The Markdown has each entry's text, credits and code, and is linked from `llms.txt` as a guide.

## Risks / Trade-offs

- **Old plugins break in ways the probe didn't see.** The contract test runs them, and anything left is moved off the list with a reason instead of being patched.
- **Compat grows for old code.** It only covers what these plugins use, and only on the global for plugin scripts and the legacy chart object, so the v2 API stays clean.
- **Third-party code on the site.** It's pinned, licensed and served from our origin. Dependabot or Renovate may bump it, and the contract test catches regressions.
- **Downloads are a crude measure.** The list also needs the plugin to run on v2 and to need nothing else, and the curated data can add a note.
- **A heavy page:** 12 live examples. They mount lazily, as on the guide pages, and the plugin scripts are small.
