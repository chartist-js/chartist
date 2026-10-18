# Writing the Chartist docs

How the docs pages in `src/content/docs/` read and are put together. The voice comes from the 0.x guides (2014): direct, a little opinionated, with live examples to play with. The content is v2.

## Voice

- **Talk to the reader.** "You", present tense, active voice. "Add a container and call `lineChart()`", not "A container is added and `lineChart()` is called".
- **Say why before how.** Chartist makes choices (styling lives in CSS, not in options; tooltips come from plugins). Explain the choice in a sentence, then show it.
- **Be opinionated where Chartist is**, and honest about its limits. "Colors belong in your stylesheet" is fine; so is "If you need zoom and panning out of the box, Chartist isn't the right tool".
- **A little personality.** A playful heading or an aside where it fits ("Responsive sugar topping", "Fixed stuff can be sweet too!"), at most a couple per page. Never at the cost of clarity, never a joke for its own sake.
- **Short.** Short paragraphs (one to three sentences), short sentences. Cut anything the code already says.
- **No marketing words:** blazing, seamless, powerful, effortless, simply, just, easy, robust, cutting-edge. Show it instead.

House style, as on the rest of the site: sentence-case headings, US English, no em dashes (use commas, colons, parentheses or a new sentence), no "Note:" prefixes (use a `Callout`).

## Page shape

```mdx
---
title: Styling with CSS
description: One sentence for search results and the page header.
group: Guides # Start here | Chart types | Guides
order: 3 # position in its group
---

An intro paragraph: what this page covers and why it matters. No heading before it.

## A section per idea

Prose, then something the reader can run or copy: a LiveExample or a code block.
```

- One topic, one home page. When another page touches it, link there instead of explaining it again.
- Every page has at least one `LiveExample`. Pick the example that shows the point best, not the biggest one.
- Link to other docs pages relatively, with the trailing slash: `[Sizing charts](../sizing-charts/)`, `[the custom properties](../styling-with-css/#custom-properties)`. The site may be hosted under a base path, so never start a link with `/`.
- End with links to related pages when there are natural next steps ("Next: make it respond to its container").
- Headings: `##` for sections, `###` inside them. They feed the "On this page" list, so keep them short.

## The pages

Slugs (file names) and sidebar order. Link between pages with these.

| Group       | Order | Slug                     | Title                    |
| ----------- | ----- | ------------------------ | ------------------------ |
| Start here  | 1     | `getting-started`        | Getting started          |
| Start here  | 2     | `why-chartist`           | Why Chartist?            |
| Start here  | 3     | `coming-from-1x`         | Coming from 1.x          |
| Chart types | 1     | `line-charts`            | Line charts              |
| Chart types | 2     | `bar-charts`             | Bar charts               |
| Chart types | 3     | `pie-and-donut-charts`   | Pie and donut charts     |
| Chart types | 4     | `composed-charts`        | Composed charts          |
| Guides      | 1     | `data-and-options`       | Data and options         |
| Guides      | 2     | `sizing-charts`          | Sizing charts            |
| Guides      | 3     | `styling-with-css`       | Styling with CSS         |
| Guides      | 4     | `responsive`             | Responsive sugar topping |
| Guides      | 5     | `axes-and-scales`        | Axes and scales          |
| Guides      | 6     | `target-lines-and-bands` | Target lines and bands   |
| Guides      | 7     | `animations`             | Animations               |
| Guides      | 8     | `events-and-plugins`     | Events and plugins       |
| Guides      | 9     | `custom-layers`          | Custom layers            |
| Guides      | 10    | `server-rendering`       | Server rendering         |
| Guides      | 11    | `security-and-csp`       | Security and CSP         |
| Guides      | 12    | `live-updates`           | Live updates             |

## Package pages

The `@chartist-js` packages each have a subsite under `/packages/<slug>/`, listed in `src/data/packages.ts`. Their pages are in `src/content/packages/<slug>/`:

- `index.mdx` is the overview (`order: 0`, `label: Overview`): what the package does, with a live example, then Install, a Quick start and links on.
- Every other file is a guide, ordered by `order`. Guides follow the rest of this guide: a live example each, checked samples, relative links (`../../../docs/<page>/` to a core guide, `../api/` to the package's API page).
- `api` isn't a page name: the package's API page uses it.

Live examples of package pages live in `src/examples/<slug>/<example>/`.

## Components

```mdx
import LiveExample from '../../components/LiveExample.astro';
import Callout from '../../components/docs/Callout.astro';
import Step from '../../components/docs/Step.astro';
```

- **`LiveExample`**: a Vite-shaped project shown as code with a live chart; readers press Edit to change it in place. The project lives in real files, `src/examples/<page-slug>/<example>/` with `index.html`, `src/main.ts` and optionally `src/style.css` (imported from `main.ts`), so it's formatted and type-checked like code. (Don't put project files in MDX strings: the formatter strips their indentation.) Pass `example="<page-slug>/<example>"`, `title`, `label` (the chart's accessible name), `preview` (`{ type, data, options }` for the static chart drawn before editing; `type` is `line`, `bar`, `pie` or `composed`) and `files`. `show` picks the file shown before editing (default `src/main.ts`), and `previewStyle` gives the preview the custom properties your CSS sets. Keep `preview` in sync with the code. See `getting-started.mdx` and `styling-with-css.mdx`.
- **`Callout`**: `kind="tip"` for shortcuts, `kind="info"` (default) for context, `kind="warn"` for experimental features and pitfalls. Bold the first words as a lead-in.
- **`Step`**: numbered steps for a procedure (Getting started). Rare elsewhere.
- **`Diagram`**: a Mermaid diagram; see [Diagrams](#diagrams).

## Diagrams

A diagram helps where the text describes a flow: steps that hand something on, two sides that talk to each other, states a chart moves through. If a sentence or a list says it as clearly, leave the diagram out; never draw what a chart or a code sample already shows.

Diagrams are [Mermaid](https://mermaid.js.org/) sources, one per file, in `src/diagrams/<page-slug>/<name>.mmd`. A page imports the source as text and passes it to `Diagram`:

```mdx
import Diagram from '../../components/docs/Diagram.astro';
import flow from '../../diagrams/ssr-hydration/flow.mmd?raw';

<Diagram source={flow} caption="From the server's markup to a live chart." />
```

The build renders it to inline SVG (no Mermaid script in the browser), and `src/styles/diagrams.css` draws it with the tokens in both themes. The dev server renders it again when you save the source. The renderer reads `diagrams.css` once, since its font sizes change the layout: restart the dev server after changing them.

- **`accTitle` and `accDescr` are required**: the title names the diagram for screen readers, the description says in a few sentences what the diagram shows. A source without them fails the build.
- **Top-down** (`flowchart TD`) for anything wider than a few nodes: a diagram scales down to the column, and a wide one gets small text on phones.
- **Emphasis by class**: `brand`, `accent`, `muted` or `code` (`hydrate([hydrate]):::accent`, `code` for a function or option name). Don't write colors with `style` or `classDef`: the build fails on a color without a token.
- **Covered types**: flowcharts (with subgraphs), sequence diagrams and state diagrams are styled fully; other types get the site's colors and fonts only. Use a `caption` instead of Mermaid's `title`.
- **A new machine**: the build renders in Playwright's Chromium. Install it once with `pnpm --dir apps/docs exec playwright install chromium`. Rendered diagrams are cached in `apps/docs/.cache/diagrams/`, so unchanged ones don't start the browser.
- `?raw` is Vite's text import. Once Vite supports `with { type: 'text' }`, that replaces it.

## Code

- **The functional API everywhere**: `lineChart()`, `barChart()`, `pieChart()`, `chart()`. The 1.x classes (`new LineChart(...)`) appear only on the migration page.
- **Real import paths**: `chartist`, `chartist/compat`, `chartist/styles.css`, `chartist/themes/accessible.css`, `chartist/scss/...`. CDN examples use `https://cdn.jsdelivr.net/npm/chartist@2/dist/index.min.js` and `.../index.min.css`.
- **TypeScript blocks are type-checked** against Chartist's types (`pnpm nx run docs:samples`, part of `check`). A checked block must be a complete module: imports included. For a fragment (an options object, a single call), mark the fence `ts nocheck`; use that sparingly, and prefer a complete, short sample.
- CSS, HTML and shell blocks use `css`, `html` and `sh`.
- **The library is the truth.** Check every option, default, class name and behavior you describe against the source in `packages/chartist/src` and its tests, not against memory or 1.x docs. If the source and your expectation disagree, the source wins; if the source looks wrong, report it.

## Checks

```sh
pnpm nx run-many -t lint check build e2e -p docs
```

`check` includes the sample check; e2e opens every docs page, checks it for console errors and accessibility, and runs every live example.
