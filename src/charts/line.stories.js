import '../styles/chartist.scss';
import { LineChart } from './line';
import { AutoScaleAxis } from '../axes/axes';

export default {
  title: 'LineChart',
  argTypes: {}
};

export function Default() {
  const root = document.createElement('div');

  new LineChart(root, {
    series: [[
      {x: 1, y: 1},
      {x: 3, y: 5}
    ]]
  }, {
    axisX: {
      type: AutoScaleAxis,
      onlyInteger: true
    },
    axisY: {
      type: AutoScaleAxis,
      onlyInteger: true
    }
  });

  return root
}
