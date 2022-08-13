import type { Axis } from '../../axes';
import type {
  BarChartData,
  BarChartOptions,
  BarChartOptionsWithDefaults,
  BarChartCreatedEvent,
  BarDrawEvent,
  BarChartEventsTypes
} from './BarChart.types';
import type { NormalizedSeries, ResponsiveOptions } from '../../core';
import {
  isNumeric,
  noop,
  serialMap,
  extend,
  safeHasProperty
} from '../../utils';
import {
  alphaNumerate,
  normalizeData,
  serialize,
  getMetaData,
  getHighLow,
  createSvg,
  createChartRect,
  createGridBackground
} from '../../core';
import { AutoScaleAxis, StepAxis, axisUnits } from '../../axes';
import { BaseChart } from '../BaseChart';

function getSerialSums(series: NormalizedSeries[]) {
  return serialMap(series, (...args) =>
    Array.from(args).reduce<{ x: number; y: number }>(
      (prev, curr) => {
        return {
          x: prev.x + (safeHasProperty(curr, 'x') ? curr.x : 0),
          y: prev.y + (safeHasProperty(curr, 'y') ? curr.y : 0)
        };
      },
      { x: 0, y: 0 }
    )
  );
}

/**
 * Default options in bar charts. Expand the code view to see a detailed list of options with comments.
 */
const defaultOptions = {
  // Options for X-Axis
  axisX: {
    // The offset of the chart drawing area to the border of the container
    offset: 30,
    // Position where labels are placed. Can be set to `start` or `end` where `start` is equivalent to left or top on vertical axis and `end` is equivalent to right or bottom on horizontal axis.
    position: 'end' as const,
    // Allows you to correct label positioning on this axis by positive or negative x and y offset.
    labelOffset: {
      x: 0,
      y: 0
    },
    // If labels should be shown or not
    showLabel: true,
    // If the axis grid should be drawn or not
    showGrid: true,
    // Interpolation function that allows you to intercept the value from the axis label
    labelInterpolationFnc: noop,
    // This value specifies the minimum width in pixel of the scale steps
    scaleMinSpace: 30,
    // Use only integer values (whole numbers) for the scale steps
    onlyInteger: false
  },
  // Options for Y-Axis
  axisY: {
    // The offset of the chart drawing area to the border of the container
    offset: 40,
    // Position where labels are placed. Can be set to `start` or `end` where `start` is equivalent to left or top on vertical axis and `end` is equivalent to right or bottom on horizontal axis.
    position: 'start' as const,
    // Allows you to correct label positioning on this axis by positive or negative x and y offset.
    labelOffset: {
      x: 0,
      y: 0
    },
    // If labels should be shown or not
    showLabel: true,
    // If the axis grid should be drawn or not
    showGrid: true,
    // Interpolation function that allows you to intercept the value from the axis label
    labelInterpolationFnc: noop,
    // This value specifies the minimum height in pixel of the scale steps
    scaleMinSpace: 20,
    // Use only integer values (whole numbers) for the scale steps
    onlyInteger: false
  },
  // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
  width: undefined,
  // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
  height: undefined,
  // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
  high: undefined,
  // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
  low: undefined,
  // Unless low/high are explicitly set, bar chart will be centered at zero by default. Set referenceValue to null to auto scale.
  referenceValue: 0,
  // Padding of the chart drawing area to the container element and labels as a number or padding object {top: 5, right: 5, bottom: 5, left: 5}
  chartPadding: {
    top: 15,
    right: 15,
    bottom: 5,
    left: 10
  },
  // Specify the distance in pixel of bars in a group
  seriesBarDistance: 15,
  // If set to true this property will cause the series bars to be stacked. Check the `stackMode` option for further stacking options.
  stackBars: false,
  // If set to 'overlap' this property will force the stacked bars to draw from the zero line.
  // If set to 'accumulate' this property will form a total for each series point. This will also influence the y-axis and the overall bounds of the chart. In stacked mode the seriesBarDistance property will have no effect.
  stackMode: 'accumulate' as const,
  // Inverts the axes of the bar chart in order to draw a horizontal bar chart. Be aware that you also need to invert your axis settings as the Y Axis will now display the labels and the X Axis the values.
  horizontalBars: false,
  // If set to true then each bar will represent a series and the data array is expected to be a one dimensional array of data values rather than a series array of series. This is useful if the bar chart should represent a profile rather than some data over time.
  distributeSeries: false,
  // If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
  reverseData: false,
  // If the bar chart should add a background fill to the .ct-grids group.
  showGridBackground: false,
  // Override the class names that get used to generate the SVG structure of the chart
  classNames: {
    chart: 'ct-chart-bar',
    horizontalBars: 'ct-horizontal-bars',
    label: 'ct-label',
    labelGroup: 'ct-labels',
    series: 'ct-series',
    bar: 'ct-bar',
    grid: 'ct-grid',
    gridGroup: 'ct-grids',
    gridBackground: 'ct-grid-background',
    vertical: 'ct-vertical',
    horizontal: 'ct-horizontal',
    start: 'ct-start',
    end: 'ct-end'
  }
};

export class BarChart extends BaseChart<BarChartEventsTypes> {
  /**
   * This method creates a new bar chart and returns API object that you can use for later changes.
   * @param query A selector query string or directly a DOM element
   * @param data The data object that needs to consist of a labels and a series array
   * @param options The options object with options that override the default options. Check the examples for a detailed list.
   * @param responsiveOptions Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
   * @return An object which exposes the API for the created chart
   *
   * @example
   * // Create a simple bar chart
   * const data = {
   *   labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
   *   series: [
   *     [5, 2, 4, 2, 0]
   *   ]
   * };
   *
   * // In the global name space Chartist we call the Bar function to initialize a bar chart. As a first parameter we pass in a selector where we would like to get our chart created and as a second parameter we pass our data object.
   * new BarChart('.ct-chart', data);
   *
   * @example
   * // This example creates a bipolar grouped bar chart where the boundaries are limitted to -10 and 10
   * new BarChart('.ct-chart', {
   *   labels: [1, 2, 3, 4, 5, 6, 7],
   *   series: [
   *     [1, 3, 2, -5, -3, 1, -6],
   *     [-5, -2, -4, -1, 2, -3, 1]
   *   ]
   * }, {
   *   seriesBarDistance: 12,
   *   low: -10,
   *   high: 10
   * });
   *
   */
  constructor(
    query: string | Element | null,
    protected override data: BarChartData,
    options?: BarChartOptions,
    responsiveOptions?: ResponsiveOptions<BarChartOptions>
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
   * Creates a new chart
   */
  createChart(options: BarChartOptionsWithDefaults) {
    const { data } = this;
    const normalizedData = normalizeData(
      data,
      options.reverseData,
      options.horizontalBars ? 'x' : 'y',
      true
    );
    // Create new svg element
    const svg = createSvg(
      this.container,
      options.width,
      options.height,
      options.classNames.chart +
        (options.horizontalBars ? ' ' + options.classNames.horizontalBars : '')
    );
    const highLow =
      options.stackBars &&
      options.stackMode !== true &&
      normalizedData.series.length
        ? // If stacked bars we need to calculate the high low from stacked values from each series
          getHighLow(
            [getSerialSums(normalizedData.series)],
            options,
            options.horizontalBars ? 'x' : 'y'
          )
        : getHighLow(
            normalizedData.series,
            options,
            options.horizontalBars ? 'x' : 'y'
          );

    this.svg = svg;

    // Drawing groups in correct order
    const gridGroup = svg.elem('g').addClass(options.classNames.gridGroup);
    const seriesGroup = svg.elem('g');
    const labelGroup = svg.elem('g').addClass(options.classNames.labelGroup);

    // Overrides of high / low from settings
    if (typeof options.high === 'number') {
      highLow.high = options.high;
    }

    if (typeof options.low === 'number') {
      highLow.low = options.low;
    }

    const chartRect = createChartRect(svg, options);
    let valueAxis: Axis;
    const labelAxisTicks = // We need to set step count based on some options combinations
      options.distributeSeries && options.stackBars
        ? // If distributed series are enabled and bars need to be stacked, we'll only have one bar and therefore should
          // use only the first label for the step axis
          normalizedData.labels.slice(0, 1)
        : // If distributed series are enabled but stacked bars aren't, we should use the series labels
          // If we are drawing a regular bar chart with two dimensional series data, we just use the labels array
          // as the bars are normalized
          normalizedData.labels;
    let labelAxis: Axis;
    let axisX: Axis;
    let axisY: Axis;

    // Set labelAxis and valueAxis based on the horizontalBars setting. This setting will flip the axes if necessary.
    if (options.horizontalBars) {
      if (options.axisX.type === undefined) {
        valueAxis = axisX = new AutoScaleAxis(
          axisUnits.x,
          normalizedData.series,
          chartRect,
          { ...options.axisX, highLow: highLow, referenceValue: 0 }
        );
      } else {
        // eslint-disable-next-line new-cap
        valueAxis = axisX = new options.axisX.type(
          axisUnits.x,
          normalizedData.series,
          chartRect,
          { ...options.axisX, highLow: highLow, referenceValue: 0 }
        );
      }

      if (options.axisY.type === undefined) {
        labelAxis = axisY = new StepAxis(
          axisUnits.y,
          normalizedData.series,
          chartRect,
          {
            ticks: labelAxisTicks
          }
        );
      } else {
        // eslint-disable-next-line new-cap
        labelAxis = axisY = new options.axisY.type(
          axisUnits.y,
          normalizedData.series,
          chartRect,
          options.axisY
        );
      }
    } else {
      if (options.axisX.type === undefined) {
        labelAxis = axisX = new StepAxis(
          axisUnits.x,
          normalizedData.series,
          chartRect,
          {
            ticks: labelAxisTicks
          }
        );
      } else {
        // eslint-disable-next-line new-cap
        labelAxis = axisX = new options.axisX.type(
          axisUnits.x,
          normalizedData.series,
          chartRect,
          options.axisX
        );
      }

      if (options.axisY.type === undefined) {
        valueAxis = axisY = new AutoScaleAxis(
          axisUnits.y,
          normalizedData.series,
          chartRect,
          { ...options.axisY, highLow: highLow, referenceValue: 0 }
        );
      } else {
        // eslint-disable-next-line new-cap
        valueAxis = axisY = new options.axisY.type(
          axisUnits.y,
          normalizedData.series,
          chartRect,
          { ...options.axisY, highLow: highLow, referenceValue: 0 }
        );
      }
    }

    // Projected 0 point
    const zeroPoint = options.horizontalBars
      ? chartRect.x1 + valueAxis.projectValue(0)
      : chartRect.y1 - valueAxis.projectValue(0);
    // Used to track the screen coordinates of stacked bars
    const stackedBarValues: number[] = [];

    labelAxis.createGridAndLabels(
      gridGroup,
      labelGroup,
      options,
      this.eventEmitter
    );
    valueAxis.createGridAndLabels(
      gridGroup,
      labelGroup,
      options,
      this.eventEmitter
    );

    if (options.showGridBackground) {
      createGridBackground(
        gridGroup,
        chartRect,
        options.classNames.gridBackground,
        this.eventEmitter
      );
    }

    // Draw the series
    data.series.forEach((series, seriesIndex) => {
      // Calculating bi-polar value of index for seriesOffset. For i = 0..4 biPol will be -1.5, -0.5, 0.5, 1.5 etc.
      const biPol = seriesIndex - (data.series.length - 1) / 2;
      // Half of the period width between vertical grid lines used to position bars
      let periodHalfLength: number;

      // We need to set periodHalfLength based on some options combinations
      if (options.distributeSeries && !options.stackBars) {
        // If distributed series are enabled but stacked bars aren't, we need to use the length of the normaizedData array
        // which is the series count and divide by 2
        periodHalfLength =
          labelAxis.axisLength / normalizedData.series.length / 2;
      } else if (options.distributeSeries && options.stackBars) {
        // If distributed series and stacked bars are enabled we'll only get one bar so we should just divide the axis
        // length by 2
        periodHalfLength = labelAxis.axisLength / 2;
      } else {
        // On regular bar charts we should just use the series length
        periodHalfLength =
          labelAxis.axisLength / normalizedData.series[seriesIndex].length / 2;
      }

      // Adding the series group to the series element
      const seriesElement = seriesGroup.elem('g');
      const seriesName = safeHasProperty(series, 'name') && series.name;
      const seriesClassName =
        safeHasProperty(series, 'className') && series.className;
      const seriesMeta = safeHasProperty(series, 'meta')
        ? series.meta
        : undefined;

      // Write attributes to series group element. If series name or meta is undefined the attributes will not be written
      if (seriesName) {
        seriesElement.attr({
          'ct:series-name': seriesName
        });
      }

      if (seriesMeta) {
        seriesElement.attr({
          'ct:meta': serialize(seriesMeta)
        });
      }

      // Use series class from series data or if not set generate one
      seriesElement.addClass(
        [
          options.classNames.series,
          seriesClassName ||
            `${options.classNames.series}-${alphaNumerate(seriesIndex)}`
        ].join(' ')
      );

      normalizedData.series[seriesIndex].forEach((value, valueIndex) => {
        let labelAxisValueIndex;
        // We need to set labelAxisValueIndex based on some options combinations
        if (options.distributeSeries && !options.stackBars) {
          // If distributed series are enabled but stacked bars aren't, we can use the seriesIndex for later projection
          // on the step axis for label positioning
          labelAxisValueIndex = seriesIndex;
        } else if (options.distributeSeries && options.stackBars) {
          // If distributed series and stacked bars are enabled, we will only get one bar and therefore always use
          // 0 for projection on the label step axis
          labelAxisValueIndex = 0;
        } else {
          // On regular bar charts we just use the value index to project on the label step axis
          labelAxisValueIndex = valueIndex;
        }

        let projected;
        // We need to transform coordinates differently based on the chart layout
        if (options.horizontalBars) {
          projected = {
            x:
              chartRect.x1 +
              valueAxis.projectValue(
                safeHasProperty(value, 'x') ? value.x : 0,
                valueIndex,
                normalizedData.series[seriesIndex]
              ),
            y:
              chartRect.y1 -
              labelAxis.projectValue(
                safeHasProperty(value, 'y') ? value.y : 0,
                labelAxisValueIndex,
                normalizedData.series[seriesIndex]
              )
          };
        } else {
          projected = {
            x:
              chartRect.x1 +
              labelAxis.projectValue(
                safeHasProperty(value, 'x') ? value.x : 0,
                labelAxisValueIndex,
                normalizedData.series[seriesIndex]
              ),
            y:
              chartRect.y1 -
              valueAxis.projectValue(
                safeHasProperty(value, 'y') ? value.y : 0,
                valueIndex,
                normalizedData.series[seriesIndex]
              )
          };
        }

        // If the label axis is a step based axis we will offset the bar into the middle of between two steps using
        // the periodHalfLength value. Also we do arrange the different series so that they align up to each other using
        // the seriesBarDistance. If we don't have a step axis, the bar positions can be chosen freely so we should not
        // add any automated positioning.
        if (labelAxis instanceof StepAxis) {
          // Offset to center bar between grid lines, but only if the step axis is not stretched
          if (!labelAxis.stretch) {
            projected[labelAxis.units.pos] +=
              periodHalfLength * (options.horizontalBars ? -1 : 1);
          }
          // Using bi-polar offset for multiple series if no stacked bars or series distribution is used
          projected[labelAxis.units.pos] +=
            options.stackBars || options.distributeSeries
              ? 0
              : biPol *
                options.seriesBarDistance *
                (options.horizontalBars ? -1 : 1);
        }

        // Enter value in stacked bar values used to remember previous screen value for stacking up bars
        const previousStack = stackedBarValues[valueIndex] || zeroPoint;
        stackedBarValues[valueIndex] =
          previousStack - (zeroPoint - projected[labelAxis.counterUnits.pos]);

        // Skip if value is undefined
        if (value === undefined) {
          return;
        }

        const positions = {
          [`${labelAxis.units.pos}1`]: projected[labelAxis.units.pos],
          [`${labelAxis.units.pos}2`]: projected[labelAxis.units.pos]
        } as Record<'x1' | 'y1' | 'x2' | 'y2', number>;

        if (
          options.stackBars &&
          (options.stackMode === 'accumulate' || !options.stackMode)
        ) {
          // Stack mode: accumulate (default)
          // If bars are stacked we use the stackedBarValues reference and otherwise base all bars off the zero line
          // We want backwards compatibility, so the expected fallback without the 'stackMode' option
          // to be the original behaviour (accumulate)
          positions[`${labelAxis.counterUnits.pos}1`] = previousStack;
          positions[`${labelAxis.counterUnits.pos}2`] =
            stackedBarValues[valueIndex];
        } else {
          // Draw from the zero line normally
          // This is also the same code for Stack mode: overlap
          positions[`${labelAxis.counterUnits.pos}1`] = zeroPoint;
          positions[`${labelAxis.counterUnits.pos}2`] =
            projected[labelAxis.counterUnits.pos];
        }

        // Limit x and y so that they are within the chart rect
        positions.x1 = Math.min(
          Math.max(positions.x1, chartRect.x1),
          chartRect.x2
        );
        positions.x2 = Math.min(
          Math.max(positions.x2, chartRect.x1),
          chartRect.x2
        );
        positions.y1 = Math.min(
          Math.max(positions.y1, chartRect.y2),
          chartRect.y1
        );
        positions.y2 = Math.min(
          Math.max(positions.y2, chartRect.y2),
          chartRect.y1
        );

        const metaData = getMetaData(series, valueIndex);

        // Create bar element
        const bar = seriesElement
          .elem('line', positions, options.classNames.bar)
          .attr({
            'ct:value': [
              safeHasProperty(value, 'x') && value.x,
              safeHasProperty(value, 'y') && value.y
            ]
              .filter(isNumeric)
              .join(','),
            'ct:meta': serialize(metaData)
          });

        this.eventEmitter.emit<BarDrawEvent>('draw', {
          type: 'bar',
          value,
          index: valueIndex,
          meta: metaData,
          series,
          seriesIndex,
          axisX,
          axisY,
          chartRect,
          group: seriesElement,
          element: bar,
          ...positions
        });
      });
    });

    this.eventEmitter.emit<BarChartCreatedEvent>('created', {
      chartRect,
      axisX,
      axisY,
      svg,
      options
    });
  }
}
