## ADDED Requirements

### Requirement: 0.x global surface for plugin scripts

Importing `chartist/compat` in a browser, from any of its builds (ES module, CommonJS, or the UMD build as a script), SHALL set up the global `Chartist` for plugin scripts: the library, compat, a `plugins` object to register on, `Line`, `Bar` and `Pie` as the 1.x `LineChart`, `BarChart` and `PieChart` classes, and the 0.x helper `getDataArray(data, reverse)`. It SHALL only add names the global lacks. Outside a browser it SHALL do nothing.

#### Scenario: A 0.x plugin script after a module import

- **WHEN** a page imports `chartist/compat` as a module, then a deferred plugin script sets `Chartist.plugins.ctPointLabels`
- **THEN** the script runs without errors, and a chart of that module's `lineChart` with the converted plugin draws its labels

#### Scenario: With the UMD build

- **WHEN** a page loads `index.umd.js`, then `compat.umd.js`, then a plugin script
- **THEN** the plugin registers on the same global `Chartist` and runs

#### Scenario: Registered plugins stay

- **WHEN** `Chartist.plugins` already has entries when compat is imported
- **THEN** they are kept

### Requirement: The global names stay off the exports

The names compat adds to the global SHALL NOT be exports of `chartist` or `chartist/compat`. The package SHALL declare the compat files, and only those besides stylesheets, as having side effects, so bundlers keep an import of `chartist/compat` and can still drop unused parts of the core.

#### Scenario: Not in the module exports

- **WHEN** code imports `chartist` or `chartist/compat` as modules
- **THEN** neither has `Line`, `Bar`, `Pie`, `plugins` or `getDataArray` exports

#### Scenario: Side effects declared

- **WHEN** a bundler reads the package's `sideEffects`
- **THEN** it lists the stylesheets and the compat files, and nothing else

### Requirement: One copy of Chartist on the global

When the global `Chartist` belongs to another copy of Chartist than the imported `chartist/compat` (for example the UMD build next to the modules), compat SHALL leave the global unchanged and SHALL warn in the console, since mixing copies breaks the plugins' type checks.

#### Scenario: UMD core and compat modules

- **WHEN** a page loads `index.umd.js` and then imports `chartist/compat` as a module
- **THEN** the global keeps only the UMD build's names, and the console shows a warning about another copy of Chartist

### Requirement: Converted plugins see their chart type

The chart object that a plugin converted with `fromLegacyPlugin` receives SHALL be an instance of the 1.x class for its chart type (`LineChart`, `BarChart` or `PieChart`), so a 0.x-style check such as `chart instanceof Chartist.Line` holds for a line chart when the 0.x names are loaded. For a `chart()` composition, which has no 1.x class, it SHALL be a plain object.

#### Scenario: Type check passes

- **WHEN** a plugin converted with `fromLegacyPlugin` checks `chart instanceof Chartist.Line` on `lineChart()`
- **THEN** the check is true, and false for `Chartist.Bar`

### Requirement: Converted plugins get the 1.x chart fields

The chart object of a converted plugin SHALL have `data` and `options` when the plugin installs, `options` resolved with the chart type's 1.x defaults (such as `classNames`), and `optionsProvider.getCurrentOptions()` returning the options in effect. On the functional API and on the 1.x classes, `chart.svg` SHALL be the chart's root element with the 1.x `Svg` API (such as `querySelectorAll`), set before the first `draw` event.

#### Scenario: Fields at install time

- **WHEN** a converted plugin reads `chart.data.series` and `chart.options.classNames.series` in its install function
- **THEN** both have the chart's values

#### Scenario: Svg helpers in draw

- **WHEN** a plugin calls `chart.svg.querySelectorAll('.ct-series')` in a `draw` or `created` listener, on either API
- **THEN** it gets the series groups of the chart

### Requirement: 0.x fields in the created payload

With compat, the payload of the `created` event SHALL also carry `bounds`, the value axis bounds (`min`, `max`, `range`, `step`, `values` as 0.x had them), next to the 1.x fields `chartRect`, `axisX`, `axisY`, `svg` and `options`.

#### Scenario: Target line from bounds

- **WHEN** a plugin draws a line at `chartRect.y1 - chartRect.height() / bounds.max * value` in a `created` listener
- **THEN** the line is drawn at that value of the Y axis

### Requirement: Community plugin contract test

A browser test SHALL run every plugin listed on the docs site's plugins page on v2, both converted with `fromLegacyPlugin` on the functional API and on the 1.x classes with compat, and SHALL check that each draws what it adds (labels, titles, legends, tooltips on hover) without errors. A plugin that can't run on v2 for a reason in its own code SHALL be listed with that reason, and SHALL NOT appear on the plugins page.

#### Scenario: All listed plugins run

- **WHEN** the contract test runs
- **THEN** every listed plugin draws its additions on both APIs without errors
