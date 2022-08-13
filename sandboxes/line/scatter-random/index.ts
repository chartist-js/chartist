import 'chartist/dist/index.css';
import { LineChart, times } from 'chartist';

const data = times(52).reduce<{
  labels: number[];
  series: number[][];
}>(
  (accData, _, index) => {
    accData.labels.push(index + 1);
    accData.series.forEach(series => {
      series.push(Math.random() * 100);
    });

    return accData;
  },
  {
    labels: [],
    series: times(4).map(() => [])
  }
);

new LineChart(
  '#chart',
  data,
  {
    showLine: false,
    axisX: {
      labelInterpolationFnc(value, index) {
        return index % 13 === 0 ? 'W' + value : null;
      }
    }
  },
  [
    [
      'screen and (min-width: 640px)',
      {
        axisX: {
          labelInterpolationFnc(value, index) {
            return index % 4 === 0 ? 'W' + value : null;
          }
        }
      }
    ]
  ]
);
