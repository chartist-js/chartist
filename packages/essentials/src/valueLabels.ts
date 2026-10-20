import {
  findAll,
  node,
  textAscent,
  type Area,
  type ChartPadding,
  type Layer,
  type LayerContext,
  type MeasureText,
  type NodeRoles,
  type SceneNode
} from 'chartist';

/** The roles whose nodes get labels. */
export type ValueLabelRole = 'point' | 'bar';

/** Where a point's label sits. */
export type PointLabelPosition =
  | 'above'
  | 'below'
  | 'left'
  | 'right'
  | 'center';

/**
 * Where a bar's label sits, from the bar's base to its value: past its
 * end, inside its end, in its middle or inside its base.
 */
export type BarLabelPosition = 'end' | 'inside-end' | 'center' | 'inside-base';

/**
 * The value a label is about: what `format` gets. It has the fields of
 * the item `@chartist-js/tooltips` gives its `format`, under the same
 * names, so a function written for one mostly works for the other.
 * Checking `item.role` narrows `item.context` to that role's context.
 */
export type ValueLabelItem<R extends ValueLabelRole = ValueLabelRole> = {
  [K in R]: {
    /** The role of the labeled node: `point` or `bar`. */
    readonly role: K;
    /** The series' index in the chart's data. */
    readonly seriesIndex: number;
    /** The value's index in its series. */
    readonly valueIndex: number;
    /** The value: a number, or `{ x, y }` when it has both. */
    readonly value: number | { readonly x: number; readonly y: number };
    /** The value's `meta`. */
    readonly meta: unknown;
    /** The series as given in the data. */
    readonly series: unknown;
    /** The series' `name`, when it has one. */
    readonly seriesName?: string;
    /** The chart's label at the value's index. */
    readonly label?: string;
    /** The labeled node's data context. */
    readonly context: NodeRoles[K]['ctx'];
  };
}[R];

/** The context of a `valueLabel` node. */
export interface ValueLabelContext {
  /** The role of the node the label is for. */
  readonly role: ValueLabelRole;
  /** The series' index in the chart's data. */
  readonly seriesIndex: number;
  /** The value's index in its series. */
  readonly valueIndex: number;
  /** The labeled value, as the node has it. */
  readonly value: unknown;
  /** The value's `meta`. */
  readonly meta: unknown;
  /** The series as given in the data. */
  readonly series: unknown;
  /** The label's text. */
  readonly text: string;
  /** Where the label ended up, after fitting. */
  readonly position: PointLabelPosition | BarLabelPosition;
  /** Px from the left edge of the SVG: where the text is anchored. */
  readonly x: number;
  /** Px from the top edge of the SVG: the first line's baseline. */
  readonly y: number;
}

declare module 'chartist' {
  interface NodeRoles {
    /**
     * A label of the `valueLabels()` layer: SVG `text`, or a
     * `foreignObject` with a `span` (class `ct-value-label`).
     */
    valueLabel: { ctx: ValueLabelContext; attrs: object };
  }
}

/** Options of {@link valueLabels}. */
export interface ValueLabelsOptions<R extends ValueLabelRole = ValueLabelRole> {
  /** The nodes that get labels: `point`, `bar` or both (the default). */
  readonly roles?: readonly R[];
  /** The series to label, by index or name; default: all of them. */
  readonly series?: readonly (number | string)[];
  /** Where point labels sit; default `above`. */
  readonly pointPosition?: PointLabelPosition;
  /**
   * Where bar labels sit; default `end`, and `center` for segments of
   * stacked bars.
   */
  readonly barPosition?: BarLabelPosition;
  /**
   * The gap in px between a point's center, or a bar's end or base, and
   * the label's nearest edge; default 8 for points and 4 for bars.
   */
  readonly offset?: number;
  /**
   * The label's text for a value: a string or a number. `undefined` keeps
   * the default text, `null` or `''` draw no label, and `\n` starts a new
   * line.
   */
  readonly format?: (
    item: ValueLabelItem<R>
  ) => string | number | null | undefined;
  /** `Intl.NumberFormat` options for the default text. */
  readonly numberFormat?: Intl.NumberFormatOptions;
  /**
   * The locale of the default text; default: the runtime's. Set it when
   * charts render on a server, so the text doesn't depend on its locale.
   */
  readonly locale?: string | readonly string[];
  /**
   * `fit` (the default) moves labels that don't fit their bar or would
   * leave the chart; `show` draws every label where its position puts it.
   */
  readonly overflow?: 'fit' | 'show';
  /** SVG `text` (the default) or HTML in a `foreignObject`. */
  readonly labels?: 'svg' | 'html';
  /**
   * Replace the classes: `group` (`ct-value-labels`), `label`
   * (`ct-value-label`) and `inside` (`ct-value-label-inside`).
   */
  readonly classNames?: {
    readonly group?: string;
    readonly label?: string;
    readonly inside?: string;
  };
}

const POINT_POSITIONS = ['above', 'below', 'left', 'right', 'center'];
const BAR_POSITIONS = ['end', 'inside-end', 'center', 'inside-base'];

/** A label's box in px, and where its text is anchored across it. */
interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly anchor: 'start' | 'middle' | 'end';
}

/** What a label is drawn for: a value at a point or along a bar. */
interface Source {
  readonly role: ValueLabelRole;
  readonly ctx: Record<string, unknown> & {
    readonly seriesIndex: number;
    readonly valueIndex: number;
  };
  readonly classes: readonly string[];
}

/** The value as `format` gets it: a number, or `{ x, y }` with both. */
function plainValue(value: unknown): ValueLabelItem['value'] | undefined {
  if (typeof value === 'number') {
    return value;
  }
  const { x, y } = (value ?? {}) as { x?: unknown; y?: unknown };
  if (typeof x === 'number' && typeof y === 'number') {
    return { x, y };
  }
  return typeof y === 'number' ? y : typeof x === 'number' ? x : undefined;
}

/** The value along the value axis: X on horizontal bars, else Y. */
function axisValue(value: unknown, horizontal: boolean): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  const along = (value as { x?: unknown; y?: unknown } | undefined)?.[
    horizontal ? 'x' : 'y'
  ];
  return typeof along === 'number' && Number.isFinite(along)
    ? along
    : undefined;
}

/** The box of a label of `width` × `height` px at a point. */
function pointBox(
  x: number,
  y: number,
  width: number,
  height: number,
  position: PointLabelPosition,
  offset: number
): Box {
  switch (position) {
    case 'below':
      return {
        left: x - width / 2,
        top: y + offset,
        width,
        height,
        anchor: 'middle'
      };
    case 'left':
      return {
        left: x - offset - width,
        top: y - height / 2,
        width,
        height,
        anchor: 'end'
      };
    case 'right':
      return {
        left: x + offset,
        top: y - height / 2,
        width,
        height,
        anchor: 'start'
      };
    case 'center':
      return {
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        anchor: 'middle'
      };
    default:
      return {
        left: x - width / 2,
        top: y - offset - height,
        width,
        height,
        anchor: 'middle'
      };
  }
}

/**
 * The box of a label along a bar from (x1, y1) to (x2, y2), in the
 * direction of its value: up and right for a value of zero or more.
 */
function barBox(
  bar: { x1: number; y1: number; x2: number; y2: number },
  horizontal: boolean,
  negative: boolean,
  width: number,
  height: number,
  position: BarLabelPosition,
  offset: number
): Box {
  // Along the bar: the label's start and end edge, as offsets from a
  // point, in the direction the bar grows (1: right or down in px).
  const growth = horizontal ? (negative ? -1 : 1) : negative ? 1 : -1;
  const extent = horizontal ? width : height;
  const base = horizontal ? bar.x1 : bar.y1;
  const end = horizontal ? bar.x2 : bar.y2;
  // The label's near edge, in the direction of growth, and which way the
  // label extends from it.
  let near: number;
  let toward: number;
  if (position === 'end') {
    near = end + growth * offset;
    toward = growth;
  } else if (position === 'inside-end') {
    near = end - growth * offset;
    toward = -growth;
  } else if (position === 'inside-base') {
    near = base + growth * offset;
    toward = growth;
  } else {
    near = (base + end) / 2 - (growth * extent) / 2;
    toward = growth;
  }
  const start = toward > 0 ? near : near - extent;
  if (horizontal) {
    const across = (bar.y1 + bar.y2) / 2;
    return {
      left: start,
      top: across - height / 2,
      width,
      height,
      anchor: position === 'center' ? 'middle' : toward > 0 ? 'start' : 'end'
    };
  }
  const across = (bar.x1 + bar.x2) / 2;
  return {
    left: across - width / 2,
    top: start,
    width,
    height,
    anchor: 'middle'
  };
}

/** Moves a box inward by the least amount so it stays in the bounds. */
function inside(box: Box, bounds: Area): Box {
  const left = Math.max(bounds.x1, Math.min(box.left, bounds.x2 - box.width));
  const top = Math.max(bounds.y2, Math.min(box.top, bounds.y1 - box.height));
  return { ...box, left, top };
}

const crosses = (box: Box, bounds: Area) =>
  box.left < bounds.x1 ||
  box.top < bounds.y2 ||
  box.left + box.width > bounds.x2 ||
  box.top + box.height > bounds.y1;

/** The chart area grown by the chart's padding: where labels may go. */
const boundsOf = (area: Area, padding: ChartPadding): Area => {
  const x1 = area.x1 - padding.left;
  const x2 = area.x2 + padding.right;
  const y2 = area.y2 - padding.top;
  const y1 = area.y1 + padding.bottom;
  return { x1, x2, y1, y2, width: x2 - x1, height: y1 - y2 };
};

/**
 * The points and bars in the series groups of the drawn nodes, with
 * their series' classes.
 */
function sourcesOf(
  drawn: readonly SceneNode[],
  roles: ReadonlySet<ValueLabelRole>
): Source[] {
  // Series groups can sit inside other groups, as on the presets.
  const groups = drawn.flatMap(top => findAll(top, { role: 'series' }));
  return groups.flatMap(top => {
    // A series group's classes after its group class: `ct-series-b`, or
    // the series' own className.
    const classes = top.classes.slice(1);
    const points = roles.has('point') ? findAll(top, { role: 'point' }) : [];
    const sources: Source[] = points.map(point => ({
      role: 'point',
      ctx: point.ctx as unknown as Source['ctx'],
      classes
    }));
    if (roles.has('point') && points.length === 0) {
      // A line without points: its values' positions on the line.
      for (const line of findAll(top, { role: 'line' })) {
        for (const element of line.ctx.path.pathElements) {
          const data = element.data as
            | { value?: unknown; valueIndex?: number; meta?: unknown }
            | undefined;
          if (data) {
            sources.push({
              role: 'point',
              ctx: {
                series: line.ctx.series,
                seriesIndex: line.ctx.seriesIndex,
                valueIndex: data.valueIndex ?? 0,
                value: data.value,
                meta: data.meta,
                x: element.x,
                y: element.y
              },
              classes
            });
          }
        }
      }
    }
    if (roles.has('bar')) {
      for (const bar of findAll(top, { role: 'bar' })) {
        sources.push({
          role: 'bar',
          ctx: bar.ctx as unknown as Source['ctx'],
          classes
        });
      }
    }
    return sources;
  });
}

/** One label's lines measured: the widest line and the lines' height. */
function measureLines(
  lines: readonly string[],
  measureText: MeasureText,
  classes: readonly string[]
) {
  const metrics = lines.map(line => measureText(line, { classes }));
  const lineHeight = Math.max(...metrics.map(metric => metric.height));
  return {
    width: Math.max(...metrics.map(metric => metric.width)),
    height: lineHeight * lines.length,
    lineHeight,
    fontSize: metrics[0].fontSize ?? lineHeight / 1.2
  };
}

/**
 * Creates a layer that writes each value next to the point or bar that
 * shows it: above points, past the ends of bars, and in the middle of
 * stacked segments. It draws from where the chart's other layers drew,
 * after stacking, offsets and `compose` listeners, so add it as an extra
 * layer: `layers.above` on a preset, anywhere in a composed chart.
 *
 * The text is the value along the value axis, written with
 * `Intl.NumberFormat`; `format` gets the same item as the `format` of
 * `@chartist-js/tooltips`. Labels that don't fit their bar, or would
 * leave the chart, move to a place where they fit. They're SVG `text`, so
 * they render on servers and in the terminal, styled with
 * `--ct-value-label-color`, `--ct-value-label-inside-color` and
 * `--ct-value-label-size` from `@chartist-js/essentials/styles.css`.
 *
 * @example
 * ```ts
 * import { barChart } from 'chartist';
 * import { valueLabels } from '@chartist-js/essentials';
 * import 'chartist/styles.css';
 * import '@chartist-js/essentials/styles.css';
 *
 * barChart(
 *   '#chart',
 *   { labels: ['Q1', 'Q2', 'Q3'], series: [[1250, 1830, 1470]] },
 *   {
 *     layers: {
 *       above: [
 *         valueLabels({ format: item => `${item.value} units` })
 *       ]
 *     }
 *   }
 * );
 * ```
 */
export function valueLabels<R extends ValueLabelRole = ValueLabelRole>(
  options: ValueLabelsOptions<R> = {}
): Layer {
  const fail = (what: string, value: unknown) => {
    throw new Error(
      `Chartist: layer "valueLabels" got ${JSON.stringify(value)} for ${what}`
    );
  };
  if (
    options.pointPosition &&
    !POINT_POSITIONS.includes(options.pointPosition)
  ) {
    fail('pointPosition', options.pointPosition);
  }
  if (options.barPosition && !BAR_POSITIONS.includes(options.barPosition)) {
    fail('barPosition', options.barPosition);
  }
  if (
    options.overflow &&
    options.overflow !== 'fit' &&
    options.overflow !== 'show'
  ) {
    fail('overflow', options.overflow);
  }
  if (options.offset !== undefined && !Number.isFinite(options.offset)) {
    fail('offset', options.offset);
  }
  const roles = new Set<ValueLabelRole>(options.roles ?? ['point', 'bar']);
  const classNames = {
    group: 'ct-value-labels',
    label: 'ct-value-label',
    inside: 'ct-value-label-inside',
    ...options.classNames
  };
  const fit = options.overflow !== 'show';
  const html = options.labels === 'html';
  const numbers = new Intl.NumberFormat(
    options.locale as string | string[] | undefined,
    options.numberFormat
  );

  const textOf = (
    source: Source,
    context: LayerContext
  ): string | undefined => {
    const { ctx, role } = source;
    const horizontal = role === 'bar' && Boolean(ctx.horizontal);
    const along = axisValue(ctx.value, horizontal);
    if (along === undefined) {
      return undefined;
    }
    const series = ctx.series as { name?: unknown } | undefined;
    const own = options.format?.({
      role,
      seriesIndex: ctx.seriesIndex,
      valueIndex: ctx.valueIndex,
      value: plainValue(ctx.value) ?? along,
      meta: ctx.meta,
      series: ctx.series,
      seriesName: typeof series?.name === 'string' ? series.name : undefined,
      label: context.data.labels?.[ctx.valueIndex] as string | undefined,
      context: ctx
    } as unknown as ValueLabelItem<R>);
    if (own === null || own === '') {
      return undefined;
    }
    return own === undefined ? numbers.format(along) : String(own);
  };

  const selected = (source: Source) =>
    !options.series ||
    options.series.some(selector =>
      typeof selector === 'number'
        ? selector === source.ctx.seriesIndex
        : (source.ctx.series as { name?: unknown } | undefined)?.name ===
          selector
    );

  const labelOf = (
    source: Source,
    context: LayerContext,
    bounds: Area
  ): SceneNode | undefined => {
    const text = textOf(source, context);
    if (text === undefined) {
      return undefined;
    }
    const lines = text.split('\n');
    const classes = [classNames.label, ...source.classes];
    const size = measureLines(lines, context.measureText, classes);
    const { ctx } = source;
    let position: PointLabelPosition | BarLabelPosition;
    let box: Box;
    if (source.role === 'point') {
      position = options.pointPosition ?? 'above';
      box = pointBox(
        Number(ctx.x),
        Number(ctx.y),
        size.width,
        size.height,
        position,
        position === 'center' ? 0 : (options.offset ?? 8)
      );
      if (fit) {
        box = inside(box, bounds);
      }
    } else {
      const bar = ctx as unknown as {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        horizontal?: boolean;
        stacked?: boolean;
      };
      const horizontal = Boolean(bar.horizontal);
      const negative = (axisValue(ctx.value, horizontal) ?? 0) < 0;
      const offset = options.offset ?? 4;
      const place = (at: BarLabelPosition) =>
        barBox(
          bar,
          horizontal,
          negative,
          size.width,
          size.height,
          at,
          at === 'center' ? 0 : offset
        );
      position = options.barPosition ?? (bar.stacked ? 'center' : 'end');
      if (fit && position !== 'end') {
        const length = Math.abs(horizontal ? bar.x2 - bar.x1 : bar.y2 - bar.y1);
        const room = position === 'center' ? length : length - offset;
        if ((horizontal ? size.width : size.height) > room) {
          if (bar.stacked) {
            return undefined;
          }
          position = 'end';
        }
      }
      box = place(position);
      if (fit && position === 'end' && crosses(box, bounds)) {
        const along = horizontal
          ? box.left < bounds.x1 || box.left + box.width > bounds.x2
          : box.top < bounds.y2 || box.top + box.height > bounds.y1;
        if (along) {
          position = 'inside-end';
          box = place(position);
        }
      }
      if (fit) {
        box = inside(box, bounds);
      }
      if (position !== 'end') {
        classes.push(classNames.inside);
      }
    }
    const x =
      box.anchor === 'start'
        ? box.left
        : box.anchor === 'end'
          ? box.left + box.width
          : box.left + box.width / 2;
    const y = box.top + textAscent * size.fontSize;
    const labelCtx: ValueLabelContext = {
      role: source.role,
      seriesIndex: ctx.seriesIndex,
      valueIndex: ctx.valueIndex,
      value: ctx.value,
      meta: ctx.meta,
      series: ctx.series,
      text,
      position,
      x,
      y
    };
    const className = classes.join(' ');
    if (html) {
      const attrs = {
        x: box.left,
        y: box.top,
        width: box.width,
        height: box.height,
        style: 'overflow: visible;'
      };
      return node('foreignObject', attrs, '', {
        role: 'valueLabel',
        ctx: labelCtx
      }).append(node('span', {}, className).text(text));
    }
    const label = node('text', { x, y, 'text-anchor': box.anchor }, className, {
      role: 'valueLabel',
      ctx: labelCtx
    });
    return lines.length === 1
      ? label.text(text)
      : lines.reduce(
          (parent, line, index) =>
            parent.append(
              node('tspan', {
                x,
                ...(index > 0 && { dy: size.lineHeight })
              }).text(line)
            ),
          label
        );
  };

  return {
    type: 'valueLabels',
    coordinates: ['cartesian'],
    series: [],
    compose: () => [],
    annotate(drawn, context) {
      const bounds = boundsOf(context.area, context.padding);
      const labels = sourcesOf(drawn, roles)
        .filter(selected)
        .flatMap(source => labelOf(source, context, bounds) ?? []);
      return labels.length
        ? [
            labels.reduce(
              (group, label) => group.append(label),
              node('g', {}, classNames.group)
            )
          ]
        : [];
    }
  };
}
