import 'chartist/dist/index.css';
import { PieChart, PieChartOptions, ResponsiveOptions } from 'chartist';

const data = {
  labels: ['Bananas', 'Apples', 'Grapes'],
  series: [20, 15, 40]
};

const options: PieChartOptions = {
  labelInterpolationFnc: value => String(value)[0]
};

const responsiveOptions: ResponsiveOptions<PieChartOptions> = [
  [
    'screen and (min-width: 640px)',
    {
      chartPadding: 30,
      labelOffset: 100,
      labelDirection: 'explode',
      labelInterpolationFnc: value => value
    }
  ],
  [
    'screen and (min-width: 1024px)',
    {
      labelOffset: 80,
      chartPadding: 20
    }
  ]
];

new PieChart('#chart', data, options, responsiveOptions);
