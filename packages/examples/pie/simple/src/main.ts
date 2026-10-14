import 'chartist/styles.css';
import { pieChart } from 'chartist';

const data = {
  series: [5, 3, 4]
};

pieChart('#chart', data, {
  labelInterpolationFnc: value =>
    Math.round((+value / data.series.reduce((a, b) => a + b)) * 100) + '%'
});
