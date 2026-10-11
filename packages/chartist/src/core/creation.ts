import type {
  ChartPadding,
  ChartRect,
  Options,
  Label,
  GridDrawEvent,
  GridBackgroundDrawEvent,
  LabelDrawEvent,
  ViewBox
} from './types';
import type { EventEmitter } from '../event';
import type { Axis } from '../axes';
import { namespaces } from './constants';
import { Svg } from '../svg/Svg';
import { quantity } from './lang';

/**
 * Create or reinitialize the SVG element for the chart
 * @param container The containing DOM Node object that will be used to plant the SVG element
 * @param width Set the width of the SVG element. Default is 100%
 * @param height Set the height of the SVG element. Default is 100%
 * @param className Specify a class to be added to the SVG element
 * @return The created/reinitialized SVG element
 */
export function createSvg(
  container: Element,
  width: number | string = '100%',
  height: number | string = '100%',
  className?: string,
  viewBox?: ViewBox
) {
  if (!container) {
    throw new Error('Container element is not found');
  }

  // Check if there is a previous SVG element in the container that contains the Chartist XML namespace and remove it
  // Since the DOM API does not support namespaces we need to manually search the returned list http://www.w3.org/TR/selectors-api/
  Array.from(container.querySelectorAll('svg'))
    .filter(svg => svg.getAttributeNS(namespaces.xmlns, 'ct'))
    .forEach(svg => container.removeChild(svg));

  // Create svg object with width and height or use 100% as default
  const svg = new Svg('svg')
    .attr({
      width,
      height
    })
    .attr({
      // TODO: Check better solution (browser support) and remove inline styles due to CSP
      style: `width: ${width}; height: ${height};`
    });

  if (className) {
    svg.addClass(className);
  }

  if (viewBox) {
    svg.attr({ viewBox: `0 0 ${viewBox.width} ${viewBox.height}` });
  }

  // Add the DOM node to our container
  container.appendChild(svg.getNode());

  return svg;
}

/**
 * Converts a number into a padding object.
 * @param padding
 * @param fallback This value is used to fill missing values if a incomplete padding object was passed
 * @returns Returns a padding object containing top, right, bottom, left properties filled with the padding number passed in as argument. If the argument is something else than a number (presumably already a correct padding object) then this argument is directly returned.
 */
export function normalizePadding(
  padding: number | Partial<ChartPadding> | undefined
) {
  return typeof padding === 'number'
    ? {
        top: padding,
        right: padding,
        bottom: padding,
        left: padding
      }
    : padding === undefined
    ? { top: 0, right: 0, bottom: 0, left: 0 }
    : {
        top: typeof padding.top === 'number' ? padding.top : 0,
        right: typeof padding.right === 'number' ? padding.right : 0,
        bottom: typeof padding.bottom === 'number' ? padding.bottom : 0,
        left: typeof padding.left === 'number' ? padding.left : 0
      };
}

/**
 * Initialize chart drawing rectangle (area where chart is drawn) x1,y1 = bottom left / x2,y2 = top right
 * @param svg The svg element for the chart
 * @param options The Object that contains all the optional values for the chart
 * @return The chart rectangles coordinates inside the svg element plus the rectangles measurements
 */
export function createChartRect(svg: Svg, options: Options) {
  const hasAxis = Boolean(options.axisX || options.axisY);
  const yAxisOffset = options.axisY?.offset || 0;
  const xAxisOffset = options.axisX?.offset || 0;
  const yAxisPosition = options.axisY?.position;
  const xAxisPosition = options.axisX?.position;
  // If width or height results in invalid value (including 0) we fallback to the unitless settings or even 0
  let width =
    options.viewBox?.width || svg.width() || quantity(options.width).value || 0;
  let height =
    options.viewBox?.height ||
    svg.height() ||
    quantity(options.height).value ||
    0;
  const normalizedPadding = normalizePadding(options.chartPadding);

  // If settings were to small to cope with offset (legacy) and padding, we'll adjust
  width = Math.max(
    width,
    yAxisOffset + normalizedPadding.left + normalizedPadding.right
  );
  height = Math.max(
    height,
    xAxisOffset + normalizedPadding.top + normalizedPadding.bottom
  );

  const chartRect = {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0,
    padding: normalizedPadding,
    width() {
      return this.x2 - this.x1;
    },
    height() {
      return this.y1 - this.y2;
    }
  };

  if (hasAxis) {
    if (xAxisPosition === 'start') {
      chartRect.y2 = normalizedPadding.top + xAxisOffset;
      chartRect.y1 = Math.max(
        height - normalizedPadding.bottom,
        chartRect.y2 + 1
      );
    } else {
      chartRect.y2 = normalizedPadding.top;
      chartRect.y1 = Math.max(
        height - normalizedPadding.bottom - xAxisOffset,
        chartRect.y2 + 1
      );
    }

    if (yAxisPosition === 'start') {
      chartRect.x1 = normalizedPadding.left + yAxisOffset;
      chartRect.x2 = Math.max(
        width - normalizedPadding.right,
        chartRect.x1 + 1
      );
    } else {
      chartRect.x1 = normalizedPadding.left;
      chartRect.x2 = Math.max(
        width - normalizedPadding.right - yAxisOffset,
        chartRect.x1 + 1
      );
    }
  } else {
    chartRect.x1 = normalizedPadding.left;
    chartRect.x2 = Math.max(width - normalizedPadding.right, chartRect.x1 + 1);
    chartRect.y2 = normalizedPadding.top;
    chartRect.y1 = Math.max(
      height - normalizedPadding.bottom,
      chartRect.y2 + 1
    );
  }

  return chartRect;
}

/**
 * Creates a grid line based on a projected value.
 */
export function createGrid(
  position: number,
  index: number,
  axis: Axis,
  offset: number,
  length: number,
  group: Svg,
  classes: string[],
  eventEmitter: EventEmitter
) {
  const positionalData = {
    [`${axis.units.pos}1`]: position,
    [`${axis.units.pos}2`]: position,
    [`${axis.counterUnits.pos}1`]: offset,
    [`${axis.counterUnits.pos}2`]: offset + length
  } as Record<'x1' | 'y1' | 'x2' | 'y2', number>;

  const gridElement = group.elem('line', positionalData, classes.join(' '));

  // Event for grid draw
  eventEmitter.emit<GridDrawEvent>('draw', {
    type: 'grid',
    axis,
    index,
    group,
    element: gridElement,
    ...positionalData
  });
}

/**
 * Creates a grid background rect and emits the draw event.
 */
export function createGridBackground(
  gridGroup: Svg,
  chartRect: ChartRect,
  className: string,
  eventEmitter: EventEmitter
) {
  const gridBackground = gridGroup.elem(
    'rect',
    {
      x: chartRect.x1,
      y: chartRect.y2,
      width: chartRect.width(),
      height: chartRect.height()
    },
    className,
    true
  );

  // Event for grid background draw
  eventEmitter.emit<GridBackgroundDrawEvent>('draw', {
    type: 'gridBackground',
    group: gridGroup,
    element: gridBackground
  });
}

/**
 * Creates a label based on a projected value and an axis.
 */
export function createLabel(
  position: number,
  length: number,
  index: number,
  label: Label,
  axis: Axis,
  axisOffset: number,
  labelOffset: { x: number; y: number },
  group: Svg,
  classes: string[],
  eventEmitter: EventEmitter
) {
  const positionalData = {
    [axis.units.pos]: position + labelOffset[axis.units.pos],
    [axis.counterUnits.pos]: labelOffset[axis.counterUnits.pos],
    [axis.units.len]: length,
    [axis.counterUnits.len]: Math.max(0, axisOffset - 10)
  } as Record<'x' | 'y' | 'width' | 'height', number>;
  // We need to set width and height explicitly to px as span will not expand with width and height being
  // 100% in all browsers
  const stepLength = Math.round(positionalData[axis.units.len]);
  const stepCounterLength = Math.round(positionalData[axis.counterUnits.len]);
  const content = document.createElement('span');

  content.className = classes.join(' ');
  content.style[axis.units.len] = stepLength + 'px';
  content.style[axis.counterUnits.len] = stepCounterLength + 'px';
  content.textContent = String(label);

  const labelElement = group.foreignObject(content, {
    style: 'overflow: visible;',
    ...positionalData
  });

  eventEmitter.emit<LabelDrawEvent>('draw', {
    type: 'label',
    axis,
    index,
    group,
    element: labelElement,
    text: label,
    ...positionalData
  });
}
