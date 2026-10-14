# Visual design

Chartist's brand and the docs site's design were made in Claude Design. This folder is a snapshot of that canvas, kept as the design reference for the site.

- Canvas: https://claude.ai/artifact/CFCX75HRhyT28hXYSNdgbU (snapshot of version `1791919724-153a`)
- Implemented in `apps/docs`: the tokens in `src/styles/tokens.css`, the mascot in `src/components/Mascot.astro`, the logomark in `src/components/Logomark.astro`. Styling rules: `apps/docs/STYLING.md`.

To change the design, change the site; the canvas is the reference for new pages and components, not a source the site is generated from. When the design itself changes in the canvas, download a new snapshot here and say what changed in the commit.

## Contents

- `project/canvas.json`: the canvas index (artboard titles, positions, grouping).
- `project/chartist.css`: the design system. It holds the palette (`--p-*`), the semantic tokens for light (`.cx`) and dark (`.cx.dark`), the mascot colors (`--m-*`), the chart series palette (`--ct-series-*`, including the accessible theme), and component styles.
- `project/*.dc.html`: one file per artboard.
- `project/paper.png`, `project/paper-dark.png`: the design's paper texture, "Cream Paper" from Subtle Patterns (CC BY-SA 3.0). The site doesn't use it; see `apps/docs/src/assets/README.md` for the texture it uses.
- `assets/reference-*-0x.svg`: the original 2014 mascot and icon, uploaded as a reference for the redesign.

The `.dc.html` files are Claude Design component pages. They need the Design runtime (`support.js`, not included) to render, so read them as source (markup, tokens, copy, data), and open the canvas link to see them rendered.

| Group                      | Artboards                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Brand                      | `Main` (overview and rationale), `MascotPoses`, `Logo`                                                                          |
| Brand system               | `Color`, `Typography`, `VoiceMotion`, `Tokens` (tokens → chart theme), `OgCard`                                                 |
| Components (Astro islands) | `Mascot`, `Logomark`, `Chart`, `LiveExample`, `SiteHeader`, `SiteFooter`, `ComparisonTable`, `ScrollStage`                      |
| Docs pages (desktop)       | `Landing` (scroll story), `LandingStory` (storyboard), `GettingStarted`, `Examples`, `Playground`, `Api`, `Plugins`, `NotFound` |
| Dark mode and mobile       | `LandingDark`, `MobileLanding`, `MobileDocs`, `MobilePlayground`, `MobileNotFound`                                              |

## The design's key choices

- **Mascot:** the 0.x gentleman (top hat, moustache, red waistcoat, easel, hay fork), redrawn. All his colors are custom properties.
- **Palette:** cream became Paper, red became Waistcoat (`#C8102E`), yellow became Mustard (logo tile), warm gray became Ink.
- **Chart series colors:** unchanged from 1.5 (`--ct-series-a` … `-o`), plus an opt-in color-blind-safe theme.
- **Typography:** Zilla Slab (display) and Atkinson Hyperlegible Next (body).

## Where the site differs from the snapshot

- **Code font:** JetBrains Mono instead of Atkinson Hyperlegible Mono. All fonts are self-hosted.
- **Code samples** use the functional API and the real export paths; the design's samples use the 1.x classes and old paths.
- **Charts** are drawn by Chartist. The design's `Chart` component draws them with its own simplified math, as a mockup.
- **Numbers and comparisons** on the landing page come from a dated facts snapshot (`pnpm nx run docs:facts`) and measurements, where the design has placeholders. The design's "Trusted by" logo row became a curated "Used by" list that links to the evidence.
