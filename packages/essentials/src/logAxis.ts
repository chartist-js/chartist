import {
  getMultiValue,
  type AxisContext,
  type AxisFactory,
  type AxisTransform,
  type NormalizedSeriesPrimitiveValue,
  type ScaleAxis
} from 'chartist';

/** Options of {@link logAxis}. */
export interface LogAxisOptions {
  /**
   * The base of the logarithm: the ticks are its powers. Any finite number
   * above 1, such as 2 for a scale that doubles; default 10.
   */
  readonly base?: number;
  /**
   * Draws minor grid lines between the ticks, without labels: at 2 to 9
   * times each power for base 10, or at the powers left out when the ticks
   * skip some. Style them with `--ct-grid-minor-*`.
   */
  readonly minorTicks?: boolean;
}

/** A number without float noise: `0.30000000000000004` is `0.3`. */
const exact = (value: number) => Number(value.toPrecision(15));

/**
 * The exponent of a value in a base, snapped to a whole number when it's
 * one but for float noise (log10(1000) is 2.9999999999999996).
 * @internal
 */
export function exponentOf(value: number, base: number): number {
  const exponent = Math.log(value) / Math.log(base);
  const whole = Math.round(exponent);
  return Math.abs(exponent - whole) < 1e-9 ? whole : exponent;
}

/**
 * The range of a log axis without `low` and `high`: from the largest power
 * at or below the smallest value to the smallest power at or above the
 * largest, one power further each way when both are the same, and 1 to
 * the base without values. `values` are positive.
 * @internal
 */
export function logRange(
  values: readonly number[],
  base: number
): { min: number; max: number } {
  if (values.length === 0) {
    return { min: 1, max: base };
  }
  let low = Math.floor(exponentOf(Math.min(...values), base));
  let high = Math.ceil(exponentOf(Math.max(...values), base));
  if (low === high) {
    low -= 1;
    high += 1;
  }
  return { min: exact(base ** low), max: exact(base ** high) };
}

/**
 * The ticks and minor ticks of a log axis from `min` to `max`, `length` px
 * long: the powers of the base, every nth when they're closer than
 * `minSpace`, at the exponents divisible by n; the whole multiples of the
 * powers when the range holds fewer than two powers. Minor ticks are the
 * multiples between the powers, or the powers left out.
 * @internal
 */
export function logTicks(
  min: number,
  max: number,
  base: number,
  length: number,
  minSpace: number
): { ticks: number[]; minor: number[] } {
  const span = Math.log(max / min);
  const px = (value: number) => (length * Math.log(value / min)) / span;
  const inside = (value: number) =>
    value >= min * (1 - 1e-12) && value <= max * (1 + 1e-12);
  const first = Math.floor(exponentOf(min, base));
  const last = Math.ceil(exponentOf(max, base));
  // Whole multiples of each power in range, the power itself included.
  const multiples: number[] = [];
  for (let k = first; k <= last; k++) {
    for (let m = 1; m < base; m++) {
      const value = exact(m * base ** k);
      if (inside(value)) {
        multiples.push(value);
      }
    }
  }
  const powers = multiples.filter(value =>
    Number.isInteger(exponentOf(value, base))
  );

  if (powers.length < 2) {
    // Inside a power: multiples, each at least minSpace px after the last.
    const ticks: number[] = [];
    const minor: number[] = [];
    for (const value of multiples) {
      const previous = ticks[ticks.length - 1];
      (previous === undefined || px(value) - px(previous) >= minSpace
        ? ticks
        : minor
      ).push(value);
    }
    return { ticks, minor };
  }

  const every = Math.max(
    1,
    Math.ceil(minSpace / ((length * Math.log(base)) / span))
  );
  if (every === 1) {
    return {
      ticks: powers,
      minor: multiples.filter(value => !powers.includes(value))
    };
  }
  const shown = (value: number) => exponentOf(value, base) % every === 0;
  return {
    ticks: powers.filter(shown),
    minor: powers.filter(value => !shown(value))
  };
}

/**
 * Creates a logarithmic axis, for values that span several orders of
 * magnitude: each power of the base (1, 10, 100, … for base 10) is the
 * same distance from the next, so growth by a factor looks the same
 * everywhere. It goes in the `type` of a preset's `axisX` or `axisY`, or
 * of an axis of `cartesianAxes()`.
 *
 * Without `low` and `high`, the range runs from the power at or below the
 * smallest value to the power at or above the largest; the axis's own
 * `low` and `high` set it exactly. The ticks are the powers, every second
 * or third when they'd be closer than `scaleMinSpace`; the axis's `ticks`
 * replace them. Zero and negative values have no place on a log scale:
 * they don't count towards the range and are drawn at the start of the
 * axis, so a bar for zero has no length. Use `null` for a gap.
 *
 * Trend lines on a log axis are fitted to the logarithms of the values,
 * so they're straight on the axis: an exponential trend on a log Y axis.
 *
 * @example
 * ```ts
 * import { lineChart } from 'chartist';
 * import { logAxis } from '@chartist-js/essentials';
 *
 * lineChart(
 *   '#chart',
 *   {
 *     labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
 *     series: [[120, 980, 4100, 36000, 210000, 850000]]
 *   },
 *   {
 *     axisY: {
 *       type: logAxis({ minorTicks: true }),
 *       labelTransform: value => value.toLocaleString('en-US')
 *     }
 *   }
 * );
 * ```
 * @param options The base and whether to draw minor grid lines.
 */
export function logAxis(options: LogAxisOptions = {}): AxisFactory {
  const { base = 10, minorTicks = false } = options;
  if (!Number.isFinite(base) || base <= 1) {
    throw new Error(
      `Chartist: logAxis needs a base that's a finite number above 1, not ${base}`
    );
  }
  const ln = Math.log(base);
  const transform: AxisTransform = {
    forward: value => Math.log(value) / ln,
    inverse: value => base ** value
  };

  const create = (context: AxisContext): ScaleAxis => {
    const { dimension, series, area, extent } = context;
    const axisOptions = context.options;
    for (const name of ['low', 'high'] as const) {
      const value = axisOptions[name];
      if (value !== undefined && !(value > 0)) {
        throw new Error(
          `Chartist: logAxis needs a ${name} above 0, not ${value}`
        );
      }
    }
    const values = [
      ...series.flatMap(seriesValues =>
        seriesValues.map(value =>
          getMultiValue(value as NormalizedSeriesPrimitiveValue, dimension)
        )
      ),
      extent?.low,
      extent?.high,
      axisOptions.highLow?.low,
      axisOptions.highLow?.high
    ].filter(
      (value): value is number =>
        typeof value === 'number' && value > 0 && Number.isFinite(value)
    );
    const fitted = logRange(values, base);
    const min = axisOptions.low ?? fitted.min;
    let max = axisOptions.high ?? fitted.max;
    if (max <= min) {
      max = exact(min * base);
    }
    const length = dimension === 'x' ? area.x2 - area.x1 : area.y1 - area.y2;
    const span = Math.log(max / min);
    const computed = logTicks(
      min,
      max,
      base,
      length,
      axisOptions.scaleMinSpace || 20
    );
    const ticks = axisOptions.ticks
      ? axisOptions.ticks.filter(tick => Number(tick) > 0)
      : computed.ticks;
    return {
      dimension,
      kind: 'log',
      transform,
      ticks,
      ...(minorTicks && {
        minorTicks: computed.minor.filter(value => !ticks.includes(value))
      }),
      range: { min, max },
      length,
      project: value => {
        const number = Number(
          getMultiValue(value as NormalizedSeriesPrimitiveValue, dimension)
        );
        return number > 0 ? (length * Math.log(number / min)) / span : 0;
      }
    };
  };

  return { kind: 'log', transform, create };
}
