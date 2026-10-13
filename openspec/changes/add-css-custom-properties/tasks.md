# Tasks

## 1. Tests first

- [ ] 1.1 Build test: the compiled `dist/index.css` contains the custom properties with the 1.x fallbacks (series a–o, labels, grid, line, point, area, bar, donut); `dist/themes/accessible.css` keeps `light-dark()`.
- [ ] 1.2 Sass test: `$ct-line-width: 2px` changes the fallback; a property still overrides it.

## 2. Implementation

- [ ] 2.1 `index.scss`/`_settings.scss`: `var()` with fallbacks (D1, D2), `--ct-color` per series with the 1.x selectors (D3).
- [ ] 2.2 `themes/accessible.scss` (D4) and the build output in `dist/themes/` (D5), `exports` `./themes/*`.

## 3. Verification

- [ ] 3.1 Visual: the 67 1.5 baselines unchanged; new examples `styling/custom-properties` and `styling/accessible-theme` (manifest type `styling`, `v2`), baselines recorded and reviewed.
- [ ] 3.2 `test:api`/`test:smoke`: the theme subpath resolves; export lists.
- [ ] 3.3 Sizes (CSS budget), plan updated; full gate.
