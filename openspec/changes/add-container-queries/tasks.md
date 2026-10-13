# Tasks

## 1. Tests first

- [ ] 1.1 Unit: `watchResponsive` with a fake `matchContainer` and fake `matchMedia`: merge order of mixed entries, change detection (no event without a set change), `change` events, `stop()`.
- [ ] 1.2 Unit: missing API (one warning per page, entries don't match), rejected condition (error names it), no DOM (no warning).

## 2. Implementation

- [ ] 2.1 `responsive/` module: `container()`, `watchResponsive()`, the probe element (D3).
- [ ] 2.2 Presets on the shared module: entries of both kinds, `responsive` events as before; `PresetChart` drops container entries.
- [ ] 2.3 `chart()`: `responsive` overrides, the re-evaluation on resize collapsed with the layout render, `responsive` event, `update()` and `destroy()`.

## 3. Verification

- [ ] 3.1 `test:api`: the delta scenarios, export lists (`container`, `ContainerCondition`).
- [ ] 3.2 Visual: `composed/container-queries` (two container widths, `match-container` as a dev dependency), baseline recorded from v2 and reviewed.
- [ ] 3.3 Parity suites and the 1.5 baselines unchanged (media query behavior of presets and classes).
- [ ] 3.4 Plan: "Standards to monitor" entry, docs requirement, sizes; full gate.
