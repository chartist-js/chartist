## ADDED Requirements

### Requirement: Styles for markup without inline styles

Chartist's stylesheet SHALL lay out hydration markup, which has no inline styles, as a chart drawn in the page looks:

- an HTML label's span fills its `foreignObject`, whose `width` and `height` attributes are the label's box;
- the default donut width applies only to donut slices without a `stroke-width` attribute, so a slice's `stroke-width` attribute, written for `donutWidth`, decides.

The rules SHALL NOT change how a chart drawn by `chart()`, a preset or a 1.x class looks, since their inline styles take precedence.

#### Scenario: Label box from the foreignObject

- **WHEN** a page with Chartist's stylesheet shows a label `foreignObject` 47.3 px wide and 20.6 px high whose span has no inline style
- **THEN** the span is 47.3 × 20.6 px and aligned within it as an inline-styled label span

#### Scenario: Donut width from the attribute

- **WHEN** a donut slice has `stroke-width="20"` and no inline style
- **THEN** its stroke width is 20 px, and a slice without the attribute gets the default width

#### Scenario: Charts look the same

- **WHEN** the visual tests run after adding the rules
- **THEN** every existing screenshot matches
