import 'chartist/styles.css';
import '@chartist-js/essentials/styles.css';
import './style.css';
import { alphaNumerate, findAll, lineChart } from 'chartist';
import { trendLine } from '@chartist-js/essentials';

const fit = document.querySelector('#fit')!;
const shops = ['Basel', 'Bern'];

// Two shops over twelve weeks: one grows steadily, one jumps around. Both
// trend lines rise, but only one fits its values well.
lineChart(
  '#chart',
  {
    labels: Array.from({ length: 12 }, (_, week) => `${week + 1}`),
    series: [
      {
        name: shops[0],
        data: [20, 22, 25, 24, 28, 30, 31, 34, 33, 37, 39, 41]
      },
      { name: shops[1], data: [18, 34, 15, 29, 40, 22, 38, 19, 44, 27, 35, 46] }
    ]
  },
  {
    showPoint: false,
    lineSmooth: false,
    layers: { above: [trendLine()] },
    on: {
      // Each trend line's node knows its slope and its correlation r; r²
      // is the share of the ups and downs the line explains.
      scene: ({ scene }) => {
        fit.replaceChildren(
          ...findAll(scene, { role: 'trendLine' }).map(({ ctx }) => {
            const row = document.createElement('span');
            // The series class gives the name its series' color.
            row.className = `ct-series-${alphaNumerate(ctx.seriesIndex)}`;
            const r2 = (ctx.correlation ?? 0) ** 2;
            row.textContent = `${shops[ctx.seriesIndex]}: +${ctx.slope.toFixed(1)} a week, R² ${r2.toFixed(2)}`;
            return row;
          })
        );
      }
    }
  }
);
