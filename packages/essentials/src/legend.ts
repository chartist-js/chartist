import {
  alphaNumerate,
  node,
  textAscent,
  type Area,
  type AxisSide,
  type InsetContext,
  type Layer,
  type MeasureText,
  type PreparedData,
  type SceneNode
} from 'chartist';

/** The context of a `legendItem` node: one entry of the legend. */
export interface LegendItemContext {
  /**
   * The series' index in the chart's data, which gives the entry its
   * class (`ct-series-a`, `-b`, …); for pie data, the value's index.
   */
  readonly seriesIndex: number;
  /** Always absent: the entry stands for the whole series. */
  readonly valueIndex?: undefined;
  /** The series as given in the data; for pie data, the value. */
  readonly series: unknown;
  /** The name the entry shows. */
  readonly name: string;
  /** The side of the chart the legend is on. */
  readonly side: AxisSide;
}

declare module 'chartist' {
  interface NodeRoles {
    /**
     * An entry of a `legend()` layer: a `g` (class `ct-legend-item`) with
     * its series' class, holding the marker and the name.
     */
    legendItem: { ctx: LegendItemContext; attrs: object };
  }
}

/** Options of {@link legend}. */
export interface LegendOptions {
  /**
   * The side of the chart the legend is on: `top` (the default),
   * `right`, `bottom` or `left`.
   */
  readonly side?: AxisSide;
  /**
   * Where the legend sits along its side: at the start (the left on the
   * top and bottom, the top on the left and right), in the middle (the
   * default) or at the end.
   */
  readonly align?: 'start' | 'middle' | 'end';
  /**
   * The series to list, by index or name, in the chart's order; for pie
   * data, the values by index. Default: every series with a name.
   */
  readonly series?: readonly (number | string)[];
  /** Space between the legend and the chart, in px (default 8). */
  readonly gap?: number;
  /**
   * Replace the classes: `legend` (`ct-legend`), `item`
   * (`ct-legend-item`), `marker` (`ct-legend-marker`) and `label`
   * (`ct-legend-label`).
   */
  readonly classNames?: {
    readonly legend?: string;
    readonly item?: string;
    readonly marker?: string;
    readonly label?: string;
  };
}

const SIDES = ['top', 'right', 'bottom', 'left'];
const ALIGNS = ['start', 'middle', 'end'];

/** The marker's diameter, in ems of the entry's name. */
const MARKER = 0.8;
/** The space between a marker and its name, in ems. */
const SPACE = 0.4;
/** The space between the entries of a row, in ems. */
const SPACING = 1.25;

/** A series the legend lists. */
interface Entry {
  readonly seriesIndex: number;
  readonly series: unknown;
  readonly name: string;
  readonly className?: string;
}

/** The entries measured: their widths and the size of their lines. */
interface Measured {
  readonly entries: readonly Entry[];
  readonly widths: readonly number[];
  readonly lineHeight: number;
  readonly fontSize: number;
}

/** A name to show, or `undefined` for none. */
const nameOf = (value: unknown) =>
  value === undefined || value === null || value === ''
    ? undefined
    : String(value);

/**
 * The series of the data with a name, as the chart's layers draw them:
 * each series, or each value of pie data, named by its `name` or else by
 * its label.
 */
function entriesOf(data: PreparedData): Entry[] {
  if (data.flat) {
    return data.series[0].values.flatMap((value, seriesIndex) => {
      const own = (value ?? {}) as { name?: unknown; className?: unknown };
      const name = nameOf(own.name) ?? nameOf(data.labels[seriesIndex]);
      return name === undefined
        ? []
        : [
            {
              seriesIndex,
              series: value,
              name,
              className: nameOf(own.className)
            }
          ];
    });
  }
  return data.series.flatMap((series, seriesIndex) => {
    const name = nameOf(series.name);
    return name === undefined
      ? []
      : [
          {
            seriesIndex,
            series: {
              name: series.name,
              className: series.className,
              meta: series.meta,
              data: series.values
            },
            name,
            className: series.className
          }
        ];
  });
}

/**
 * Puts the entries of the given widths in rows of at most `width` px,
 * in order; an entry wider than a row gets a row of its own.
 */
function wrap(widths: readonly number[], spacing: number, width: number) {
  const rows: number[][] = [];
  let used = 0;
  widths.forEach((size, index) => {
    const row = rows.at(-1);
    if (row && used + spacing + size <= width) {
      row.push(index);
      used += spacing + size;
    } else {
      rows.push([index]);
      used = size;
    }
  });
  return rows;
}

/**
 * The width `wrap()` needs to fit the entry `next` after a row, added up in
 * `wrap()`'s own order: text widths are fractional, and another order can
 * round to a width that still doesn't fit.
 */
const reach = (
  row: readonly number[],
  next: number,
  widths: readonly number[],
  spacing: number
) =>
  row
    .slice(1)
    .reduce((used, index) => used + (spacing + widths[index]), widths[row[0]]) +
  spacing +
  widths[next];

/** The width of a row of entries, spacing included. */
const rowWidth = (
  row: readonly number[],
  widths: readonly number[],
  spacing: number
) =>
  row.reduce((sum, index) => sum + widths[index], 0) +
  spacing * (row.length - 1);

/**
 * Creates a layer that draws a legend on one side of the chart: a marker
 * in the series' color and the name of each named series, or of each
 * value of a pie chart, named by its label. It reads the names from the
 * chart's data and gives each entry its series' class, so the legend
 * follows `update()`, responsive options and the stylesheet's series
 * colors without being told. Series without a name are left out but keep
 * their color.
 *
 * The layer reserves the room the legend needs, so the drawing area
 * shrinks and the legend never overlaps the axis labels. On the top and
 * bottom, the entries wrap into rows as wide as the drawing area; on the
 * left and right, they stand in a column. Each entry is a `g` with the
 * classes `ct-legend-item` and its series' class (`ct-series-a`, or the
 * series' `className`), holding a `circle.ct-legend-marker` and a
 * `text.ct-legend-label`, styled with `--ct-color`,
 * `--ct-legend-label-color` and `--ct-legend-label-size` from
 * `@chartist-js/essentials/styles.css`.
 *
 * @example
 * ```ts
 * import { lineChart } from 'chartist';
 * import { legend } from '@chartist-js/essentials';
 * import 'chartist/styles.css';
 * import '@chartist-js/essentials/styles.css';
 *
 * lineChart(
 *   '#chart',
 *   {
 *     labels: ['Mon', 'Tue', 'Wed'],
 *     series: [
 *       { name: 'Tea', data: [5, 6, 4] },
 *       { name: 'Coffee', data: [8, 9, 7] }
 *     ]
 *   },
 *   { layers: { above: [legend({ side: 'bottom' })] } }
 * );
 * ```
 */
export function legend(options: LegendOptions = {}): Layer {
  const { side = 'top', align = 'middle', gap = 8 } = options;
  const fail = (what: string, value: unknown) => {
    throw new Error(
      `Chartist: layer "legend" got ${JSON.stringify(value)} for ${what}`
    );
  };
  if (!SIDES.includes(side)) {
    fail('side', side);
  }
  if (!ALIGNS.includes(align)) {
    fail('align', align);
  }
  if (!(gap >= 0 && gap < Infinity)) {
    fail('gap', gap);
  }
  const classNames = {
    legend: 'ct-legend',
    item: 'ct-legend-item',
    marker: 'ct-legend-marker',
    label: 'ct-legend-label',
    ...options.classNames
  };
  const horizontal = side === 'top' || side === 'bottom';
  const near = side === 'top' || side === 'left';
  const groupClasses = `${classNames.legend} ${
    horizontal ? 'ct-horizontal' : 'ct-vertical'
  } ${near ? 'ct-start' : 'ct-end'}`;

  const selected = (entry: Entry) =>
    !options.series ||
    options.series.some(selector =>
      typeof selector === 'number'
        ? selector === entry.seriesIndex
        : selector === entry.name
    );

  const measure = (data: PreparedData, measureText: MeasureText): Measured => {
    const entries = entriesOf(data).filter(selected);
    const metrics = entries.map(entry =>
      measureText(entry.name, { classes: [classNames.label] })
    );
    const fontSize = metrics[0]?.fontSize ?? 12;
    return {
      entries,
      widths: metrics.map(metric => fontSize * (MARKER + SPACE) + metric.width),
      lineHeight: Math.max(fontSize, ...metrics.map(metric => metric.height)),
      fontSize
    };
  };

  /** The width the rows can take before the axes exist: the area's. */
  const rowRoom = ({ width, padding, axes }: InsetContext) =>
    axes.reduce(
      (room, axis) =>
        axis.side === 'left' || axis.side === 'right'
          ? room - (axis.offset || 0)
          : room,
      width - padding.left - padding.right
    );

  /** Draws one entry with its row's or column's top-left corner. */
  const entryNode = (
    entry: Entry,
    x: number,
    y: number,
    { lineHeight, fontSize }: Measured
  ): SceneNode => {
    const r = (MARKER * fontSize) / 2;
    const middle = y + lineHeight / 2;
    const textX = x + (MARKER + SPACE) * fontSize;
    const textY = middle + (textAscent - 0.5) * fontSize;
    const classes = `${classNames.item} ${
      entry.className || `ct-series-${alphaNumerate(entry.seriesIndex)}`
    }`;
    return node('g', {}, classes, {
      role: 'legendItem',
      ctx: {
        seriesIndex: entry.seriesIndex,
        series: entry.series,
        name: entry.name,
        side
      }
    })
      .append(node('circle', { cx: x + r, cy: middle, r }, classNames.marker))
      .append(
        node(
          'text',
          { x: textX, y: textY, 'text-anchor': 'start' },
          classNames.label
        ).text(entry.name)
      );
  };

  /** Where a block of `size` px starts along a box from `from` to `to`. */
  const along = (from: number, to: number, size: number) =>
    align === 'start'
      ? from
      : align === 'end'
        ? to - size
        : (from + to - size) / 2;

  /** The entries of each row in a top or bottom box, by index. */
  const rowsIn = (box: Area, measured: Measured) => {
    const spacing = SPACING * measured.fontSize;
    const { widths, lineHeight } = measured;
    // The room inset() reserved holds this many rows. When other layers
    // took room on the left or right since, the area is narrower than
    // the rows were made for: widen them until they fit that many again.
    const reserved = Math.max(1, Math.round((box.height - gap) / lineHeight));
    // Each pass lets a row take the first entry of the next one, so the
    // row breaks only move forward: n² passes are always enough.
    let rows = wrap(widths, spacing, box.width);
    for (
      let pass = 0;
      rows.length > reserved && pass < widths.length ** 2;
      pass++
    ) {
      const wider = Math.min(
        ...rows
          .slice(0, -1)
          .map((row, index) => reach(row, rows[index + 1][0], widths, spacing))
      );
      rows = wrap(widths, spacing, wider);
    }
    return rows;
  };

  return {
    type: 'legend',
    coordinates: ['cartesian', 'polar'],
    // Lists the series without drawing them, so no axis fits to them.
    series: [],
    inset(context) {
      const measured = measure(context.data, context.measureText);
      const { widths, lineHeight, fontSize } = measured;
      if (!widths.length) {
        return undefined;
      }
      const room = horizontal
        ? wrap(widths, SPACING * fontSize, rowRoom(context)).length * lineHeight
        : Math.max(...widths);
      return { [side]: room + gap };
    },
    compose({ data, insetArea, measureText }) {
      const box = insetArea?.[side];
      if (!box) {
        return [];
      }
      const measured = measure(data, measureText);
      const { entries, widths, lineHeight, fontSize } = measured;
      const items: SceneNode[] = [];
      if (horizontal) {
        const spacing = SPACING * fontSize;
        // The gap is on the side of the chart: below a legend on top.
        const top = side === 'top' ? box.y2 : box.y2 + gap;
        rowsIn(box, measured).forEach((row, index) => {
          let x = along(box.x1, box.x2, rowWidth(row, widths, spacing));
          for (const entry of row) {
            items.push(
              entryNode(entries[entry], x, top + index * lineHeight, measured)
            );
            x += widths[entry] + spacing;
          }
        });
      } else {
        const x = side === 'left' ? box.x1 : box.x1 + gap;
        const top = along(box.y2, box.y1, entries.length * lineHeight);
        entries.forEach((entry, index) => {
          items.push(entryNode(entry, x, top + index * lineHeight, measured));
        });
      }
      return [
        items.reduce(
          (group, item) => group.append(item),
          node('g', {}, groupClasses)
        )
      ];
    }
  };
}
