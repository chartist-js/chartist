## MODIFIED Requirements

### Requirement: Size budgets

The build SHALL be checked against gzip size budgets for at least: the browser ESM build, the UMD build, a tree-shaken import of each chart type (`LineChart`, `BarChart`, `PieChart`), the browser ESM build of `chartist/live` without the core, a tree-shaken import of `liveDomRenderer` alone and with `smilAnimations`, and the minified CSS. The check SHALL fail when a file exceeds its budget.

#### Scenario: Budget exceeded

- **WHEN** a change makes `dist/index.min.js` larger than its gzip budget
- **THEN** the size check target fails and reports the file and the overshoot

#### Scenario: Live updates stay out of the core

- **WHEN** the size check measures a tree-shaken import of `lineChart` from `chartist`
- **THEN** its size grows by at most 0.65 kB gzipped over rc.3 (13.65 kB), and it contains none of the live renderer's code

#### Scenario: Hydration stays mostly out of the core

- **WHEN** the size check measures a tree-shaken import of `lineChart` from `chartist` after hydration is added
- **THEN** it is at most 0.3 kB gzipped larger than in 2.0.0 (14.28 kB), and it contains none of the code that adopts markup, which ships with `chartist/live`
