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

export type LabelDirection = 'implode' | 'neutral' | 'explode';
export type AnchorPosition = 'start' | 'middle' | 'end';

interface Dot {
  x: number;
  y: number;
}

/** @experimental */
export interface PieLayerOptions {
  readonly startAngle?: number;
  /** Fixed total; slices are relative to it (gauges). Defaults to the sum. */
  readonly total?: number;
  readonly donut?: boolean;
  /** Donut stroke width in px, or a percentage of the radius (`'25%'`). */
  readonly donutWidth?: number | string;
  readonly showLabel?: boolean;
  readonly labelOffset?: number;
  readonly labelPosition?: 'inside' | 'outside' | 'center';
  readonly labelInterpolationFnc?: (value: unknown, index: number) => unknown;
  readonly labelDirection?: LabelDirection;
  readonly ignoreEmptyValues?: boolean;
  /** Shifts labels that would overlap by this many px. */
  readonly preventOverlappingLabelOffset?: number;
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
 * Draws a flat series as pie or donut slices with labels.
 * @experimental
 */
export function pie(options: PieLayerOptions = {}): Layer {
  const classNames = { ...CLASS_NAMES, ...options.classNames };
  const labelInterpolationFnc =
    options.labelInterpolationFnc ?? ((value: unknown) => value);
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
            style: options.donut
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
                    index,
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
