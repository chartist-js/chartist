/** The line chart on the mascot's board (hero). */
import { lineChart, type ChartHandle, type ChartPlugin } from 'chartist';

const millions = (value: number | string) => {
  const m = Number(value) / 1e6;
  return m === 0 ? '0' : `${Number.isInteger(m) ? m : m.toFixed(1)}m.`;
};

/**
 * Draws the second line in (pathLength for .ct-draw); the first one
 * marches with dashes instead (mascot.css), as on the 0.x site.
 */
const boardDrawIn: ChartPlugin = {
  name: 'board-draw-in',
  install(handle) {
    handle.on('compose', node =>
      node.role === 'line' && node.ctx.seriesIndex > 0
        ? node.attr({ pathLength: 1 })
        : undefined
    );
  }
};

/** The board's data, also drawn on the share cards (lib/og-card.ts). */
export const BOARD_DATA = {
  labels: ['1st', '2nd', '3rd'],
  series: [
    // Claimed (dashed, marching) and counted: only the third was
    // recounted.
    [1280000, 3317752, 5706000],
    [1280000, 3317752, 1975496]
  ]
};
export const BOARD_HIGH = 6000000;

export function mountBoardChart(element: HTMLElement): ChartHandle {
  return lineChart(element, BOARD_DATA, {
    low: 0,
    high: BOARD_HIGH,
    fullWidth: true,
    chartPadding: { top: 12, right: 22, bottom: 0, left: 0 },
    axisX: { offset: 20 },
    axisY: {
      offset: 30,
      scaleMinSpace: 16,
      onlyInteger: true,
      labelInterpolationFnc: millions
    },
    plugins: [boardDrawIn]
  });
}

/** The hero's board chart(s): elements with data-board-chart. */
export function mountBoardCharts() {
  for (const element of document.querySelectorAll<HTMLElement>(
    '[data-board-chart]'
  )) {
    mountBoardChart(element);
  }
}
