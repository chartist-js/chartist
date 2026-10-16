# Tasks

## 1. Library

- [x] 1.1 Add `labelTransform` to `AxisOptions` and `PieChartOptions` with doc comments, and mark `labelInterpolationFnc` `@deprecated` pointing to it. Verify: `pnpm nx typecheck chartist`
- [x] 1.2 Add the internal resolver (`labelTransform ?? labelInterpolationFnc ?? identity`), use it in `layers/axes.ts` and `layers/pie.ts`, rename the `DrawnAxisOptions` field in `scales/grid.ts`, and drop the identity defaults from the preset defaults. Verify: unit tests for each scenario of the "Label transform option" requirement (new name, both names, pie labels, responsive override), and `pnpm nx test chartist --skip-nx-cache`
- [x] 1.3 Check 1.x output is unchanged. Verify: `pnpm nx run chartist:test:api --skip-nx-cache`, `chartist:test:api:v1` and `chartist:test:visual` all pass without changed images
- [x] 1.4 Type tests: `labelTransform` is accepted on preset axes, `cartesianAxes()` axes and `pieChart`, and the deprecation tag is in `index.d.ts` and `index.d.cts`. Verify: `pnpm nx run chartist:test:api --skip-nx-cache`

## 2. Packages, docs and examples

- [ ] 2.1 Switch `packages/terminal` and the examples' `main.ts` files to `labelTransform`; leave `main.classic.ts` as is. Verify: `pnpm nx run-many -t typecheck test -p terminal examples --skip-nx-cache` and the visual tests unchanged
- [ ] 2.2 Switch the guides (axes and scales, pie and donut, responsive, composed charts, the terminal pages) and add the rename to "Coming from 1.x". Verify: `pnpm nx run docs:check` (samples) and `pnpm nx e2e docs`
