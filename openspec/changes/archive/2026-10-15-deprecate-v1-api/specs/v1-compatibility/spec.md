## MODIFIED Requirements

### Requirement: 1.x exports remain available

Every export of the 1.5 package root SHALL remain exported from `chartist` under the same name, and from the UMD global `Chartist`, with its 1.5 behavior. This includes `Svg`, `SvgList`, `SvgPath`, `easings`, `Interpolation`, the axis classes, `EventEmitter` and the helper functions. These exports SHALL work without the compat plugin. Bundles that don't import them SHALL NOT contain them. Throughout 2.x, this holds for the deprecated names too.

#### Scenario: Standalone Svg usage

- **WHEN** code imports `Svg` from `chartist` and builds its own SVG with `new Svg('svg').elem('circle', { r: 5 }).animate(...)`, without any chart or compat plugin
- **THEN** it works as in 1.5

#### Scenario: Export surface check

- **WHEN** the package is built
- **THEN** a test confirms that every 1.5 root export name exists in the ESM, CJS and UMD builds

#### Scenario: Shared Svg in draw handlers

- **WHEN** a 1.x draw handler with the compat plugin calls `data.element.replace(new Svg('circle', {...}))` using `Svg` imported from `chartist`
- **THEN** the replacement works and `data.element instanceof Svg` is true

## ADDED Requirements

### Requirement: Deprecated 1.x names

The declarations of `chartist` SHALL mark each 1.x-only export as deprecated, with a message naming the functional replacement and saying it's removed in 3.0. 1.x-only means the functional API neither uses the name in its signatures nor documents it for plugins, custom layers or data. The deprecation SHALL NOT change runtime behavior or log anything.

#### Scenario: Editor hint

- **WHEN** code imports `LineChart` and `LineChartOptions` from `chartist`
- **THEN** the TypeScript language service reports both as deprecated, the hover of `LineChart` names `lineChart()`, and the hover of `LineChartOptions` names `LineChartPresetOptions`

#### Scenario: Shared names stay unmarked

- **WHEN** functional code imports `lineChart`, `LineChartData`, `Interpolation`, `Svg`, `easings` or `getMultiValue` from `chartist`
- **THEN** the language service reports no deprecation

#### Scenario: Functional types built from 1.x types

- **WHEN** functional code uses `LineChartPresetOptions`, which is built from the 1.x `LineChartOptions`
- **THEN** the language service reports no deprecation for it or its properties

#### Scenario: Runtime unchanged

- **WHEN** 1.x code using the deprecated names runs
- **THEN** it behaves as before and logs nothing about the deprecation

### Requirement: Deprecated names stay through 2.x

The names deprecated on `chartist` SHALL stay exported from `chartist` and the UMD global throughout 2.x. 3.0 SHALL remove them from `chartist`.

#### Scenario: A 2.x minor release

- **WHEN** a 2.x release is prepared
- **THEN** the export surface test still finds every deprecated name in the ESM, CJS and UMD builds

### Requirement: 1.x event and plugin types from compat

`chartist/compat` SHALL export the types of the 1.x events and plugins it turns on (the draw, created, data and options-changed event payloads and `Plugin`), not marked deprecated, so code using the 1.x events on the functional API imports them from where it turns them on.

#### Scenario: Typing a 1.x draw listener

- **WHEN** functional code with the compat plugin imports `PointDrawEvent` from `chartist/compat` and types a `draw` listener with it
- **THEN** it compiles without a deprecation hint
