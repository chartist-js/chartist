import type {
  LabelDirection,
  AnchorPosition,
  Dot,
  PieChartData,
  PieChartOptions,
  PieChartOptionsWithDefaults,
  PieChartCreatedEvent,
  SliceDrawEvent,
  SliceLabelDrawEvent,
  PieChartEventsTypes
} from './PieChart.types';
import type { Svg } from '../../svg';
import type { ResponsiveOptions } from '../../core';
import {
  alphaNumerate,
  quantity,
  normalizeData,
  serialize,
  createSvg,
  createChartRect,
  polarToCartesian
} from '../../core';
import {
  noop,
  sum,
  extend,
  isFalseyButZero,
  safeHasProperty
} from '../../utils';
import { SvgPath } from '../../svg';
import { BaseChart } from '../BaseChart';

/**
 * Default options in line charts. Expand the code view to see a detailed list of options with comments.
 */
const defaultOptions = {
  // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
  width: undefined,
  // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
  height: undefined,
  // Padding of the chart drawing area to the container element and labels as a number or padding object {top: 5, right: 5, bottom: 5, left: 5}
  chartPadding: 5,
  // Override the class names that are used to generate the SVG structure of the chart
  classNames: {
    chartPie: 'ct-chart-pie',
    chartDonut: 'ct-chart-donut',
    series: 'ct-series',
    slicePie: 'ct-slice-pie',
    sliceDonut: 'ct-slice-donut',
    label: 'ct-label'
  },
  // The start angle of the pie chart in degrees where 0 points north. A higher value offsets the start angle clockwise.
  startAngle: 0,
  // An optional total you can specify. By specifying a total value, the sum of the values in the series must be this total in order to draw a full pie. You can use this parameter to draw only parts of a pie or gauge charts.
  total: undefined,
  // If specified the donut CSS classes will be used and strokes will be drawn instead of pie slices.
  donut: false,
  // Specify the donut stroke width, currently done in javascript for convenience. May move to CSS styles in the future.
  // This option can be set as number or string to specify a relative width (i.e. 100 or '30%').
  donutWidth: 60,
  // If a label should be shown or not
  showLabel: true,
  // Label position offset from the standard position which is half distance of the radius. This value can be either positive or negative. Positive values will position the label away from the center.
  labelOffset: 0,
  // This option can be set to 'inside', 'outside' or 'center'. Positioned with 'inside' the labels will be placed on half the distance of the radius to the border of the Pie by respecting the 'labelOffset'. The 'outside' option will place the labels at the border of the pie and 'center' will place the labels in the absolute center point of the chart. The 'center' option only makes sense in conjunction with the 'labelOffset' option.
  labelPosition: 'inside',
  // An interpolation function for the label value
  labelInterpolationFnc: noop,
  // Label direction can be 'neutral', 'explode' or 'implode'. The labels anchor will be positioned based on those settings as well as the fact if the labels are on the right or left side of the center of the chart. Usually explode is useful when labels are positioned far away from the center.
  labelDirection: 'neutral',
  // If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
  reverseData: false,
  // If true empty values will be ignored to avoid drawing unnecessary slices and labels
  ignoreEmptyValues: false
};

/**
 * Determines SVG anchor position based on direction and center parameter
 */
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
  } else {
    return 'middle';
  }
}

export class PieChart extends BaseChart<PieChartEventsTypes> {
  /**
   * This method creates a new pie chart and returns an object that can be used to redraw the chart.
   * @param query A selector query string or directly a DOM element
   * @param data The data object in the pie chart needs to have a series property with a one dimensional data array. The values will be normalized against each other and don't necessarily need to be in percentage. The series property can also be an array of value objects that contain a value property and a className property to override the CSS class name for the series group.
   * @param options The options object with options that override the default options. Check the examples for a detailed list.
   * @param responsiveOptions Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
   *
   * @example
   * // Simple pie chart example with four series
   * new PieChart('.ct-chart', {
   *   series: [10, 2, 4, 3]
   * });
   *
   * @example
   * // Drawing a donut chart
   * new PieChart('.ct-chart', {
   *   series: [10, 2, 4, 3]
   * }, {
   *   donut: true
   * });
   *
   * @example
   * // Using donut, startAngle and total to draw a gauge chart
   * new PieChart('.ct-chart', {
   *   series: [20, 10, 30, 40]
   * }, {
   *   donut: true,
   *   donutWidth: 20,
   *   startAngle: 270,
   *   total: 200
   * });
   *
   * @example
   * // Drawing a pie chart with padding and labels that are outside the pie
   * new PieChart('.ct-chart', {
   *   series: [20, 10, 30, 40]
   * }, {
   *   chartPadding: 30,
   *   labelOffset: 50,
   *   labelDirection: 'explode'
   * });
   *
   * @example
   * // Overriding the class names for individual series as well as a name and meta data.
   * // The name will be written as ct:series-name attribute and the meta data will be serialized and written
   * // to a ct:meta attribute.
   * new PieChart('.ct-chart', {
   *   series: [{
   *     value: 20,
   *     name: 'Series 1',
   *     className: 'my-custom-class-one',
   *     meta: 'Meta One'
   *   }, {
   *     value: 10,
   *     name: 'Series 2',
   *     className: 'my-custom-class-two',
   *     meta: 'Meta Two'
   *   }, {
   *     value: 70,
   *     name: 'Series 3',
   *     className: 'my-custom-class-three',
   *     meta: 'Meta Three'
   *   }]
   * });
   */
  constructor(
    query: string | Element | null,
    protected override data: PieChartData,
    options?: PieChartOptions,
    responsiveOptions?: ResponsiveOptions<PieChartOptions>
  ) {
    super(
      query,
      data,
      defaultOptions,
      extend({}, defaultOptions, options),
      responsiveOptions
    );
  }

  /**
   * Creates the pie chart
   *
   * @param options
   */
  createChart(options: PieChartOptionsWithDefaults) {
    const { data } = this;
    const normalizedData = normalizeData(data);
    const seriesGroups: Svg[] = [];
    let labelsGroup: Svg;
    let labelRadius: number;
    let startAngle = options.startAngle;

    // Create SVG.js draw
    const svg = createSvg(
      this.container,
      options.width,
      options.height,
      options.donut
        ? options.classNames.chartDonut
        : options.classNames.chartPie
    );

    this.svg = svg;

    // Calculate charting rect
    const chartRect = createChartRect(svg, options);
    // Get biggest circle radius possible within chartRect
    let radius = Math.min(chartRect.width() / 2, chartRect.height() / 2);
    // Calculate total of all series to get reference value or use total reference from optional options
    const totalDataSum = options.total || normalizedData.series.reduce(sum, 0);

    const donutWidth = quantity(options.donutWidth);
    if (donutWidth.unit === '%') {
      donutWidth.value *= radius / 100;
    }

    // If this is a donut chart we need to adjust our radius to enable strokes to be drawn inside
    // Unfortunately this is not possible with the current SVG Spec
    // See this proposal for more details: http://lists.w3.org/Archives/Public/www-svg/2003Oct/0000.html
    radius -= options.donut ? donutWidth.value / 2 : 0;

    // If labelPosition is set to `outside` or a donut chart is drawn then the label position is at the radius,
    // if regular pie chart it's half of the radius
    if (options.labelPosition === 'outside' || options.donut) {
      labelRadius = radius;
    } else if (options.labelPosition === 'center') {
      // If labelPosition is center we start with 0 and will later wait for the labelOffset
      labelRadius = 0;
    } else {
      // Default option is 'inside' where we use half the radius so the label will be placed in the center of the pie
      // slice
      labelRadius = radius / 2;
    }
    // Add the offset to the labelRadius where a negative offset means closed to the center of the chart
    if (options.labelOffset) {
      labelRadius += options.labelOffset;
    }

    // Calculate end angle based on total sum and current data value and offset with padding
    const center = {
      x: chartRect.x1 + chartRect.width() / 2,
      y: chartRect.y2 + chartRect.height() / 2
    };

    // Check if there is only one non-zero value in the series array.
    const hasSingleValInSeries =
      data.series.filter(val =>
        safeHasProperty(val, 'value') ? val.value !== 0 : val !== 0
      ).length === 1;

    // Creating the series groups
    data.series.forEach((_, index) => (seriesGroups[index] = svg.elem('g')));
    // if we need to show labels we create the label group now
    if (options.showLabel) {
      labelsGroup = svg.elem('g');
    }

    // Draw the series
    // initialize series groups
    data.series.forEach((series, index) => {
      // If current value is zero and we are ignoring empty values then skip to next value
      if (normalizedData.series[index] === 0 && options.ignoreEmptyValues) {
        return;
      }

      const seriesName = safeHasProperty(series, 'name') && series.name;
      const seriesClassName =
        safeHasProperty(series, 'className') && series.className;
      const seriesMeta = safeHasProperty(series, 'meta')
        ? series.meta
        : undefined;

      // If the series is an object and contains a name or meta data we add a custom attribute
      if (seriesName) {
        seriesGroups[index].attr({
          'ct:series-name': seriesName
        });
      }

      // Use series class from series data or if not set generate one
      seriesGroups[index].addClass(
        [
          options.classNames?.series,
          seriesClassName ||
            `${options.classNames?.series}-${alphaNumerate(index)}`
        ].join(' ')
      );

      // If the whole dataset is 0 endAngle should be zero. Can't divide by 0.
      let endAngle =
        totalDataSum > 0
          ? startAngle + (normalizedData.series[index] / totalDataSum) * 360
          : 0;

      // Use slight offset so there are no transparent hairline issues
      const overlappigStartAngle = Math.max(
        0,
        startAngle - (index === 0 || hasSingleValInSeries ? 0 : 0.2)
      );

      // If we need to draw the arc for all 360 degrees we need to add a hack where we close the circle
      // with Z and use 359.99 degrees
      if (endAngle - overlappigStartAngle >= 359.99) {
        endAngle = overlappigStartAngle + 359.99;
      }

      const start = polarToCartesian(
        center.x,
        center.y,
        radius,
        overlappigStartAngle
      );
      const end = polarToCartesian(center.x, center.y, radius, endAngle);

      // Create a new path element for the pie chart. If this isn't a donut chart we should close the path for a correct stroke
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

      // If regular pie chart (no donut) we add a line to the center of the circle for completing the pie
      if (!options.donut) {
        path.line(center.x, center.y);
      }

      // Create the SVG path
      // If this is a donut chart we add the donut class, otherwise just a regular slice
      const pathElement = seriesGroups[index].elem(
        'path',
        {
          d: path.stringify()
        },
        options.donut
          ? options.classNames.sliceDonut
          : options.classNames.slicePie
      );

      // Adding the pie series value to the path
      pathElement.attr({
        'ct:value': normalizedData.series[index],
        'ct:meta': serialize(seriesMeta)
      });

      // If this is a donut, we add the stroke-width as style attribute
      if (options.donut) {
        pathElement.attr({
          style: 'stroke-width: ' + donutWidth.value + 'px'
        });
      }

      // Fire off draw event
      this.eventEmitter.emit<SliceDrawEvent>('draw', {
        type: 'slice',
        value: normalizedData.series[index],
        totalDataSum: totalDataSum,
        index,
        meta: seriesMeta,
        series,
        group: seriesGroups[index],
        element: pathElement,
        path: path.clone(),
        center,
        radius,
        startAngle,
        endAngle,
        chartRect
      });

      // If we need to show labels we need to add the label for this slice now
      if (options.showLabel) {
        let labelPosition;

        if (data.series.length === 1) {
          // If we have only 1 series, we can position the label in the center of the pie
          labelPosition = {
            x: center.x,
            y: center.y
          };
        } else {
          // Position at the labelRadius distance from center and between start and end angle
          labelPosition = polarToCartesian(
            center.x,
            center.y,
            labelRadius,
            startAngle + (endAngle - startAngle) / 2
          );
        }

        let rawValue;
        if (
          normalizedData.labels &&
          !isFalseyButZero(normalizedData.labels[index])
        ) {
          rawValue = normalizedData.labels[index];
        } else {
          rawValue = normalizedData.series[index];
        }

        const interpolatedValue = options.labelInterpolationFnc(
          rawValue,
          index
        );

        if (interpolatedValue || interpolatedValue === 0) {
          const labelElement = labelsGroup
            .elem(
              'text',
              {
                dx: labelPosition.x,
                dy: labelPosition.y,
                'text-anchor': determineAnchorPosition(
                  center,
                  labelPosition,
                  options.labelDirection
                )
              },
              options.classNames.label
            )
            .text(String(interpolatedValue));

          // Fire off draw event
          this.eventEmitter.emit<SliceLabelDrawEvent>('draw', {
            type: 'label',
            index,
            group: labelsGroup,
            element: labelElement,
            text: '' + interpolatedValue,
            chartRect,
            series,
            meta: seriesMeta,
            ...labelPosition
          });
        }
      }

      // Set next startAngle to current endAngle.
      // (except for last slice)
      startAngle = endAngle;
    });

    this.eventEmitter.emit<PieChartCreatedEvent>('created', {
      chartRect,
      svg: svg,
      options
    });
  }
}
