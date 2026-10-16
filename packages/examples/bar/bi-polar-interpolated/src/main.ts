import 'chartist/styles.css';
import { barChart, type BarChartPresetOptions } from 'chartist';

const data = {
  labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
  series: [[1, 2, 4, 8, 6, -2, -1, -4, -6, -2]]
};

const options: BarChartPresetOptions = {
  high: 10,
  low: -10,
  axisX: {
    labelTransform(value, index) {
      return index % 2 === 0 ? value : null;
    }
  }
};

barChart('#chart', data, options);
