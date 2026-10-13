# Design

## Context

- Docs collection: `src/content/docs/*.mdx` with `title`, `description`, `group` (`Start here`, `Chart types`, `Guides`) and `order`. `DocsLayout` builds the sidebar, TOC and prev/next from them.
- Components for pages: `LiveExample` (static code with a live chart, editable in place), `Step`, `Callout` (`tip`, `info`, `warn`), `Chart`.
- The 0.x guide (`tmp/chartist-v0/site/data/pages/getting-started.yml`): set-up, first chart (aspect ratios, fixed size, several charts), configuration, responsive overrides, options per series, styling (selectors per chart type), colour, dynamic colouring with draw events, SMIL animations, axis types (1D vs 2D data, XY plots, fixed ticks).
- The 1.x docs (`tmp/chartist-v1/website/docs`): "What is it made for?", "What's new in v1", the same guides in Docusaurus, the API reference.
- The v2 API: `lineChart`, `barChart`, `pieChart`, `chart()` with `cartesianAxes`, `line`, `bar`, `axisGrid`, `axisLabels`; `responsive()`, `container()`; `toScene()`, `renderToString()`; the handle (`update`, `detach`, `destroy`, `on`, `off`, `emit`); plugins (`install`, phase events, `compose`); `chartist/compat` (`compat`, `fromLegacyPlugin`, the 1.x classes); `chartist/styles.css`, `chartist/themes/accessible.css`, `chartist/scss/*`.

## Decisions

### D1: The 0.x path, v2 content

The Guides follow the 0.x order: configure, size, style, respond, then the advanced topics. Chart types get their own pages (0.x had them only as examples). Headings may be playful where 0.x was ("Responsive sugar topping" stays); the text is new and v2-accurate, not copied.

### D2: The voice (`WRITING.md`)

- Second person, direct, short paragraphs; say why before how.
- Opinionated where Chartist is ("colors belong in CSS"), honest about limits ("tooltips come from plugins").
- A little personality, no jokes for their own sake; no marketing words ("blazing", "seamless", "simply").
- Every page: a one-paragraph intro, then sections that each end in something the reader can run or copy; at least one `LiveExample`; links to related pages.
- Code: the functional API, real import paths (`chartist`, `chartist/compat`, `chartist/styles.css`), TypeScript where types help; classes only on the migration page.
- Site style rules apply (sentence case headings, no em dashes, US English).

### D3: Code samples are checked

- TypeScript fences in docs pages are type-checked against the built `chartist` types by a script (`scripts/check-samples.ts`, target `docs:samples`, part of `check`). A fence opts out with `ts nocheck` (for fragments like an options object), so a skipped sample is visible in the source.
- Every `LiveExample` renders without console errors in e2e.

This catches samples that drift from the API, which matters more with several writers.

### D3b: Live example projects are real files

Added during the foundation (2026-10-13): oxfmt formats MDX as Markdown and strips the indentation inside template literals, so example projects can't live as strings in MDX. They live in `src/examples/<page>/<example>/` (`index.html`, `src/main.ts`, optionally `src/style.css`), loaded with `?raw` by `src/lib/examples.ts`; `LiveExample` takes `example="<page>/<example>"`. Being real files, they're formatted, linted and type-checked by `astro check` too. `LiveExample` also gained `show` (the file shown before editing, and the editor's first tab) and `previewStyle` (custom properties for the static preview).

### D3c: Live examples run their own code (review, 2026-10-14)

The author noticed the dynamic coloring example showed default colors until Edit: the static preview was drawn from JSON options and couldn't run a plugin. Each live example now compiles its files and runs them in a sandboxed preview when it nears the viewport (`compile()` and `Preview` only, through the playground's `./compile` and `./preview` entries; no editor). The JSON chart stays as placeholder and fallback, drawn exactly as the library draws it (`plain`: library padding, no draw-in), with `{ $call }` markers for functions.

### D4: Experimental features

`container()` and anything polyfill-only get a `Callout kind="warn"` at the top of their section saying what's experimental, what it needs (the `match-container` polyfill, `Element.matchContainer()`), and linking the standards issue (csswg-drafts#6205).

### D5: Parallel writing

1. **Lead (serial):** `WRITING.md`, the sample checker, the sidebar order, and the reference page _Styling with CSS_.
2. **Writers (subagents, parallel, one worktree each, disjoint files):**
   - A: _Why Chartist?_, _Coming from 1.x_;
   - B: _Line charts_, _Bar charts_;
   - C: _Pie and donut charts_, _Composed charts_, _Axes and scales_;
   - D: _Data and options_, _Sizing charts_, _Responsive sugar topping_;
   - E: _Animations_, _Events and plugins_, _Server rendering_, _Updating charts_.

   Each writer reads `WRITING.md`, the reference page, the library source and tests for its topics (the source is the truth, not memory), checks every claim against it, and passes `docs:samples`, `check`, `build` and e2e. Library gaps or bugs found go in the report.

3. **Lead (serial):** merge, cross-links (Getting started, prev/next sense, "see also"), a read-through for voice and consistency, then the author's review.

## Risks / Trade-offs

- **Claims that don't match the library** → writers verify against source and tests; samples are type-checked and run.
- **Uneven voice** → `WRITING.md`, the reference page, and the lead's read-through.
- **Pages that duplicate each other** → each topic has one home page; others link to it.
- **Token cost of five writers** → each reads only the writing guide, the reference page and its topics' sources.
