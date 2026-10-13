## MODIFIED Requirements

### Requirement: Brand design system

The site SHALL implement the design tokens and components of `docs/visual-design` (palette, semantic tokens for light and dark, typography, spacing, radii, shadows, motion). The tokens SHALL be defined once as CSS custom properties and exposed as the Tailwind theme, and components SHALL be styled with Tailwind utilities from that theme. Animations, scroll timelines, the chart theme (`--ct-*`) and styles for generated HTML (MDX prose, code highlighting, the editor) SHALL stay plain CSS. Fonts SHALL be self-hosted; pages SHALL make no requests to third-party hosts.

#### Scenario: No third-party requests

- **WHEN** any page of the built site loads
- **THEN** every request goes to the site's own origin

#### Scenario: One source for colors

- **WHEN** a token in `tokens.css` changes
- **THEN** every utility class that uses it changes with it, in light and dark mode, without editing components

## ADDED Requirements

### Requirement: Site screenshot comparison

The site SHALL have a target that captures the landing sections, Getting started and the 404 page at a desktop and a phone width, in light and dark mode, with motion settled, and compares them with a baseline taken on demand, reporting each differing screenshot with before, after and diff images.

#### Scenario: A style change shows up

- **WHEN** a change alters how a section looks and the comparison runs against the baseline from before the change
- **THEN** the report lists that section's screenshots with their differences, and unchanged sections are not listed
