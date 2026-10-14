# Doc comments

The API reference at `/api/` (apps/docs) and the playground's hover and completions are generated from these comments, so they're the documentation readers see most. Write them like the guides (`apps/docs/WRITING.md`): plain, short, in the reader's terms.

## Rules

- **The first sentence says what it is or does.** It's the summary in lists, completions and hovers, so it must stand alone. Functions start with a verb ("Creates a line chart…", "Finds the nodes…"); types and properties with a noun phrase or a verb that says what setting it does ("Draws a point at each value.", "The value the areas close at, usually 0.").
- **Say what changes, not what the type says.** `showArea?: boolean` gets "Fills the area between each line and `areaBase`.", not "Whether to show the area."
- **Units and ranges:** px, degrees, `0` to `1`, clockwise from the top.
- **No defaults in the text** when the reference shows them from the code (the presets' options). Say what the default means if it isn't obvious ("usually 0").
- **The functional API.** Examples and references use `lineChart`, `chart()`, `Interpolation.cardinal()`. Never `new LineChart`, `Chartist.Line` or `Chartist.Interpolation`, except on the 1.x classes, which say so.
- **Code in backticks:** option names, values (`'accumulate'`, `true`), class names (`ct-line`).
- **Links:** `{@link lineChart}` to another export; the reference turns it into a link. Guides go in `@see`: `@see https://chartist.dev/docs/events-and-plugins/` is fine, but prefer a sentence in the comment.
- **Tags:** `@experimental` on the v2 API (until v2.0), `@deprecated` with what to use instead, `@example` with a fenced code block, `@param name what it is` when a parameter isn't obvious from its name and type, `@returns` when the return value needs a word.
- **Behavior only as it is.** If a comment would describe a bug, describe the current behavior and report the bug as a GitHub issue labeled `v2`, instead of fixing it in the same change.

## What needs a comment

The reference's check (`pnpm nx run docs:test`) fails when:

- a v2 export, or a member of a v2 interface or option type (and the members of nested option objects of the presets), has no comment;
- an export on the 1.x page or among the helpers has no one-line comment (their members don't need one);
- a `{@link}` or a type reference points at something that isn't exported.

## Examples

```ts
/**
 * Moves the labels away from the center (positive) or toward it
 * (negative), in px.
 */
labelOffset?: number;

/**
 * How a line runs between its points: `true` smooths it with
 * `Interpolation.monotoneCubic`, `false` draws straight segments
 * (`Interpolation.none`), or pass an interpolation such as
 * `Interpolation.cardinal()`, `Interpolation.step()` or your own.
 */
lineSmooth?: boolean | LineInterpolation;

/** The data of a line chart: series of values, and labels for the X axis. */
export type LineChartData = Data<(Series | SeriesObject)[]>;
```

## No plan references

Comments describe the code as it is and say why in words. They don't name OpenSpec changes, design decision ids (a D with a number), task or finding numbers: those get archived and mean nothing to the next reader. GitHub issue numbers are fine ("see #1469"), they last.
