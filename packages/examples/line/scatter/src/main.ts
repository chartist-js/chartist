import 'chartist/styles.css';
import { lineChart } from 'chartist';

// A tiny seeded random generator (mulberry32): same chart on every load.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(584);

const data = Array.from({ length: 52 }).reduce<{
  labels: number[];
  series: number[][];
}>(
  (result, _, index) => {
    result.labels.push(index + 1);
    result.series.forEach(series => {
      // A whole number from 0 to 100
      series.push(Math.floor(random() * 101));
    });

    return result;
  },
  {
    labels: [],
    series: Array.from({ length: 4 }, () => [])
  }
);

lineChart(
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
