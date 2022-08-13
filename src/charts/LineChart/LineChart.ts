import type { Axis } from '../../axes';
import type {
  LineChartData,
  LineChartOptions,
  LineChartOptionsWithDefaults,
  LineChartCreatedEvent,
  PointDrawEvent,
  LineDrawEvent,
  AreaDrawEvent,
  LineChartEventsTypes
} from './LineChart.types';
import type {
  SegmentData,
  Series,
  SeriesObject,
  ResponsiveOptions
} from '../../core';
import {
  alphaNumerate,
  normalizeData,
  serialize,
  getMetaData,
  createSvg,
  createChartRect,
  createGridBackground
} from '../../core';
import { isNumeric, noop, extend, safeHasProperty } from '../../utils';
import { StepAxis, AutoScaleAxis, axisUnits } from '../../axes';
import { monotoneCubic, none } from '../../interpolation';
import { BaseChart } from './../BaseChart';

export function getSeriesOption<
  T extends keyof Omit<LineChartOptionsWithDefaults, 'series'>
>(
  series: Series | SeriesObject,
  options: LineChartOptionsWithDefaults,
  key: T
) {
  if (
    safeHasProperty(series, 'name') &&
    series.name &&
    options.series?.[series.name]
  ) {
    const seriesOptions = options?.series[series.name];
    const value = seriesOptions[key];
    const result = value === undefined ? options[key] : value;

    return result as LineChartOptionsWithDefaults[T];
  } else {
    return options[key];
  }
}

/**
 * Default options in line charts. Expand the code view to see a detailed list of options with comments.
 */
const defaultOptions = {
  // Options for X-Axis
  axisX: {
    // The offset of the labels to the chart area
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
    // Set the axis type to be used to project values on this axis. If not defined, Chartist.StepAxis will be used for the X-Axis, where the ticks option will be set to the labels in the data and the stretch option will be set to the global fullWidth option. This type can be changed to any axis constructor available (e.g. Chartist.FixedScaleAxis), where all axis options should be present here.
    type: undefined
  },
  // Options for Y-Axis
  axisY: {
    // The offset of the labels to the chart area
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
    // Set the axis type to be used to project values on this axis. If not defined, Chartist.AutoScaleAxis will be used for the Y-Axis, where the high and low options will be set to the global high and low options. This type can be changed to any axis constructor available (e.g. Chartist.FixedScaleAxis), where all axis options should be present here.
    type: undefined,
    // This value specifies the minimum height in pixel of the scale steps
    scaleMinSpace: 20,
    // Use only integer values (whole numbers) for the scale steps
    onlyInteger: false
  },
  // Specify a fixed width for the chart as a string (i.e. '100px' or '50%')
  width: undefined,
  // Specify a fixed height for the chart as a string (i.e. '100px' or '50%')
  height: undefined,
  // If the line should be drawn or not
  showLine: true,
  // If dots should be drawn or not
  showPoint: true,
  // If the line chart should draw an area
  showArea: false,
  // The base for the area chart that will be used to close the area shape (is normally 0)
  areaBase: 0,
  // Specify if the lines should be smoothed. This value can be true or false where true will result in smoothing using the default smoothing interpolation function Chartist.Interpolation.cardinal and false results in Chartist.Interpolation.none. You can also choose other smoothing / interpolation functions available in the Chartist.Interpolation module, or write your own interpolation function. Check the examples for a brief description.
  lineSmooth: true,
  // If the line chart should add a background fill to the .ct-grids group.
  showGridBackground: false,
  // Overriding the natural low of the chart allows you to zoom in or limit the charts lowest displayed value
  low: undefined,
  // Overriding the natural high of the chart allows you to zoom in or limit the charts highest displayed value
  high: undefined,
  // Padding of the chart drawing area to the container element and labels as a number or padding object {top: 5, right: 5, bottom: 5, left: 5}
  chartPadding: {
    top: 15,
    right: 15,
    bottom: 5,
    left: 10
  },
  // When set to true, the last grid line on the x-axis is not drawn and the chart elements will expand to the full available width of the chart. For the last label to be drawn correctly you might need to add chart padding or offset the last label with a draw event handler.
  fullWidth: false,
  // If true the whole data is reversed including labels, the series order as well as the whole series data arrays.
  reverseData: false,
  // Override the class names that get used to generate the SVG structure of the chart
  classNames: {
    chart: 'ct-chart-line',
    label: 'ct-label',
    labelGroup: 'ct-labels',
    series: 'ct-series',
    line: 'ct-line',
    point: 'ct-point',
    area: 'ct-area',
    grid: 'ct-grid',
    gridGroup: 'ct-grids',
    gridBackground: 'ct-grid-background',
    vertical: 'ct-vertical',
    horizontal: 'ct-horizontal',
    start: 'ct-start',
    end: 'ct-end'
  }
};

export class LineChart extends BaseChart<LineChartEventsTypes> {
  /**
   * This method creates a new line chart.
   * @param query A selector query string or directly a DOM element
   * @param data The data object that needs to consist of a labels and a series array
   * @param options The options object with options that override the default options. Check the examples for a detailed list.
   * @param responsiveOptions Specify an array of responsive option arrays which are a media query and options object pair => [[mediaQueryString, optionsObject],[more...]]
   * @return An object which exposes the API for the created chart
   *
   * @example
   * // Create a simple line chart
   * const data = {
   *   // A labels array that can contain any sort of values
   *   labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
   *   // Our series array that contains series objects or in this case series data arrays
   *   series: [
   *     [5, 2, 4, 2, 0]
   *   ]
   * };
   *
   * // As options we currently only set a static size of 300x200 px
   * const options = {
   *   width: '300px',
   *   height: '200px'
   * };
   *
   * // In the global name space Chartist we call the Line function to initialize a line chart. As a first parameter we pass in a selector where we would like to get our chart created. Second parameter is the actual data object and as a third parameter we pass in our options
   * new LineChart('.ct-chart', data, options);
   *
   * @example
   * // Use specific interpolation function with configuration from the Chartist.Interpolation module
   *
   * const chart = new LineChart('.ct-chart', {
   *   labels: [1, 2, 3, 4, 5],
   *   series: [
   *     [1, 1, 8, 1, 7]
   *   ]
   * }, {
   *   lineSmooth: Chartist.Interpolation.cardinal({
   *     tension: 0.2
   *   })
   * });
   *
   * @example
   * // Create a line chart with responsive options
   *
   * const data = {
   *   // A labels array that can contain any sort of values
   *   labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
   *   // Our series array that contains series objects or in this case series data arrays
   *   series: [
   *     [5, 2, 4, 2, 0]
   *   ]
   * };
   *
   * // In addition to the regular options we specify responsive option overrides that will override the default configutation based on the matching media queries.
   * const responsiveOptions = [
   *   ['screen and (min-width: 641px) and (max-width: 1024px)', {
   *     showPoint: false,
   *     axisX: {
   *       labelInterpolationFnc: function(value) {
   *         // Will return Mon, Tue, Wed etc. on medium screens
   *         return value.slice(0, 3);
   *       }
   *     }
   *   }],
   *   ['screen and (max-width: 640px)', {
   *     showLine: false,
   *     axisX: {
   *       labelInterpolationFnc: function(value) {
   *         // Will return M, T, W etc. on small screens
   *         return value[0];
   *       }
   *     }
   *   }]
   * ];
   *
   * new LineChart('.ct-chart', data, null, responsiveOptions);
   *
   */
  constructor(
    query: string | Element | null,
    protected override data: LineChartData,
    options?: LineChartOptions,
    responsiveOptions?: ResponsiveOptions<LineChartOptions>
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
  createChart(options: LineChartOptionsWithDefaults) {
    const { data } = this;
    const normalizedData = normalizeData(data, options.reverseData, true);

    // Create new svg object
    const svg = createSvg(
      this.container,
      options.width,
      options.height,
      options.classNames.chart
    );

    this.svg = svg;

    // Create groups for labels, grid and series
    const gridGroup = svg.elem('g').addClass(options.classNames.gridGroup);
    const seriesGroup = svg.elem('g');
    const labelGroup = svg.elem('g').addClass(options.classNames.labelGroup);

    const chartRect = createChartRect(svg, options);
    let axisX: Axis;
    let axisY: Axis;

    if (options.axisX.type === undefined) {
      axisX = new StepAxis(axisUnits.x, normalizedData.series, chartRect, {
        ...options.axisX,
        ticks: normalizedData.labels,
        stretch: options.fullWidth
      });
    } else {
      // eslint-disable-next-line new-cap
      axisX = new options.axisX.type(
        axisUnits.x,
        normalizedData.series,
        chartRect,
        options.axisX
      );
    }

    if (options.axisY.type === undefined) {
      axisY = new AutoScaleAxis(axisUnits.y, normalizedData.series, chartRect, {
        ...options.axisY,
        high: isNumeric(options.high) ? options.high : options.axisY.high,
        low: isNumeric(options.low) ? options.low : options.axisY.low
      });
    } else {
      // eslint-disable-next-line new-cap
      axisY = new options.axisY.type(
        axisUnits.y,
        normalizedData.series,
        chartRect,
        options.axisY
      );
    }

    axisX.createGridAndLabels(
      gridGroup,
      labelGroup,
      options,
      this.eventEmitter
    );
    axisY.createGridAndLabels(
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

      const pathCoordinates: number[] = [];
      const pathData: SegmentData[] = [];

      normalizedData.series[seriesIndex].forEach((value, valueIndex) => {
        const p = {
          x:
            chartRect.x1 +
            axisX.projectValue(
              value,
              valueIndex,
              normalizedData.series[seriesIndex]
            ),
          y:
            chartRect.y1 -
            axisY.projectValue(
              value,
              valueIndex,
              normalizedData.series[seriesIndex]
            )
        };
        pathCoordinates.push(p.x, p.y);
        pathData.push({
          value,
          valueIndex,
          meta: getMetaData(series, valueIndex)
        });
      });

      const seriesOptions = {
        lineSmooth: getSeriesOption(series, options, 'lineSmooth'),
        showPoint: getSeriesOption(series, options, 'showPoint'),
        showLine: getSeriesOption(series, options, 'showLine'),
        showArea: getSeriesOption(series, options, 'showArea'),
        areaBase: getSeriesOption(series, options, 'areaBase')
      };

      let smoothing;
      if (typeof seriesOptions.lineSmooth === 'function') {
        smoothing = seriesOptions.lineSmooth;
      } else {
        smoothing = seriesOptions.lineSmooth ? monotoneCubic() : none();
      }

      // Interpolating path where pathData will be used to annotate each path element so we can trace back the original
      // index, value and meta data
      const path = smoothing(pathCoordinates, pathData);

      // If we should show points we need to create them now to avoid secondary loop
      // Points are drawn from the pathElements returned by the interpolation function
      // Small offset for Firefox to render squares correctly
      if (seriesOptions.showPoint) {
        path.pathElements.forEach(pathElement => {
          const { data: pathElementData } = pathElement;
          const point = seriesElement.elem(
            'line',
            {
              x1: pathElement.x,
              y1: pathElement.y,
              x2: pathElement.x + 0.01,
              y2: pathElement.y
            },
            options.classNames.point
          );

          if (pathElementData) {
            let x: number | undefined;
            let y: number | undefined;

            if (safeHasProperty(pathElementData.value, 'x')) {
              x = pathElementData.value.x;
            }

            if (safeHasProperty(pathElementData.value, 'y')) {
              y = pathElementData.value.y;
            }

            point.attr({
              'ct:value': [x, y].filter(isNumeric).join(','),
              'ct:meta': serialize(pathElementData.meta)
            });
          }

          this.eventEmitter.emit<PointDrawEvent>('draw', {
            type: 'point',
            value: pathElementData?.value,
            index: pathElementData?.valueIndex || 0,
            meta: pathElementData?.meta,
            series,
            seriesIndex,
            axisX,
            axisY,
            group: seriesElement,
            element: point,
            x: pathElement.x,
            y: pathElement.y,
            chartRect
          });
        });
      }

      if (seriesOptions.showLine) {
        const line = seriesElement.elem(
          'path',
          {
            d: path.stringify()
          },
          options.classNames.line,
          true
        );

        this.eventEmitter.emit<LineDrawEvent>('draw', {
          type: 'line',
          values: normalizedData.series[seriesIndex],
          path: path.clone(),
          chartRect,
          // TODO: Remove redundant
          index: seriesIndex,
          series,
          seriesIndex,
          meta: seriesMeta,
          axisX,
          axisY,
          group: seriesElement,
          element: line
        });
      }

      // Area currently only works with axes that support a range!
      if (seriesOptions.showArea && axisY.range) {
        // If areaBase is outside the chart area (< min or > max) we need to set it respectively so that
        // the area is not drawn outside the chart area.
        const areaBase = Math.max(
          Math.min(seriesOptions.areaBase, axisY.range.max),
          axisY.range.min
        );

        // We project the areaBase value into screen coordinates
        const areaBaseProjected = chartRect.y1 - axisY.projectValue(areaBase);

        // In order to form the area we'll first split the path by move commands so we can chunk it up into segments
        path
          .splitByCommand('M')
          // We filter only "solid" segments that contain more than one point. Otherwise there's no need for an area
          .filter(pathSegment => pathSegment.pathElements.length > 1)
          .map(solidPathSegments => {
            // Receiving the filtered solid path segments we can now convert those segments into fill areas
            const firstElement = solidPathSegments.pathElements[0];
            const lastElement =
              solidPathSegments.pathElements[
                solidPathSegments.pathElements.length - 1
              ];

            // Cloning the solid path segment with closing option and removing the first move command from the clone
            // We then insert a new move that should start at the area base and draw a straight line up or down
            // at the end of the path we add an additional straight line to the projected area base value
            // As the closing option is set our path will be automatically closed
            return solidPathSegments
              .clone(true)
              .position(0)
              .remove(1)
              .move(firstElement.x, areaBaseProjected)
              .line(firstElement.x, firstElement.y)
              .position(solidPathSegments.pathElements.length + 1)
              .line(lastElement.x, areaBaseProjected);
          })
          .forEach(areaPath => {
            // For each of our newly created area paths, we'll now create path elements by stringifying our path objects
            // and adding the created DOM elements to the correct series group
            const area = seriesElement.elem(
              'path',
              {
                d: areaPath.stringify()
              },
              options.classNames.area,
              true
            );

            // Emit an event for each area that was drawn
            this.eventEmitter.emit<AreaDrawEvent>('draw', {
              type: 'area',
              values: normalizedData.series[seriesIndex],
              path: areaPath.clone(),
              series,
              seriesIndex,
              axisX,
              axisY,
              chartRect,
              // TODO: Remove redundant
              index: seriesIndex,
              group: seriesElement,
              element: area,
              meta: seriesMeta
            });
          });
      }
    });

    this.eventEmitter.emit<LineChartCreatedEvent>('created', {
      chartRect,
      axisX,
      axisY,
      svg,
      options
    });
  }
}
