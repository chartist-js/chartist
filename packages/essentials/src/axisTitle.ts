import {
  node,
  textAscent,
  type AxisSide,
  type InsetContext,
  type Layer,
  type LayerContext
} from 'chartist';

declare module 'chartist' {
  interface NodeRoles {
    /** An axis title of {@link axisTitle}: a `text` (class `ct-axis-title`). */
    axisTitle: {
      ctx: {
        /** The id of the axis the title names. */
        readonly axis: string;
        /** The side of the chart the axis is on. */
        readonly side: AxisSide;
        /** The title's text. */
        readonly text: string;
        /** Where the text is anchored, in px in the SVG. */
        readonly x: number;
        readonly y: number;
      };
      attrs: { readonly x: number; readonly y: number };
    };
  }
}

/** Options of {@link axisTitle}. */
export interface AxisTitleOptions {
  /**
   * The id of the axis the title names: `x` or `y` on the presets, the ids
   * you gave in `cartesianAxes()` in composed charts.
   */
  readonly axis: string;
  /** The title's text; an empty text draws nothing and takes no room. */
  readonly text: string;
  /**
   * Where along the axis the title sits: at the start (left on X axes, the
   * bottom on Y axes), in the middle or at the end.
   */
  readonly align?: 'start' | 'middle' | 'end';
  /**
   * Turns titles of left and right axes to read from top to bottom instead
   * of from bottom to top. Titles of top and bottom axes don't change.
   */
  readonly flip?: boolean;
  /** Space between the title and the axis labels, in px. */
  readonly gap?: number;
  /** Extra class names for the title, e.g. `ct-series-b` for a color. */
  readonly className?: string;
  /** Replaces the default class: `title` instead of `ct-axis-title`. */
  readonly classNames?: { readonly title?: string };
}

const ANCHORS = { start: 'start', middle: 'middle', end: 'end' } as const;
const FLIPPED = { start: 'end', middle: 'middle', end: 'start' } as const;

/**
 * Names an axis with a title next to its labels, on any side of the chart.
 * The layer reserves the room the title needs, so the drawing area shrinks
 * and the title never overlaps the labels, whatever font size the
 * stylesheet gives it. One layer draws one title; give each axis its own.
 * Titles on the same side stack outward in the order of `layers`.
 *
 * The title is an SVG `text` with the classes `ct-axis-title`,
 * `ct-horizontal` or `ct-vertical` and `ct-start` or `ct-end`, styled with
 * `--ct-axis-title-color` and `--ct-axis-title-size` from
 * `@chartist-js/essentials/styles.css`.
 *
 * @example
 * ```ts
 * import { lineChart } from 'chartist';
 * import { axisTitle } from '@chartist-js/essentials';
 * import 'chartist/styles.css';
 * import '@chartist-js/essentials/styles.css';
 *
 * lineChart(
 *   '#chart',
 *   { labels: ['Mon', 'Tue', 'Wed'], series: [[12, 9, 7]] },
 *   {
 *     layers: {
 *       above: [
 *         axisTitle({ axis: 'x', text: 'Day' }),
 *         axisTitle({ axis: 'y', text: 'Visits' })
 *       ]
 *     }
 *   }
 * );
 * ```
 */
export function axisTitle(options: AxisTitleOptions): Layer {
  const { axis, text, align = 'middle', flip = false, gap = 4 } = options;
  const extra = options.className ? ` ${options.className}` : '';
  const title = options.classNames?.title ?? 'ct-axis-title';

  const sideOf = (axes: InsetContext['axes']): AxisSide => {
    const definition = axes.find(candidate => candidate.id === axis);
    if (!definition) {
      throw new Error(`Chartist: unknown axis "${axis}" in layer "axisTitle"`);
    }
    return definition.side;
  };
  const classesOf = (side: AxisSide) =>
    `${title} ${side === 'top' || side === 'bottom' ? 'ct-horizontal' : 'ct-vertical'} ${
      side === 'top' || side === 'left' ? 'ct-start' : 'ct-end'
    }${extra}`;
  const measure = (measureText: LayerContext['measureText'], side: AxisSide) =>
    measureText(text, { classes: classesOf(side).split(' ') });

  return {
    type: 'axisTitle',
    coordinates: ['cartesian'],
    series: [],
    inset({ axes, measureText }) {
      const side = sideOf(axes);
      return text === ''
        ? undefined
        : { [side]: measure(measureText, side).height + gap };
    },
    compose({ insetArea, measureText }) {
      const [entry] = Object.entries(insetArea ?? {});
      if (!entry) {
        return [];
      }
      const [side, box] = entry as [
        AxisSide,
        NonNullable<typeof insetArea>[AxisSide] & object
      ];
      const metrics = measure(measureText, side);
      const ascent = textAscent * (metrics.fontSize ?? 12);
      const horizontal = side === 'top' || side === 'bottom';
      // The title's line: across the box, leaving the gap on the axis side.
      const near = side === 'top' || side === 'left';
      const from = (horizontal ? box.y2 : box.x1) + (near ? 0 : gap);
      const to = (horizontal ? box.y1 : box.x2) - (near ? gap : 0);
      let x: number;
      let y: number;
      let anchor: 'start' | 'middle' | 'end';
      let transform: string | undefined;
      if (horizontal) {
        x = { start: box.x1, middle: (box.x1 + box.x2) / 2, end: box.x2 }[
          align
        ];
        y = from + ascent;
        anchor = ANCHORS[align];
      } else {
        // Read from bottom to top (−90°), or flipped from top to bottom.
        x = flip ? to - ascent : from + ascent;
        y = { start: box.y1, middle: (box.y1 + box.y2) / 2, end: box.y2 }[
          align
        ];
        anchor = (flip ? FLIPPED : ANCHORS)[align];
        transform = `rotate(${flip ? 90 : -90} ${x} ${y})`;
      }
      return [
        node(
          'text',
          { x, y, 'text-anchor': anchor, transform },
          classesOf(side),
          { role: 'axisTitle', ctx: { axis, side, text, x, y } }
        ).text(text)
      ];
    }
  };
}
