# Chartist v2 — Landing Page Brief (extension of the brand & docs canvas)

## Context

This continues the Chartist v2 canvas you designed from [`design-handoff-prompt.md`](design-handoff-prompt.md). The brand, the tokens (`chartist.css`), the components and the docs pages stay as they are. This brief covers **only the landing page**, which needs to do more than the current `Landing` artboard does.

Since your first design, the v2 library is feature-complete. The landing page should sell it.

## The goal

The landing page is Chartist's **marketing instrument** and should be **immersive**: a page people scroll through with a smile, that shows instead of tells, and that convinces a developer within a minute that Chartist is the right choice for simple, beautiful, CSS-styled charts.

- **Immersive:** the page is a story told while scrolling. The Chartist Guy guides it: he presents a live chart in the hero, and the chart on his easel changes and reacts as the reader moves through the sections (line → bars → donut → a composed chart, drawing in as it appears). Sections reveal with scroll-driven motion.
- **Marketing:** clear features, the v2 highlights, an honest comparison with other libraries, and calls to action (Get started, Examples, GitHub) at natural points.
- **It proves itself:** every chart on the page is a real Chartist chart, and all motion is CSS (scroll and view timelines, transitions, SMIL in the showcase). The page demonstrates "style with CSS, control with JS" by being built that way.

## Keep from the current Landing artboard

Hero with the mascot and the install tabs (npm and `<script type="module">`), "Why Chartist" facts, the gallery, "Edit it. Watch it redraw." (live editing), "Responsive sugar topping", "Animations, in plain CSS", "Fits whatever you build with" (ecosystem), community, the Cube sponsor slot, and "Ready when you are." Rework them into the scroll story where it helps.

## New sections

### 1. Features

A scannable overview, one short line and a tiny live demo or illustration each. The facts, as they are today:

- **Style with CSS.** Charts are plain SVG with predictable classes; colors, lines, grid and labels are CSS custom properties (`--ct-series-a`, `--ct-line-width`, …), scoped to a page, a container or one chart.
- **Responsive, two ways.** Breakpoints by window media queries (as always) or by the chart's own container size (`container('(width < 400px)')`, experimental, needs a polyfill today). Same mechanics as CSS, so you can reuse your CSS conditions.
- **Composed charts.** Bars and lines in one chart, several axes (left and right Y axes), each axis scaled to its own series.
- **Works everywhere SVG works.** Labels as real SVG text, wrapped to fit, so charts render on the server (`toScene()` + `renderToString()`) and survive image converters, PDF and email.
- **Functional, typed API.** `lineChart('#chart', data, options)` or `chart()` with layers; written in TypeScript with full types.
- **Tiny and tree-shakable.** You only ship what you import.
- **No build step needed.** Native ES modules from a CDN in a `<script type="module">`; npm and every bundler work too.
- **Plugins and events.** Every element passes through events you can transform; plugins hook in the same way.
- **Accessible palette.** An opt-in color-blind-safe theme that follows light and dark mode.
- **Backwards compatible.** 1.x code keeps working (`new LineChart(...)`); the new features are in the functional API.

### 2. v2 highlights

A "what's new in v2" moment for returning users: the functional API, composed charts and multiple axes, SVG text labels and server rendering, container queries, CSS custom properties and the accessible theme. Link to the migration guide. The 1.x look is unchanged: charts upgrade without changing appearance (this is a selling point).

### 3. Comparison

An honest, respectful comparison with **Chart.js**, **ApexCharts** and **Highcharts**. Chartist doesn't need to win every row; it should be clear where it shines (size, CSS styling, SVG, no build step, license) and fair about where others offer more (chart types, built-in interactivity like tooltips and zoom).

Suggested rows (design the table or cards; **use placeholders for every value**, the site fills them from measurements and the libraries' own docs at build time):

- Bundle size for a line chart, minified + gzipped: Chartist `[MEASURED]`, others `[MEASURED]`
- Rendering: SVG / Canvas / both
- Styling with plain CSS
- Works without a build step (ESM from a CDN)
- Server-side rendering to SVG
- TypeScript types
- License (e.g. MIT vs commercial terms)
- Chart types included
- Built-in tooltips, zoom, interactions

Add a small "How we measured" note and a date (`[DATE]`). No mocking of other libraries, no invented numbers.

### 4. The scroll story (immersive layer)

Design how the sections connect as one experience:

- The mascot's easel chart morphs between chart types as sections come into view; the mascot reacts (points, raises an eyebrow, celebrates at the end).
- Charts draw in when they enter the viewport (line draw-in, bars growing, donut sweep).
- A "resize me" moment for the responsive section (a draggable container edge) and a container-query demo where one chart sits in a narrow and a wide card.
- Progress or anchor navigation so the long page stays easy to scan.
- **Reduced motion:** every animated moment has a calm, static alternative; nothing important depends on motion.

## Deliverables

- An updated `Landing` artboard (desktop 1440, light), `LandingDark`, and `MobileLanding`, with the new sections and the scroll story.
- A storyboard artboard (`LandingStory`) showing the key scroll states of the hero mascot and the section transitions, with notes on timing and triggers.
- If needed, new reusable components (e.g. `FeatureCard`, `ComparisonTable`, `ScrollStage`) as their own artboards.

## Constraints

- Same brand, tokens and components; new tokens only if a section needs them.
- Astro, static, mostly zero-JS: motion through CSS scroll/view timelines and transitions; small islands only where needed (live editor, resize demo).
- WCAG AA, visible focus, keyboard-reachable demos, reduced-motion variants.
- **Code samples use the v2 functional API** (`lineChart`, `chart`, layers) and the real paths: `import 'chartist/styles.css'` with npm, `https://cdn.jsdelivr.net/npm/chartist/dist/index.min.js` (module) and `dist/index.min.css` from a CDN. Not `new LineChart` (1.x style) except where the page talks about backwards compatibility.
- Copy follows the tone guide: friendly, a little cheeky, confident, never corporate, never mocking competitors.

If something is ambiguous, propose 2–3 options with a recommendation instead of stopping.
