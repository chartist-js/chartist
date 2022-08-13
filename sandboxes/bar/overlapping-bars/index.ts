import 'chartist/dist/index.css';
import { BarChart, BarChartOptions, ResponsiveOptions } from 'chartist';

const data = {
  labels: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ],
  series: [
    [5, 4, 3, 7, 5, 10, 3, 4, 8, 10, 6, 8],
    [3, 2, 9, 5, 4, 6, 4, 6, 7, 8, 7, 4]
  ]
};

const options = {
  seriesBarDistance: 15
};

const responsiveOptions: ResponsiveOptions<BarChartOptions> = [
  [
    'screen and (min-width: 641px) and (max-width: 1024px)',
    {
      seriesBarDistance: 10,
      axisX: {
        labelInterpolationFnc: value => value
      }
    }
  ],
  [
    'screen and (max-width: 640px)',
    {
      seriesBarDistance: 5,
      axisX: {
        labelInterpolationFnc: value => String(value)[0]
      }
    }
  ]
];

new BarChart('#chart', data, options, responsiveOptions);
