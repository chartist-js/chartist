# Proposal

## Why

Chartist's plugin ecosystem is one of its strengths, and the site doesn't show it. The 0.x site had a plugins page with eight plugins, each with a live example, its author and a link. The 1.x site's plugins page only says "Coming soon". v2 promises that 1.x plugins keep working through `chartist/compat`. But in a browser test of the 13 most-downloaded plugins on v2, only three run through `fromLegacyPlugin`, and seven on the 1.x classes. Most of them were written for 0.x and use 0.x globals and chart fields that compat doesn't provide.

## What Changes

- New page at `/plugins/` with its own "Plugins" item in the header navigation, as in the design canvas. It shows the most popular community plugins:
  - Each plugin gets an entry with its name, what it does, the author (credited by name), links to the repository and the npm package, the license, its monthly downloads, a v2 status, and a live example that runs the plugin's own code on v2.
  - The entries are sorted by monthly downloads.
  - A filter at the top searches the plugin list only, by name, author or what it does, and narrows it by chart type. It runs on the page, without the site search.
  - The page ends with "Write your own", linking to the plugin guide in "Events and plugins".
- The plugins come from a curated list in the site's data: npm name, title, description, author, links, license, chart types and example. Their download counts come from the facts snapshot, which `pnpm nx run docs:facts` updates. The plugins' code is pinned as dev dependencies of the docs app and served by the site itself, with each license.
- The first list has 12 plugins. These are the most-downloaded plugins on npm that need nothing but Chartist:
  - axistitle, legend, tooltips (the Globegitter fork), pointlabels, chartist-hover, zoom, fill-donut, barlabels, accessibility, threshold and targetline, mostly written for 0.x;
  - `@stklcode/chartist-plugin-tooltips`, a maintained plugin written for 1.x.

  The original `chartist-plugin-tooltip` is left out: it needs jQuery, and the tooltips fork replaced it.

- **Compat work**, so these plugins run on v2 as they ran on 0.x and 1.x:
  - **The 0.x global surface:** loading `compat.umd.js` as a script adds what 0.x-era plugins expect on the global `Chartist`: the `plugins` namespace, `Line`, `Bar` and `Pie` as names for the 1.x classes, and the 0.x helper `getDataArray`.
  - **The chart object of `fromLegacyPlugin`:** it is an instance of its chart type's 1.x class, so type checks like `chart instanceof Chartist.Line` pass. It has `data` and the resolved `options` (with defaults, such as `classNames`) when the plugin installs, an `optionsProvider` with `getCurrentOptions()`, and an `svg` with the 1.x `Svg` methods plugins call, such as `querySelectorAll`.
  - **The `created` event:** with compat, its payload carries the axes with their 1.x fields, such as the bounds.

  A browser test runs every listed plugin on v2, through `fromLegacyPlugin` and on the 1.x classes, and checks that it draws what it should.

- The live examples load the plugins the way their READMEs show, as scripts after Chartist: the UMD builds of `chartist` and `chartist/compat`, then the plugin. The example code then uses the global `Chartist`. In the example's `index.html`, those scripts are named like imports (`<script src="chartist-plugin-axistitle">`), and the sandbox resolves them to the site's copies. Each entry also shows the same setup with CDN URLs, ready to copy.
- `docs/v2-high-level-plan.md` records the page and the compat decisions.

## Capabilities

### New Capabilities

_None._ The page belongs to the docs site, next to its other page requirements.

### Modified Capabilities

- `docs-site`: adds requirements for the plugins page: where it is, what each entry shows (credits, links, license, downloads, v2 status, live example), the order, the local filter, the plugin data source, and serving the plugins' code locally.
- `example-playground`: a classic `<script src>` or a stylesheet `<link href>` in an example's `index.html` may name a bare specifier from the sandbox's import map; the compiler replaces it with that URL, so examples can load UMD builds, plugin scripts and their stylesheets from the site in the docs, the playground and shared links.
- `v1-compatibility`: adds requirements for 0.x-era plugins: the 0.x global surface from the compat UMD build, the 1.x chart fields and type checks for plugins converted with `fromLegacyPlugin`, the 1.x axes in the `created` payload, and a contract test that runs the listed community plugins.

## Out of scope

- Writing v2-native versions of these plugins, or adopting any as official plugins. The design canvas left "official" plugins open; this change lists community plugins only.
- Using these 0.x-era plugins with bundlers. Their CommonJS entry requires `chartist` and expects the 0.x names on it, which v2's modules won't provide. The page shows the script setup, and notes when a plugin, such as `@stklcode/chartist-plugin-tooltips`, imports cleanly.
- Plugins that need other libraries (jQuery), framework wrappers (react-chartist, ng-chartist: they are in the landing page's ecosystem section), and plugins with fewer than about 500 monthly downloads. A note invites authors to propose theirs.
- Fixing bugs inside the plugins themselves. If a plugin misbehaves on v2 for a reason in its own code, that is written down on its entry, not patched.
- Adding the plugins page to the site search (Pagefind indexes it as a normal page). The filter only searches the plugin list.

## Breaking changes vs 1.x

None. The compat additions only add 0.x names to the compat UMD global and fill in fields of the legacy chart object; nothing that works today changes. The 0.x aliases (`Chartist.Line`, `Chartist.plugins`, `Chartist.getDataArray`) exist only when `compat.umd.js` is loaded as a script, never in the ESM or CommonJS exports.

## Impact

- `packages/chartist/src/compat/`: the legacy chart object, the `created` payload and the UMD global additions, with unit tests and a plugin contract test.
- `packages/playground/src/compile.ts`: bare names in classic script tags.
- The docs app:
  - `apps/docs/package.json`: the 12 plugins as pinned dev dependencies;
  - `integrations/playground-lib.mjs`: serves the UMD builds and the plugin scripts with their licenses;
  - `src/data/plugins.ts`: the curated list;
  - `scripts/facts.ts` and `src/data/facts.ts`: the download counts;
  - `src/lib/site.ts`: the header navigation;
  - the new `src/pages/plugins.astro` and a live example per plugin;
  - a Markdown version of the page and its share card;
  - e2e tests.
- `docs/v2-high-level-plan.md`.
