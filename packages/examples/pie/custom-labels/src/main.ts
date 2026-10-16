import 'chartist/styles.css';
import {
  pieChart,
  type PieChartPresetOptions,
  type PresetResponsiveOptions
} from 'chartist';

const data = {
  labels: ['Bananas', 'Apples', 'Grapes'],
  series: [20, 15, 40]
};

const options: PieChartPresetOptions = {
  labelTransform: value => String(value)[0]
};

const responsiveOptions: PresetResponsiveOptions<PieChartPresetOptions> = [
  [
    'screen and (min-width: 640px)',
    {
      chartPadding: 30,
      labelOffset: 100,
      labelDirection: 'explode',
      labelTransform: value => value
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

pieChart('#chart', data, options, responsiveOptions);
