import 'chartist/styles.css';
import { lineChart, times } from 'chartist';

// A tiny seeded random generator (mulberry32): same chart on every load.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(42);

const data = times(52).reduce<{
  labels: number[];
  series: number[][];
}>(
  (accData, _, index) => {
    accData.labels.push(index + 1);
    accData.series.forEach(series => {
      series.push(random() * 100);
    });

    return accData;
  },
  {
    labels: [],
    series: times(4).map(() => [])
  }
);

lineChart(
  '#chart',
  data,
  {
    showLine: false,
    axisX: {
      labelTransform(value, index) {
        return index % 13 === 0 ? 'W' + value : null;
      }
    }
  },
  [
    [
      'screen and (min-width: 640px)',
      {
        axisX: {
          labelTransform(value, index) {
            return index % 4 === 0 ? 'W' + value : null;
          }
        }
      }
    ]
  ]
);
