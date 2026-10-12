# Spec Delta

## Purpose

Detects any visual change in how Chartist renders charts by screenshotting every shared example and comparing it with a committed baseline recorded from Chartist 1.5.

## ADDED Requirements

### Requirement: Screenshot every example

The harness SHALL render every example in the manifest at each of its viewports and compare a screenshot of the chart with the committed baseline image. It SHALL fail when an image differs beyond the configured tolerance, or when a baseline image is missing.

#### Scenario: Unchanged rendering

- **WHEN** the harness runs against a build that renders like the baseline
- **THEN** all comparisons pass

#### Scenario: Changed rendering

- **WHEN** a change moves a grid line by one pixel in one example
- **THEN** that example's comparison fails, and the report contains the expected, actual and diff images

#### Scenario: New example without baseline

- **WHEN** an example is added without recording its baseline
- **THEN** the harness fails and names the example

### Requirement: Examples render as authored

The harness SHALL render each example's own `index.html` and `src/main.ts` without modifying the example files. The only additions it makes are the screenshot environment: a bundled test font, a fixed chart container size and the pinned viewport. No docs site styles or scripts SHALL be loaded, and no network resources SHALL be fetched.

#### Scenario: Docs restyling

- **WHEN** the docs site's styles change
- **THEN** no visual regression baseline changes

#### Scenario: Offline run

- **WHEN** the harness runs without network access
- **THEN** all examples render and are compared

### Requirement: Settled animations

Screenshots SHALL be taken after the chart is created and its animations have settled. SMIL animations SHALL be seeked to the example's settle time and paused. Timers that schedule re-renders SHALL NOT fire before the screenshot.

#### Scenario: Animated line example

- **WHEN** the harness screenshots an example that animates paths with SMIL
- **THEN** the screenshot shows the state at the example's settle time and is identical across runs

### Requirement: Selectable build under test

The harness SHALL resolve the `chartist` package of every example (scripts and stylesheet) to the local build by default. It SHALL also be able to resolve it to published Chartist 1.5.0, using the same examples and baseline.

#### Scenario: Verifying against 1.5.0

- **WHEN** the harness runs against published Chartist 1.5.0
- **THEN** all comparisons pass against the committed baseline

#### Scenario: Verifying the local build

- **WHEN** the harness runs against the local build of an unchanged 1.5 source tree
- **THEN** all comparisons pass against the same baseline

### Requirement: Baseline from 1.5

The committed baseline SHALL be recorded from published Chartist 1.5.0. Updating the baseline SHALL be an explicit command, and its changes SHALL be committed separately from library changes so each changed image can be reviewed.

#### Scenario: Recording the baseline

- **WHEN** the baseline update command runs against Chartist 1.5.0
- **THEN** one image per example and viewport is written to the baseline directory

### Requirement: Reproducible environment

The harness SHALL pin the browser version and the screenshot environment (viewport sizes, device scale factor, font, color scheme, reduced motion setting). It SHALL document which platform the committed baseline is authoritative for.

#### Scenario: Repeated runs

- **WHEN** the harness runs twice on the same platform without code changes
- **THEN** both runs produce the same results
