import 'chartist/styles.css';
import { pieChart } from 'chartist';

const data = {
  series: [5, 3, 4]
};
const sum = (a: number, b: number) => a + b;

pieChart('#chart', data, {
  width: 100,
  height: 100,
  chartPadding: 10,
  labelInterpolationFnc: value =>
    `${Math.round((Number(value) / data.series.reduce(sum)) * 100)}%`
});
