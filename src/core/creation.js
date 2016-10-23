import {namespaces} from './globals';
import {Svg} from '../svg/svg';
import {quantity} from './lang';
import {extend} from './extend';

/**
 * Create or reinitialize the SVG element for the chart
 *
 * @memberof Chartist.Core
 * @param {Node} container The containing DOM Node object that will be used to plant the SVG element
 * @param {String} width Set the width of the SVG element. Default is 100%
 * @param {String} height Set the height of the SVG element. Default is 100%
 * @param {String} className Specify a class to be added to the SVG element
 * @return {Object} The created/reinitialized SVG element
 */
export function createSvg(container, width, height, className) {
  var svg;

  width = width || '100%';
  height = height || '100%';

  // Check if there is a previous SVG element in the container that contains the Chartist XML namespace and remove it
  // Since the DOM API does not support namespaces we need to manually search the returned list http://www.w3.org/TR/selectors-api/
  Array.prototype.slice.call(container.querySelectorAll('svg')).filter(function filterChartistSvgObjects(svg) {
    return svg.getAttributeNS(namespaces.xmlns, 'ct');
  }).forEach(function removePreviousElement(svg) {
    container.removeChild(svg);
  });

  // Create svg object with width and height or use 100% as default
  svg = new Svg('svg').attr({
    width: width,
    height: height
  }).addClass(className).attr({
    style: 'width: ' + width + '; height: ' + height + ';'
  });

  // Add the DOM node to our container
  container.appendChild(svg._node);

  return svg;
}

/**
 * Converts a number into a padding object.
 *
 * @memberof Chartist.Core
 * @param {Object|Number} padding
 * @param {Number} [fallback] This value is used to fill missing values if a incomplete padding object was passed
 * @returns {Object} Returns a padding object containing top, right, bottom, left properties filled with the padding number passed in as argument. If the argument is something else than a number (presumably already a correct padding object) then this argument is directly returned.
 */
export function normalizePadding(padding, fallback) {
  fallback = fallback || 0;

  return typeof padding === 'number' ? {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  } : {
    top: typeof padding.top === 'number' ? padding.top : fallback,
    right: typeof padding.right === 'number' ? padding.right : fallback,
    bottom: typeof padding.bottom === 'number' ? padding.bottom : fallback,
    left: typeof padding.left === 'number' ? padding.left : fallback
  };
}

/**
 * Initialize chart drawing rectangle (area where chart is drawn) x1,y1 = bottom left / x2,y2 = top right
 *
 * @memberof Chartist.Core
 * @param {Object} svg The svg element for the chart
 * @param {Object} options The Object that contains all the optional values for the chart
 * @param {Number} [fallbackPadding] The fallback padding if partial padding objects are used
 * @return {Object} The chart rectangles coordinates inside the svg element plus the rectangles measurements
 */
export function createChartRect(svg, options, fallbackPadding) {
  var hasAxis = !!(options.axisX || options.axisY);
  var yAxisOffset = hasAxis ? options.axisY.offset : 0;
  var xAxisOffset = hasAxis ? options.axisX.offset : 0;
  // If width or height results in invalid value (including 0) we fallback to the unitless settings or even 0
  var width = svg.width() || quantity(options.width).value || 0;
  var height = svg.height() || quantity(options.height).value || 0;
  var normalizedPadding = normalizePadding(options.chartPadding, fallbackPadding);

  // If settings were to small to cope with offset (legacy) and padding, we'll adjust
  width = Math.max(width, yAxisOffset + normalizedPadding.left + normalizedPadding.right);
  height = Math.max(height, xAxisOffset + normalizedPadding.top + normalizedPadding.bottom);

  var chartRect = {
    padding: normalizedPadding,
    width: function () {
      return this.x2 - this.x1;
    },
    height: function () {
      return this.y1 - this.y2;
    }
  };

  if(hasAxis) {
    if (options.axisX.position === 'start') {
      chartRect.y2 = normalizedPadding.top + xAxisOffset;
      chartRect.y1 = Math.max(height - normalizedPadding.bottom, chartRect.y2 + 1);
    } else {
      chartRect.y2 = normalizedPadding.top;
      chartRect.y1 = Math.max(height - normalizedPadding.bottom - xAxisOffset, chartRect.y2 + 1);
    }

    if (options.axisY.position === 'start') {
      chartRect.x1 = normalizedPadding.left + yAxisOffset;
      chartRect.x2 = Math.max(width - normalizedPadding.right, chartRect.x1 + 1);
    } else {
      chartRect.x1 = normalizedPadding.left;
      chartRect.x2 = Math.max(width - normalizedPadding.right - yAxisOffset, chartRect.x1 + 1);
    }
  } else {
    chartRect.x1 = normalizedPadding.left;
    chartRect.x2 = Math.max(width - normalizedPadding.right, chartRect.x1 + 1);
    chartRect.y2 = normalizedPadding.top;
    chartRect.y1 = Math.max(height - normalizedPadding.bottom, chartRect.y2 + 1);
  }

  return chartRect;
}

/**
 * Creates a grid line based on a projected value.
 *
 * @memberof Chartist.Core
 * @param position
 * @param index
 * @param axis
 * @param offset
 * @param length
 * @param group
 * @param classes
 * @param eventEmitter
 */
export function createGrid(position, index, axis, offset, length, group, classes, eventEmitter) {
  var positionalData = {};
  positionalData[axis.units.pos + '1'] = position;
  positionalData[axis.units.pos + '2'] = position;
  positionalData[axis.counterUnits.pos + '1'] = offset;
  positionalData[axis.counterUnits.pos + '2'] = offset + length;

  var gridElement = group.elem('line', positionalData, classes.join(' '));

  // Event for grid draw
  eventEmitter.emit('draw',
    extend({
      type: 'grid',
      axis: axis,
      index: index,
      group: group,
      element: gridElement
    }, positionalData)
  );
}

/**
 * Creates a grid background rect and emits the draw event.
 *
 * @memberof Chartist.Core
 * @param gridGroup
 * @param chartRect
 * @param className
 * @param eventEmitter
 */
export function createGridBackground(gridGroup, chartRect, className, eventEmitter) {
  var gridBackground = gridGroup.elem('rect', {
    x: chartRect.x1,
    y: chartRect.y2,
    width: chartRect.width(),
    height: chartRect.height()
  }, className, true);

  // Event for grid background draw
  eventEmitter.emit('draw', {
    type: 'gridBackground',
    group: gridGroup,
    element: gridBackground
  });
}

/**
 * Creates a label based on a projected value and an axis.
 *
 * @memberof Chartist.Core
 * @param position
 * @param length
 * @param index
 * @param labels
 * @param axis
 * @param axisOffset
 * @param labelOffset
 * @param group
 * @param classes
 * @param useForeignObject
 * @param eventEmitter
 */
export function createLabel(position, length, index, labels, axis, axisOffset, labelOffset, group, classes, useForeignObject, eventEmitter) {
  var labelElement;
  var positionalData = {};

  positionalData[axis.units.pos] = position + labelOffset[axis.units.pos];
  positionalData[axis.counterUnits.pos] = labelOffset[axis.counterUnits.pos];
  positionalData[axis.units.len] = length;
  positionalData[axis.counterUnits.len] = Math.max(0, axisOffset - 10);

  if(useForeignObject) {
    // We need to set width and height explicitly to px as span will not expand with width and height being
    // 100% in all browsers
    var content = '<span class="' + classes.join(' ') + '" style="' +
      axis.units.len + ': ' + Math.round(positionalData[axis.units.len]) + 'px; ' +
      axis.counterUnits.len + ': ' + Math.round(positionalData[axis.counterUnits.len]) + 'px">' +
      labels[index] + '</span>';

    labelElement = group.foreignObject(content, extend({
      style: 'overflow: visible;'
    }, positionalData));
  } else {
    labelElement = group.elem('text', positionalData, classes.join(' ')).text(labels[index]);
  }

  eventEmitter.emit('draw', extend({
    type: 'label',
    axis: axis,
    index: index,
    group: group,
    element: labelElement,
    text: labels[index]
  }, positionalData));
}
