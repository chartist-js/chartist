# Chartist v2 — Brand & Docs Website Redesign Brief

## Who I am and what this is

I'm Gion Kunz, the creator of **Chartist.js**, a simple, responsive SVG charting library I started in 2014. It became very popular: lots of GitHub stars and npm downloads, plus wrappers for React, Angular, Vue, Ember, WordPress and more. Over the years I had less time to maintain it and the project fell behind. In 2022, cube.dev helped migrate it to TypeScript (v1.x) and built a new docs site. That kept the project alive, but it lost the personality, charm and visual appeal that made the original stand out.

I'm now starting **Chartist v2**: a full modernization of the library, the brand and the documentation website. I'd like you to design a **refreshed brand identity** and a **prototype of the new documentation website**. A separate engineering track is building the library and site in parallel. It will use Astro (static site generation) in an Nx monorepo and will implement your design afterwards.

## The core goal

**Bring back the soul of Chartist 0.x, made for today.**

The 2014 site was playful, warm, opinionated and fun to explore. The v1 site (chartist.dev) is a generic Docusaurus template: correct but dull, and it never felt finished or engaging. v2 should feel _crafted_. It should be a docs site people enjoy browsing and want to show to colleagues, and still be a fast, clear reference.

Keywords: **simple, responsive, crafted, playful, confident, lightweight, CSS-first, SVG-native.**

## Research these sources first

Please study these before designing. Take inspiration from the spirit, not the pixels.

### 1. The original 0.x website (2014). This is the emotional reference.

- Live: https://gionkunz.github.io/chartist-js/
- Source (backup repo, branch `main`): https://github.com/gionkunz/chartist-js
  - `site/images/chartist-guy.svg`: **the Chartist Guy**, our mascot. In the original landing page he holds a canvas/board, and a _real, live Chartist chart_ is rendered inside it and animated (see `site/scripts/chartist-guy.js` and `site/layouts/landing.hbs`). That idea is the heart of the brand. The mascot isn't just decoration; he _presents_ charts.
  - `site/images/chartist-icon.svg`: the original icon/logomark
  - `site/styles/settings/`: the original site palette and typography (warm cream/beige, grapefruit/red, yellow, green, dark warm gray; "Oxygen" typeface)
  - `src/styles/settings/_chartist-settings.scss`: the default chart series colors (these define what "a Chartist chart" looks like for millions of users)
  - `site/styles/_landing.scss`, `_live-example.scss`, `_example-charts.scss`: landing layout, live code examples, chart gallery styling
  - `site/templates/*.hbs` and `site/data/pages/*.yml`: page structure and content (landing, getting started, examples, API docs, plugins)
- Things I loved and want back: a big hero with the mascot, a gallery of beautiful example charts, **live editable examples right in the page**, CSS animation and SMIL "crazy animations" showcases, responsive-config demos, and a cheeky, enthusiastic tone.

### 2. The current v1.x docs (2022). This is what NOT to repeat.

- Live: https://chartist.dev/
- Source: https://github.com/chartist-js/chartist (`website/` folder, Docusaurus)
  - `website/static/img/logo.svg`: current logo
  - `website/static/img/chartist-guy.gif`: current mascot animation ("Big welcome by the Chartist Guy")
  - `website/src/css/custom.css`, `recoloring.css`: current theme
- Problems: template look, no identity, examples assume a bundler, little delight, feels unfinished.

### 3. The library itself

- Look at the example charts in both repos: line, bar, pie/donut, area, stacked, bipolar, scatter, gauge-style donut, animated charts. The site should _showcase_ them beautifully.
- The library's philosophy: **style with CSS, control with JS**. Charts are plain SVG that you can style and animate with CSS. The brand and site should celebrate that.

## What I want from you

### A. Brand refresh

1. **The Chartist Guy, modernized.** Keep his recognizable character (the friendly figure presenting a chart on a board), but redraw him in a contemporary illustration style. Explore a few directions (e.g. clean geometric/flat, line-art, subtle 3D/soft shading) and recommend one. Consider:
   - Poses/variants for different contexts: hero (presenting a chart), 404 (confused / chart fell over), empty states, "getting started" (pointing), loading, celebration (for a release).
   - He must work as **SVG** with a clearly defined area where a **live chart can be rendered** (like the original). Ideally parts of him can be animated with CSS.
   - A small/simplified version for avatars, favicons and social cards.
2. **Logomark & wordmark.** Modernize the Chartist icon and wordmark. It needs to work at favicon size, on GitHub/npm/social previews, in light and dark mode, and in monochrome.
3. **Color system.** Evolve the original warm palette into a modern system: brand colors, neutrals, semantic colors, and especially a **default chart series palette** (this becomes the library's default theme in v2, so it must be accessible, distinguishable for color-blind users, and look great in both light and dark mode). Please honor the heritage of the originals, but you decide the concrete values.
4. **Typography.** A modern pairing for display, body and code (web fonts, freely licensed).
5. **Tone of voice.** A short guide: friendly, a little cheeky, confident, never corporate. Include examples (hero tagline, a section intro, an error/404 message).
6. **Motion principles.** Charts drawing in, the mascot reacting, hover states. Delightful but restrained, and respecting `prefers-reduced-motion`.

### B. Documentation website prototype

Design a responsive prototype (desktop + mobile, light + dark) covering at least:

1. **Landing page.** Hero with the Chartist Guy presenting a live, animated chart; one-line pitch; quick install (npm **and** plain `<script type="module">` from a CDN, both first-class); a gallery of example charts; "why Chartist" facts; a responsive-charts demo (resize to see the chart adapt); an animation showcase; ecosystem/wrappers; community links; sponsor area (see below).
2. **Getting started.** A step-by-step guide that works _without_ a bundler first (plain HTML + ESM), then shows npm/bundler usage.
3. **Examples gallery.** Filterable grid of chart cards, each opening an **interactive playground**.
4. **Interactive playground / live example component.** This is a key feature. An in-page code editor (HTML/CSS/JS tabs) next to a live output pane that re-renders the chart as you type. It runs in the browser with no external sandbox site. Design it as a reusable component that can be embedded inline in any docs page, plus a full-screen variant. Include "copy", "reset", "open full-screen" and "share" actions.
5. **API reference page.** Chart types, options, events and plugins. It should be readable and scannable, with option tables, type signatures and inline mini-demos.
6. **Plugins page.** Community and official plugins.
7. **Docs page template.** Sidebar nav, on-page TOC, search, version switcher (v2 / v1 / v0 archives), prev/next, "edit on GitHub".
8. **404 page** featuring the mascot.

### Sponsor note

cube.dev supported the v1 migration, and in return they get a tasteful mention in the README and on the website ("Supported by Cube"). Please include a sponsor slot that looks integrated and respectful, not like an ad banner.

## Constraints for the engineering hand-off

- The site will be built with **Astro** (static, mostly zero-JS, with islands for interactive parts). Please design with reusable components in mind and provide **design tokens** (colors, type scale, spacing, radii, shadows, motion) in a form that maps cleanly to CSS custom properties.
- Chart styling in v2 will also be driven by CSS custom properties. Show how the brand tokens feed into the chart theme (series colors, grid, labels) so the docs and the library share one visual language.
- Light and dark mode are both first-class.
- Accessibility: WCAG AA contrast, visible focus states, reduced-motion variants.
- Performance matters: favor SVG and CSS over heavy imagery; mascot illustrations as optimized SVG.

## Deliverables

1. Brand guidelines: mascot (with variants), logo/wordmark, color system (including chart palette), typography, voice, motion.
2. Exported assets: mascot SVGs (with the live-chart area marked), logo SVGs, favicon set, social/OG card template.
3. Design tokens (JSON or CSS custom properties).
4. Docs website prototype: the pages listed above, desktop + mobile, light + dark.
5. A short rationale explaining how the new brand connects to the 2014 original.

If anything is ambiguous, propose 2–3 options with a recommendation instead of stopping. I'd rather react to concrete directions.
