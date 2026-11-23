import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
import { pieChart } from 'chartist';
import { legend } from '@chartist-js/essentials';

const data = {
  labels: ['Search', 'Direct', 'Social', 'Email'],
  series: [48, 27, 15, 10]
};

// The slices show their share; the legend on the right names them.
pieChart('#chart', data, {
  donut: true,
  labelTransform: (_, index) => `${data.series[index]}%`,
  layers: { above: [legend({ side: 'right' })] }
});
