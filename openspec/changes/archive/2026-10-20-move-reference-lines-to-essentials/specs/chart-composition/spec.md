## REMOVED Requirements

### Requirement: Target line layer

**Reason**: The layer moves to `@chartist-js/essentials`; see the `reference-lines` capability.
**Migration**: Import `targetLine` and `trendLine` from `@chartist-js/essentials` instead of `chartist`, and load `@chartist-js/essentials/styles.css`.

### Requirement: Trend line layer

**Reason**: The layer moves to `@chartist-js/essentials`; see the `reference-lines` capability.
**Migration**: Import `targetLine` and `trendLine` from `@chartist-js/essentials` instead of `chartist`, and load `@chartist-js/essentials/styles.css`.

### Requirement: Trend lines on transformed axes

**Reason**: Moves with `trendLine()` to the `reference-lines` capability; the axis transforms themselves stay in the core.
**Migration**: Import `targetLine` and `trendLine` from `@chartist-js/essentials` instead of `chartist`, and load `@chartist-js/essentials/styles.css`.
