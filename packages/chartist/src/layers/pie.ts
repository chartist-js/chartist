/**
 * Pie layer: slices and labels in polar coordinates, drawn like 1.x
 * `PieChart` (geometry, classes, labels and `ct:` attributes).
 */
import { serialize } from '../core/data/serialize';
import { normalizeData } from '../core/data/normalize';
import { alphaNumerate, quantity } from '../core/lang';
import { polarToCartesian } from '../core/math';
import type { Data, Label } from '../core/types';
import type { Layer } from '../pipeline/types';
import { node, withFields, type SceneNode } from '../scene/node';
import { SvgPath } from '../svg/SvgPath';
import { sum } from '../utils/functional';
import { isFalseyButZero, safeHasProperty } from '../utils/utils';

/** Which way pie labels anchor, relative to the center. */
export type LabelDirection = 'implode' | 'neutral' | 'explode';
/** The `text-anchor` of a pie label. */
export type AnchorPosition = 'start' | 'middle' | 'end';

interface Dot {
  x: number;
  y: number;
}

/**
 * The options of the {@link pie} layer. Without them, it draws a filled
 * pie from the top, with a label halfway out on each slice.
 * @experimental
 */
export interface PieLayerOptions {
  /** Where the first slice starts, in degrees clockwise from the top. */
  readonly startAngle?: number;
  /** Fixed total; slices are relative to it (gauges). Defaults to the sum. */
  readonly total?: number;
  /** Draws a donut: rings instead of filled slices. */
  readonly donut?: boolean;
  /**
   * Donut ring width in px, or a share of the radius (`'25%'`). Without
   * it, the stylesheet sets the width (`--ct-donut-width`, 60px by
   * default), and the ring is laid out for 60 px.
   */
  readonly donutWidth?: number | string;
  /** Draws a label for each slice; on by default. */
  readonly showLabel?: boolean;
  /**
   * Moves the labels away from the center (positive) or toward it
   * (negative), in px.
   */
  readonly labelOffset?: number;
  /**
   * Where labels go: `inside` (halfway out, the default), `outside` (at
   * the edge) or `center` (in the middle; move them with `labelOffset`).
   * Donut labels sit on the ring, whatever the position.
   */
  readonly labelPosition?: 'inside' | 'outside' | 'center';
  /** Formats a slice's label: its entry in `labels`, or else its value. */
  readonly labelInterpolationFnc?: (
    value: Label,
    index: number
  ) => Label | null | undefined;
  /**
   * Which way labels anchor: `neutral` (the default), `explode` (away from
   * the center, for labels outside the pie) or `implode` (toward it).
   */
  readonly labelDirection?: LabelDirection;
  /** Leaves out the slices and labels of zero values. */
  readonly ignoreEmptyValues?: boolean;
  /** Shifts labels that would overlap by this many px. */
  readonly preventOverlappingLabelOffset?: number;
  /**
   * Replaces the classes of what the layer draws: `series` (`ct-series`),
   * `slicePie` (`ct-slice-pie`), `sliceDonut` (`ct-slice-donut`) and
   * `label` (`ct-label`).
   */
  readonly classNames?: {
    readonly series?: string;
    readonly slicePie?: string;
    readonly sliceDonut?: string;
    readonly label?: string;
  };
}

/** The 1.x label anchor: `start`, `middle` or `end` by side and direction. */
export function determineAnchorPosition(
  center: Dot,
  label: Dot,
  direction: LabelDirection
): AnchorPosition {
  const toTheRight = label.x > center.x;
  if (
    (toTheRight && direction === 'explode') ||
    (!toTheRight && direction === 'implode')
  ) {
    return 'start';
  } else if (
    (toTheRight && direction === 'implode') ||
    (!toTheRight && direction === 'explode')
  ) {
    return 'end';
  }
  return 'middle';
}

/** Moves a label up and left until it no longer overlaps another one (1.x). */
export function moveLabel(
  labelPos: Dot,
  existingLabelPos: Dot,
  textOffset: number,
  length: number
) {
  if (
    labelPos.y > existingLabelPos.y - textOffset &&
    labelPos.y < existingLabelPos.y + textOffset &&
    labelPos.x > existingLabelPos.x - length * textOffset &&
    labelPos.x < existingLabelPos.x + length * textOffset
  ) {
    labelPos.y -= textOffset;
    labelPos.x -= textOffset;
    moveLabel(labelPos, existingLabelPos, textOffset, length);
  }
}

const CLASS_NAMES = {
  series: 'ct-series',
  slicePie: 'ct-slice-pie',
  sliceDonut: 'ct-slice-donut',
  label: 'ct-label'
};

/**
 * Creates a layer that draws a flat series as pie or donut slices with
 * labels, in the markup of the 1.x pie chart (a `g.ct-series` per slice,
 * then a group of `text.ct-label`). It draws in polar coordinates, so the
 * chart needs `coordinates: 'polar'` and no axes. With several series, it
 * draws one slice per series, from each series' first value.
 *
 * @example
 * ```ts
 * import { chart, pie } from 'chartist';
 *
 * chart('#chart', {
 *   data: {
 *     labels: ['Rent', 'Food', 'Fun'],
 *     series: [50, 30, 20]
 *   },
 *   coordinates: 'polar',
 *   layers: [pie({ donut: true, donutWidth: 30 })],
 *   className: 'ct-chart-donut'
 * });
 * ```
 * @experimental
 */
export function pie(options: PieLayerOptions = {}): Layer {
  const classNames = { ...CLASS_NAMES, ...options.classNames };
  const labelInterpolationFnc =
    options.labelInterpolationFnc ?? ((value: Label) => value);
  return {
    type: 'pie',
    coordinates: ['polar'],
    compose({ data, area }) {
      // Values or `{ value, name, className, meta }` objects, as in 1.x.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any[] = data.flat
        ? [...data.series[0].values]
        : data.series.map(series => ({
            name: series.name,
            className: series.className,
            meta: series.meta,
            value: series.values[0]
          }));
      const normalized = normalizeData({
        labels: data.labels as Label[],
        series: raw
      } as Data);
      const values = normalized.series as number[];
      const labels = normalized.labels;
      const labelPositions: Dot[] = [];
      let startAngle = options.startAngle ?? 0;

      let radius = Math.min(area.width / 2, area.height / 2);
      const totalDataSum = options.total || values.reduce(sum, 0);
      // Without `donutWidth`, CSS draws the ring (`--ct-donut-width`); the
      // layout assumes the stylesheet's default of 60px (see #1474).
      const donutWidth = quantity(options.donutWidth ?? 60);
      if (donutWidth.unit === '%') {
        donutWidth.value *= radius / 100;
      }
      radius -= options.donut ? donutWidth.value / 2 : 0;

      let labelRadius: number;
      if (options.labelPosition === 'outside' || options.donut) {
        labelRadius = radius;
      } else if (options.labelPosition === 'center') {
        labelRadius = 0;
      } else {
        labelRadius = radius / 2;
      }
      if (options.labelOffset) {
        labelRadius += options.labelOffset;
      }

      const center = {
        x: area.x1 + area.width / 2,
        y: area.y2 + area.height / 2
      };
      const hasSingleValInSeries =
        raw.filter(val =>
          safeHasProperty(val, 'value') ? val.value !== 0 : val !== 0
        ).length === 1;

      const groups: SceneNode[] = [];
      const labelNodes: SceneNode[] = [];

      raw.forEach((series, index) => {
        if (values[index] === 0 && options.ignoreEmptyValues) {
          // 1.x creates the group anyway and leaves it empty.
          groups.push(node('g'));
          return;
        }
        const seriesName = safeHasProperty(series, 'name') && series.name;
        const seriesClassName =
          safeHasProperty(series, 'className') && series.className;
        const seriesMeta = safeHasProperty(series, 'meta')
          ? series.meta
          : undefined;

        let endAngle =
          totalDataSum > 0
            ? startAngle + (values[index] / totalDataSum) * 360
            : 0;
        const overlappingStartAngle = Math.max(
          0,
          startAngle - (index === 0 || hasSingleValInSeries ? 0 : 0.2)
        );
        if (endAngle - overlappingStartAngle >= 359.99) {
          endAngle = overlappingStartAngle + 359.99;
        }
        const start = polarToCartesian(
          center.x,
          center.y,
          radius,
          overlappingStartAngle
        );
        const end = polarToCartesian(center.x, center.y, radius, endAngle);
        const path = new SvgPath(!options.donut)
          .move(end.x, end.y)
          .arc(
            radius,
            radius,
            0,
            Number(endAngle - startAngle > 180),
            0,
            start.x,
            start.y
          );
        if (!options.donut) {
          path.line(center.x, center.y);
        }

        const slice = node(
          'path',
          {
            d: path.stringify(),
            'ct:value': values[index],
            'ct:meta': serialize(seriesMeta) as string | undefined,
            style:
              options.donut && options.donutWidth !== undefined
                ? `stroke-width: ${donutWidth.value}px`
                : undefined
          },
          options.donut ? classNames.sliceDonut : classNames.slicePie,
          {
            role: 'slice',
            ctx: {
              value: values[index],
              totalDataSum,
              index,
              seriesIndex: index,
              valueIndex: 0,
              meta: seriesMeta,
              series,
              path: path.clone(),
              center,
              radius,
              startAngle,
              endAngle
            }
          }
        );
        groups.push(
          withFields(
            node(
              'g',
              { 'ct:series-name': seriesName || undefined },
              `${classNames.series} ${
                seriesClassName ||
                `${classNames.series}-${alphaNumerate(index)}`
              }`,
              {
                role: 'series',
                ctx: { seriesIndex: index, series, meta: seriesMeta }
              }
            ),
            { children: [slice] }
          )
        );

        if (options.showLabel ?? true) {
          const labelPosition =
            raw.length === 1
              ? { x: center.x, y: center.y }
              : polarToCartesian(
                  center.x,
                  center.y,
                  labelRadius,
                  startAngle + (endAngle - startAngle) / 2
                );
          const rawValue =
            labels && !isFalseyButZero(labels[index])
              ? labels[index]
              : values[index];
          const interpolated = labelInterpolationFnc(rawValue, index);
          if (interpolated || interpolated === 0) {
            if (options.preventOverlappingLabelOffset) {
              const length = String(labels[index]).length;
              labelPositions.forEach(item =>
                moveLabel(
                  labelPosition,
                  item,
                  options.preventOverlappingLabelOffset!,
                  length
                )
              );
              labelPositions.push(labelPosition);
            }
            labelNodes.push(
              node(
                'text',
                {
                  dx: labelPosition.x,
                  dy: labelPosition.y,
                  'text-anchor': determineAnchorPosition(
                    center,
                    labelPosition,
                    options.labelDirection ?? 'neutral'
                  )
                },
                classNames.label,
                {
                  role: 'label',
                  ctx: {
                    kind: 'pie',
                    index,
                    seriesIndex: index,
                    valueIndex: 0,
                    text: String(interpolated),
                    series,
                    meta: seriesMeta,
                    x: labelPosition.x,
                    y: labelPosition.y
                  }
                }
              ).text(String(interpolated))
            );
          }
        }
        startAngle = endAngle;
      });

      return (options.showLabel ?? true)
        ? [...groups, withFields(node('g'), { children: labelNodes })]
        : groups;
    }
  };
}
