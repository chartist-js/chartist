## MODIFIED Requirements

### Requirement: Window media query mode

By default, responsive options SHALL be pairs of a media query string and an options object. All matching pairs are merged in order over the base options, as in 1.x, and re-evaluated when a query's match state changes. Queries SHALL be matched against the window of the chart's container.

#### Scenario: 1.x responsive options

- **WHEN** a chart has responsive options `[['screen and (max-width: 640px)', { showPoint: false }]]` and the viewport shrinks below 641 px
- **THEN** the chart re-renders without points, and an options change is reported to listeners

#### Scenario: Container in an iframe

- **WHEN** a chart's container is in an iframe 500 px wide inside a 1200 px window, with responsive options for `(max-width: 640px)`
- **THEN** the override applies
