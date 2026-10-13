# Chartist v2: Visual Design (Claude Design handoff)

Snapshot of the brand and docs redesign canvas, downloaded on 2026-10-12 and refreshed on 2026-10-13 with the landing page prototype.

- Source: https://claude.ai/artifact/CFCX75HRhyT28hXYSNdgbU (version `1791919724-153a`)
- Briefs: [`../design-handoff-prompt.md`](../design-handoff-prompt.md), and for the landing page [`../design-landing-brief.md`](../design-landing-brief.md)

## Contents

- `project/canvas.json`: canvas index (artboard titles, positions, grouping)
- `project/chartist.css`: **the design system**. It holds the palette (`--p-*`), the semantic tokens for light (`.cx`) and dark (`.cx.dark`), the mascot colors (`--m-*`), the chart series palette (`--ct-series-*`, including an accessible theme), plus component styles
- `project/*.dc.html`: one file per artboard
- `assets/reference-*-0x.svg`: the original 2014 mascot and icon, uploaded as a reference for the redesign (not new artwork)

The `.dc.html` files are Claude Design component pages. They need the Design runtime (`support.js`, not included) to render, so treat them as **source reference** (markup, tokens, copy, data), not as runnable pages. Open the source link above to see them rendered.

| Group                      | Artboards                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Brand                      | `Main` (overview and rationale), `MascotPoses`, `Logo`                                                                          |
| Brand system               | `Color`, `Typography`, `VoiceMotion`, `Tokens` (tokens → chart theme), `OgCard`                                                 |
| Components (Astro islands) | `Mascot`, `Logomark`, `Chart`, `LiveExample`, `SiteHeader`, `SiteFooter`, `ComparisonTable`, `ScrollStage`                      |
| Docs pages (desktop)       | `Landing` (scroll story), `LandingStory` (storyboard), `GettingStarted`, `Examples`, `Playground`, `Api`, `Plugins`, `NotFound` |
| Dark mode and mobile       | `LandingDark`, `MobileLanding`, `MobileDocs`, `MobilePlayground`, `MobileNotFound`                                              |

## Key decisions in the design

- **Mascot:** the same gentleman (top hat, moustache, red waistcoat, easel, hay fork), redrawn. All his colors are custom properties.
- **Palette:** cream becomes Paper, red becomes Waistcoat (`#C8102E`), yellow becomes Mustard (logo tile), warm gray becomes Ink.
- **Chart series colors:** unchanged from 1.5 (`--ct-series-a` … `-o`), plus an opt-in color-blind-safe theme (`.ct-theme-accessible`).
- **Typography:** Zilla Slab (display), Atkinson Hyperlegible Next (body), Atkinson Hyperlegible Mono (code). All are on Google Fonts.

## Notes for implementation

- **Chart rendering:** the `Chart` component draws charts with its own simplified math, as a mockup. The real site renders them with Chartist itself.
- **Landing page facts are placeholders.** The numbers (`[N]M` downloads, `[N]k` stars and dependents), the comparison values (`[MEASURED]`, `[LICENSE]`, `[DATE]`) and the "Trusted by" logos (`[LOGO n]`) must be filled from real sources at build time: npm and GitHub for the numbers, a measurement script and the libraries' own docs for the comparison. Logos only with the companies' permission.
