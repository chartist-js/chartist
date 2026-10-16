import 'chartist/styles.css';
import {
  lineChart,
  type LineChartPresetOptions,
  type PresetResponsiveOptions
} from 'chartist';

/* Add a basic data series with six labels and values */
const data = {
  labels: ['1', '2', '3', '4', '5', '6'],
  series: [
    {
      data: [1, 2, 3, 5, 8, 13]
    }
  ]
};

/* Set some base options (settings will override the default settings in js *see default settings*). We are adding a basic label interpolation function for the xAxis labels. */
const options: LineChartPresetOptions = {
  axisX: {
    labelTransform: value => 'Calendar Week ' + value
  }
};

/* Now we can specify multiple responsive settings that will override the base settings based on order and if the media queries match. In this example we are changing the visibility of dots and lines as well as use different label interpolations for space reasons. */
const responsiveOptions: PresetResponsiveOptions<LineChartPresetOptions> = [
  [
    'screen and (min-width: 641px) and (max-width: 1024px)',
    {
      showPoint: false,
      axisX: {
        labelTransform: value => 'Week ' + value
      }
    }
  ],
  [
    'screen and (max-width: 640px)',
    {
      showLine: false,
      axisX: {
        labelTransform: value => 'W' + value
      }
    }
  ]
];

/* Initialize the chart with the above settings */
lineChart('#chart', data, options, responsiveOptions);
