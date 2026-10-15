# GitHub issues for this change

Drafts in Gion's voice (CLAUDE.local.md). Nothing here is posted without his go for that step.

## New issues

### [Bug]: Missing target element crashes again on a timer (#1504)

**Title:** `[Bug]: LineChart with a missing target crashes again later`

> `new LineChart('#missing', data)` throws "Target element "#missing" is not found", which is what it should do. But the first render was already scheduled, so a moment later it crashes again on the timer with "Cannot read properties of undefined (reading 'splice')". 1.5.0 does the same with "Container element is not found".
>
> The timer is set in a field initializer of `BaseChart`, which runs before the constructor checks the target. We should only schedule the first render once the check passed.

### [Bug]: lineChart() ignores the top-level referenceValue (#1505)

**Title:** `[Bug]: lineChart() ignores the top-level referenceValue`

> `referenceValue` is documented on `LineChartPresetOptions` (it comes from the shared options), but `lineChart()` and `LineChart` ignore it. With values from 5 to 8 and `referenceValue: 0`, the Y axis still starts at 5. `axisY: { referenceValue: 0 }` works.
>
> In 1.x it only ever worked for bar charts. I think we should apply it to the default Y axis of line charts too, with `axisY.referenceValue` winning, like `low` and `high` do for bars.

### Docs: three places that don't match what Chartist does (#1506)

**Title:** `Docs: three statements that don't match the code`

> A few things in the docs that are wrong:
>
> - "Coming from 1.x" says the classes still redraw when the window resizes. True, but they also follow their own container now.
> - The axes guide says `low` and `high` "fix the ends of the scale". The auto scale still rounds its ends out to a step (`high: 33` ends at 35). For exact ends you need `fixedScaleAxis()`.
> - The server rendering guide says the presets take `labels`. `lineChart()` and `barChart()` do, `pieChart()` has no such option, and the 1.x classes always draw HTML labels.

## Duplicates to close

- **#903:** "Closing in favor of #842, it's the same bug. The fix is on its way."
- **#1075:** "Closing in favor of #1038, same root cause: descending x values with the default smoothing."
- **#1424:** "Most of this works in 2.0.0-rc.1 already, rendering into a JSDOM element and `toScene()` without any DOM. The rest is tracked in #1492, so I'm closing this in favor of it."
