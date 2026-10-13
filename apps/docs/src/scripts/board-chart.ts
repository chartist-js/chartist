/** The line chart on the mascot's board (hero). */
import { lineChart } from 'chartist';
import { drawIn } from './charts';

const millions = (value: number | string) => {
  const m = Number(value) / 1e6;
  return m === 0 ? '0' : `${Number.isInteger(m) ? m : m.toFixed(1)}m.`;
};

export function mountBoardChart(element: HTMLElement) {
  lineChart(
    element,
    {
      labels: ['1st', '2nd', '3rd'],
      series: [
        [1280000, 3317752, 5706000],
        [1883000, 2050000, 3706000]
      ]
    },
    {
      low: 0,
      high: 6000000,
      fullWidth: true,
      chartPadding: { top: 8, right: 18, bottom: 0, left: 0 },
      axisX: { offset: 18 },
      axisY: {
        offset: 30,
        scaleMinSpace: 16,
        onlyInteger: true,
        labelInterpolationFnc: millions
      },
      plugins: [drawIn]
    }
  );
}

for (const element of document.querySelectorAll<HTMLElement>(
  '[data-board-chart]'
)) {
  mountBoardChart(element);
}
