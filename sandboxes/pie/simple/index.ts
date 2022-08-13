import 'chartist/dist/index.css';
import { PieChart } from 'chartist';

const data = {
  series: [5, 3, 4]
};

new PieChart('#chart', data, {
  labelInterpolationFnc: value =>
    Math.round((+value / data.series.reduce((a, b) => a + b)) * 100) + '%'
});
