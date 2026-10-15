# Design

## Context

The prototype on branch `feat/terminal-renderer` (`packages/terminal`, one commit) is the reference. It proved the approach and found the details that matter; this design keeps what worked and fixes what was prototype-only:

- **Input is the scene.** `toScene()` gives every node its role, attributes and data context (`scene/roles.ts`), so a renderer can draw by role, falling back to the element name for plugin nodes.
- **Cell geometry.** A cell of 8 × 16 px with labels measured one cell per character (`measureText` in `SceneSize`) puts Chartist's own label layout on the character grid. Braille dots are then 4 × 4 px.
- **Layout tweaks.** Each tweak is an existing 1.x option, so the presets can carry it:
  - `labelOffset.y: 8` on both axes, so X labels land in the row below the axis and Y labels on their grid lines;
  - X `offset: 24`, so the X labels stay inside the canvas;
  - `scaleMinSpace` of 32 px on Y and 64 px on X for horizontal bars, so ticks don't fall on every row or every three columns;
  - chart padding `{ top: 16, right: 16, bottom: 0, left: 0 }`.
- **Rendering details.** Labels are placed by the vertical center of their line, not the baseline: SVG text is `ASCENT = 0.85` em below the line top (`scales/svgLabels.ts`), and pie labels use `dx`/`dy` at their center, as in 1.x. A stacked bar's base cell needs the lower bar's color as background. Areas belong below the grid.
- **Prototype-only parts.**
  - It copied the series colors from `_settings.scss`, and its CLI rebuilt the presets' axis setup by hand. That was only half right: horizontal bars need `normalize: { multi: 'x' }`, which the bar preset sets internally.
  - It ran from TypeScript sources, with colors as RGB in the canvas, so HTML output wasn't possible.
- **Release.** `nx.json` releases one fixed group with only `chartist`: `v{version}` tags, a workspace changelog, one GitHub release. The release workflow (`release.yml`, `.github/scripts/release.mjs`) reads the version from `packages/chartist/package.json` and publishes with `nx release publish` through trusted publishing. CI's gate runs `run-many` over all projects, so a new package's inferred targets join automatically.
- **Docs.** The playground's compiler takes extra import-map entries (`CompileOptions.imports`), so a live example can import another package's ESM build next to `chartist`.

## Goals / Non-Goals

**Goals:**

- One drawing core for both outputs. The canvas holds what each cell means (series, role, background); the ANSI and HTML serializers decide how that looks.
- The terminal charts take the same data and options as the 1.x presets, built by the presets' own code.
- Each shared value has one source: the series colors in `chartist`, the label metric in `chartist`, the stylesheet generated from them.

**Non-Goals:**

- Pixel-equal output with the SVG. The terminal output follows the scene; the visual tests don't compare it with the SVG.
- A plugin API of its own. Plugins act on the scene as for any renderer.

## Decisions

### Package layout and builds

```
packages/terminal/
  src/index.ts      public API (no Node.js imports, no globals)
  src/canvas.ts     cells: braille dots + characters, by priority
  src/draw.ts       scene → canvas, by role / element
  src/ansi.ts       canvas → text with ANSI colors
  src/html.ts       canvas → <pre> with classes
  src/charts.ts     lineChart / barChart / pieChart, terminal defaults
  src/legend.ts, src/color.ts (detectColorMode)
  src/cli/          ct-cli: args, data parsing, main
  scripts/styles.ts generates dist/styles.css
```

tsdown builds `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` and `dist/index.d.cts`, the same pattern as `chartist`'s tsdown config, with `chartist` external. The CLI is a separate ESM entry, `dist/cli.js`, with a shebang. It is the `bin` (`ct-cli`) and is not exported. The `exports` map holds `.`, `./styles.css` and `./package.json`.

`engines.node` is `>=22`. The CLI uses `util.parseArgs` with `allowNegative` (Node 22.4+), and Node 20 is end-of-life. The API itself has no such need, but one package has one `engines` field.

Alternatives:

- _Run the CLI from TypeScript, as the prototype does._ That needs Node's type stripping (22.18+) and ships sources. Building the CLI keeps all of the package's JavaScript in the same build.
- _A separate `@chartist-js/cli` package._ That is a second package for a 300-line command, and `npx @chartist-js/terminal` reads well.

### Semantic ink, two serializers

The prototype's canvas stored RGB per cell. Now a cell stores what it shows:

- the character (braille mask or text);
- a **kind**: `grid`, `label`, `area`, `line`, `point`, `bar`, `slice` or `text`;
- the **series** index, if any;
- a **background series**, if any (stacked bar cells, labels on slices).

The canvas keeps the prototype's rules: priority per cell, and the majority series for a braille cell with dots of several series. Both serializers merge runs of equal style.

- **ANSI** (`renderToTerminal`). The series index goes through the palette, by default `chartist`'s `seriesColors`. The color mode decides the escape: `38;2;r;g;b`, `38;5;n` (the 6×6×6 cube), or `30–37`/`90–97` (the nearest of the 16 standard colors by RGB distance). Grid, labels and areas are dim (SGR 2). A label on a colored cell gets black or white text by luminance.
- **HTML** (`renderToHtml`). Fonts rarely have braille, and many lack some box-drawing characters; browsers then draw those with a fallback font whose glyphs are narrower or wider than a cell and don't fill its height, so dots, grid lines and bars break apart. So every character goes into an `i` element the stylesheet makes one cell (0.6 × 1 em, inline-block, aligned to the top), and the stylesheet embeds "Chartist Terminal", a font built at build time from geometry (`scripts/font.ts`, with opentype.js) with the 256 braille patterns, `┈ ┊ ┼`, the block characters and `■`, each filling a cell edge to edge. It's under 5 kB as WOFF and embedded as a data URL, so the stylesheet needs no other file. Letters and digits come from a monospace font (JetBrains Mono when the page has it). (Found by the author on Windows, where the earlier `1ch` cells still showed broken grid lines. No Google Fonts monospace family has braille in the files Google serves, so a hosted font wasn't an option; a generated one has no license to carry. `terminalStyles()` was dropped from the API, since the font is a build artifact; the CLI's standalone page reads `dist/styles.css`.) Each style becomes classes, for example `ct-bar ct-series-b ct-bg-series-a` or `ct-label ct-bg-series-c`. The output is `<pre class="ct-terminal">` with text-escaped lines and no `style` attributes.

Alternative: an HTML serializer that maps the ANSI output (an ANSI-to-HTML converter). It would have inline colors and lose the series meaning, so themes couldn't apply.

### The stylesheet is generated

`scripts/styles.ts` writes `dist/styles.css` at build time from `chartist`'s `seriesColors`:

- for each series letter: `.ct-terminal .ct-series-a { color: var(--ct-series-a, #d70206) }`;
- the matching `.ct-bg-series-a` background;
- a readable label color on that background, `--ct-terminal-on-series-a`, defaulting to black or white for the default color;
- `.ct-grid` and `.ct-area` from `--ct-grid-color`, and `.ct-label` from `--ct-label-color`;
- `line-height: 1` and a monospace font stack, so braille cells touch.

The CLI's `--standalone` page inlines this file in a `<style>` element. That isn't a `style` attribute, so the no-inline-styles rule holds.

### Charts reuse the presets' configs

`chartist` gets `lineChartConfig(data, options)`, `barChartConfig(data, options)` and `pieChartConfig(data, options)` in `src/presets`.

- Each merges the options over the preset's defaults with the same `extend` the preset uses, then calls the existing spec's `config()`.
- They are pure functions that read no container, size or responsive options.
- `createPreset` keeps its own path; the new functions only expose what it already does for one set of options.
- They are `@experimental`, like the rest of the functional API.

`@chartist-js/terminal`'s `lineChart(data, options)` works like this:

1. Merge the terminal defaults (above) under the user's options, also with `extend`.
2. Build the config with `lineChartConfig`.
3. Run `toScene(config, terminalSize(columns, rows))`.
4. Serialize to text or HTML.

`barChart` adds `scaleMinSpace: 64` on X when `horizontalBars` is set. It also sizes the Y axis `offset` to the longest label when bars are horizontal. `pieChart` defaults `donutWidth` to `'45%'`, because CSS doesn't size the ring in a terminal.

Alternative: build configs in the terminal package from layers, as the prototype CLI did. That duplicates the presets and misses details like the horizontal normalization; other renderers would face the same problem.

### Shared values in chartist

- **`seriesColors`** (readonly hex strings, `a` to `o`) is exported from `chartist`. A test parses `$ct-series-colors` from `src/styles/_settings.scss` and compares the two. Sass stays the source for CSS, the constant the source for JavaScript, and the test keeps them equal. Generating one from the other would add a build step to `chartist` for 15 strings.
- **`textAscent`** (`0.85`) replaces the private `ASCENT` in `svgLabels.ts`, which then uses the export.
- Names are camelCase like `chartist`'s other exported values (`namespaces`, `escapingMap`). All three get doc comments per `DOC-COMMENTS.md` and entries in `test/api/exports/chartist.json`.

### CLI

`ct-cli <line|bar|pie|demo> [series…] [flags]`:

- **Arguments.** `util.parseArgs` in strict mode, so unknown flags are errors.
- **Data.** Parsing is its own module with unit tests: JSON, then delimited rows with an optional header row and name column.
- **Holes.** Empty values become `null`, which the presets treat as holes. Non-numbers are errors that name the value.
- **Size.** The width comes from `--width` or `process.stdout.columns`, or else 80. The height is `--height`, or else 20.
- **Colors.** `detectColorMode(process.stdout, process.env)` unless `--color` is given.
- **Version.** `--version` reads the version that tsdown inlines at build time (`import pkg from '../package.json' with { type: 'json' }`).
- **EPIPE.** On stdout it exits with code 0.

Flag names follow the prototype, plus `--data`, `--palette`, `--no-labels`, `--no-legend`, `--html`, `--standalone` and `--version`. `-h` is `--height` (as in the prototype), and help is `--help` only, because charts use `-h` far more often.

### Release in lockstep

- **nx.json.** `release.projects` becomes `["chartist", "terminal"]` in the existing fixed group. The tag pattern, workspace changelog, renderer, commit message and the version logic of `release.yml` and `release.mjs` stay as they are, because the version is shared.
- **Dependency on chartist.** `@chartist-js/terminal` depends on `"chartist": "workspace:^"`, and its `version` starts at `chartist`'s current version, which the fixed group requires. Publishing must turn `workspace:^` into `^{version}`. This is verified in the dry run (task) by packing the package and reading its `package.json`. If Nx's publish keeps the protocol, `release.version.preserveLocalDependencyProtocols: false` makes the version step write the range.
- **package.json.** `publishConfig.access: public`, `repository.directory`, `files: ["dist", "README.md", licenses]`.
- **Changelog.** The renderer leaves out `docs`, `playground`, `examples` and `openspec` scopes. `terminal` stays in and shows as `**terminal:**` in the section, like other scopes.
- **npm.** Trusted publishing needs a trusted publisher configured on npmjs.com for `@chartist-js/terminal`, for the same repository, workflow and `release` environment. The author does this, and the first publish if npm needs the package to exist, before the first release that includes it. Until then, adding the package to the group would make that release's publish fail, so it is added in the last implementation step.

Alternative: separate groups with independent versions. The author chose lockstep: one version to explain, one release, one changelog.

### Docs and the live example

- **Page.** A guide, `terminal-rendering.mdx` in the Guides group, after Server rendering. It covers the CLI, the API for CLI tools and HTML output.
- **Example.** Guide examples live with the docs, in `apps/docs/src/examples/<page>/<example>`, not in the gallery's `packages/examples`. The guide's example, `terminal-rendering/text-art`, draws a line chart as text art only (`format: 'html'` with the package's stylesheet), 34 columns at a fixed font size, in a terminal-window frame that wraps the chart and cuts it off when the preview is narrower (the author's choice: the frame follows `columns` and `rows`, not the other way round). The per-guide e2e test waits for an SVG or text art in each live example. (An SVG and text-art comparison was tried first; the author preferred the text art on its own, bigger.) It isn't a gallery example, so it has no visual baseline. (Planned first as a gallery example; changed while building, when it turned out guides take their examples from the docs.)
- **Import map.** `playground-env.ts` adds `@chartist-js/terminal` and `@chartist-js/terminal/styles.css` to the `imports` every live example and the playground page pass, pointing to the package's `dist/index.js` and `dist/styles.css`, which `integrations/playground-lib.mjs` serves under `playground-lib/terminal/`. Its bare `chartist` import resolves through the same import map, so both share one `chartist` instance.
- **CSS imports by name.** The playground compiler turns a static `.css` import into a `<link>` when the import map names it (`import '@chartist-js/terminal/styles.css'`), as it already does for `<link href>` in `index.html`.
- **Types.** The playground's `types` option gets `packages` (bare name → `index.d.ts`, relative to `url`). The type worker fetches them and installs each under `node_modules/<name>/`; those names stop being declared untyped.
- **StackBlitz.** An example that imports `@chartist-js/terminal` gets it in the exported `package.json`, at `chartist`'s version (they're released together), and the `@chartist-js` packages don't count as site-only names.
- **Install text.** Install snippets for the package follow `chartist`'s prerelease rule (`@chartist-js/terminal@next` while the version is a prerelease), by extending the rewrite in `apps/docs/src/lib/release.ts` to the scoped name.

## Risks / Trade-offs

- [Braille and box-drawing glyphs differ by font; some fonts lack braille or draw it with gaps] → The README and guide name fonts that work. The HTML stylesheet sets a monospace stack with braille coverage (`DejaVu Sans Mono`, `Menlo`, `Consolas`, then `monospace`).
- [Wide characters (CJK, emoji) in labels shift the columns] → Out of scope. Each code point counts as one cell, documented as a limitation.
- [Two `chartist` copies when an app pins another 2.x version] → The range `^{version}` lets npm dedupe. The renderer only reads plain scene objects, so mixed copies still work.
- [The first release with the package fails if npm trusted publishing isn't set up] → The package joins the release group last, and the tasks list the npmjs.com setup as the author's step before that.
- [The 16-color mapping makes neighboring palette colors equal: the default `a` and `b` are both reds] → This is accepted; `--palette` and `palette` let users pick distinct colors.
- [StackBlitz can't install `@chartist-js/terminal` before its first release] → Only examples that import it are affected; they work once the package is on npm.

## Migration Plan

Nothing migrates; `chartist` only gains exports. Rollback before the first release is reverting the branch. After a release, `npm deprecate` on the package's versions, with the group change reverted.
