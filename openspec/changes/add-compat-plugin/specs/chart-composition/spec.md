# Spec Delta

## ADDED Requirements

### Requirement: Detaching a chart

The chart handle SHALL provide `detach()`, which stops reacting to container size changes and media queries but keeps the rendered output and the listeners. `destroy()` SHALL additionally remove the output and the listeners.

#### Scenario: Detached chart stays visible

- **WHEN** `detach()` is called and the container is resized afterwards
- **THEN** the chart output stays in the container and is not rendered again
