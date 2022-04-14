import '../styles/chartist.scss';
import { PieChart } from './pie';

export default {
  title: 'PieChart',
  argTypes: {}
};

export function Default() {
  const root = document.createElement('div');

  new PieChart(root, {
    series: [5, 3, 4]
  }, {
    width: 100,
    height: 100,
    chartPadding: 10
  });

  return root
}
