## Why

Target lines (a goal, a limit, an average) and bands (a range the values should stay in, or the spread of a group, as in the [band chart](https://www.clearlyandsimply.com/2011/04/an-underrated-chart-type-the-band-chart/)) are among the most common additions to line and bar charts. 1.x left them to plugins, and the docs list one of those plugins, `chartist-plugin-targetline`. It only does horizontal lines, places them by the axis maximum (so the axis has to start at zero), runs only in the browser, and has no labels. Bands between two series can't be drawn at all, because a line's area always fills down to a constant `areaBase`. The layer model in v2 makes both small additions to the core.

Today the presets can't take extra layers, so anything beyond what the 1.x options draw means switching from `lineChart()` to `chart()`. Opening the presets to extra layers lets preset users add target lines and bands, and any custom layer, without that switch.

## What Changes

- **`targetLine()` layer:** draws a line across the chart area at a constant value on an axis (horizontal on a Y axis, vertical on an X axis), with an optional label and class. Several lines are several layers. The axis widens to include the value.
- **`band()` layer:** fills the area between a low and a high edge. Each edge is a constant value, values of its own (one per label, outside the chart's data), or a series by name or index; or `series` names a group of series and the band covers their minimum to their maximum at each X. Edges can be smooth like lines, and the band can line up with bars (`align: 'center'`). With `mark: true`, points and bars of the other layers get `ct-in-band` or `ct-out-band`, so CSS can style values inside and outside the band.
- **Layer refinement:** layers get an optional `refine` method. Once every layer has composed its nodes, `refine` sees each node with a role, from all layers, and may return it changed, for example with a class added. It runs before the `compose` events, so plugins see the refined nodes and keep the last word. It's a layer method within the `compose` phase, not a new phase or event. Charts without a refining layer skip it entirely. The band's `mark` option is built on it.
- **Preset `layers` option:** `lineChart`, `barChart` and `pieChart` take `layers: { below, above }`, extra layers drawn below the chart's series (above the grid) or above them (below the axis labels). Responsive options can change them.
- **Styles:** the default stylesheet styles target lines, their labels and bands with custom properties (`--ct-target-line-*`, `--ct-band-*`). A band or a line with a `ct-series-<letter>` class takes that series' color.
- **Scene roles:** `targetLine`, `targetLabel` and `band` join `NodeRoles`, with their contexts, so `compose` listeners and plugins can find and change them.
- **Terminal rendering:** `@chartist/terminal` shades bands like areas (below the grid) and draws target lines and their labels.
- **Docs:**
  - a new guide, "Target lines and bands", with live examples: a target line on a bar chart preset, and a band chart (min to max of a group, the average and one highlighted series);
  - the composed charts page lists the new layers; the line and bar chart pages mention the preset `layers` option;
  - gallery examples for both layers, with visual baselines.
- **Plugin list:** `chartist-plugin-targetline` is removed from the plugins page (its entry, example, served files, facts and e2e contract case, and its docs dependency). Its page `/plugins/chartist-plugin-targetline/` is live on chartist.dev, so it redirects to the new guide.
- **Terminal plugin guide:** the example that teaches plugins with a hand-made target line uses `targetLine()` for the line, and its plugin marks the points above the target instead.

## Breaking changes vs 1.x

None. The additions are new exports, an optional layer method and a new optional preset option; the 1.x classes and options are unchanged. Removing a third-party plugin from the docs list changes no library behavior.

## Out of scope

- Threshold coloring (splitting lines and bars at a value, as `chartist-plugin-threshold` does). It stays a listed plugin. For the same reason, `mark` classes whole points and bars but doesn't split a line where it crosses a band edge.
- A dependency order between layers. Layers compose independently, and refiners run in list order.
- Looking up further nodes while refining one. `refine` gets every node of every layer, but one at a time: while it refines a point, it can't look at the neighboring point or the line it belongs to. The context can gain such a lookup later without changing the signature.
- Value labels on points and bars, error bars, and range bars.
- Bands and target lines in polar charts (on pies).
- Target lines at positions computed from the data (an average line computed by the layer). The value is given; computing it is one line of user code.
- Adding `layers` to the 1.x classes (`new LineChart(...)`). New features are in the functional API.
- Removing or replacing other plugins in the list.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chart-composition`: new `targetLine()` and `band()` layers (with `mark`), layer refinement, and the presets' `layers` option.
- `chart-pipeline`: the `compose` events fire after all layers have composed and refined, on the refined nodes.
- `scene-graph`: the `targetLine`, `targetLabel` and `band` roles.
- `chart-theming`: default styles for target lines, labels and bands, and series colors for them.
- `terminal-rendering`: bands shaded like areas; target lines and labels drawn.
- `docs-site`: the "Target lines and bands" guide, and the redirect for the removed plugin's page.

## Impact

- `packages/chartist`:
  - `src/layers/targetLine.ts` and `src/layers/band.ts`, exported from `src/layers/index.ts` and the root entry;
  - `src/scene/roles.ts` (new roles and contexts);
  - `src/pipeline/` (`Layer.refine`, and composing all layers before one walk that refines and emits the `compose` events);
  - `src/presets/` (the `layers` option in all three presets);
  - `src/styles/` (new classes and custom properties);
  - the recorded export and type lists, the type contract tests, and the API reference.
- `packages/terminal`: `src/draw.ts` fills the `band` role.
- `packages/examples`: two new gallery examples.
- `apps/docs`:
  - the new guide and its examples, the composed, line and bar chart pages, and the docs navigation;
  - `src/data/plugins.ts`, `plugin-files.json`, `facts.json`, `src/examples/plugins/targetline/`, `e2e/plugin-contract.spec.ts`, `package.json` (drops `chartist-plugin-targetline`);
  - a redirect for `/plugins/chartist-plugin-targetline/`;
  - the terminal plugins guide and its example.
- No new dependencies.
