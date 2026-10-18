import { lineChartConfig, renderForHydration } from 'chartist';

// The chart, as the server and the browser both draw it.
export const data = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [
    [12, 9, 7, 8, 5],
    [2, 1, 3.5, 7, 3]
  ]
};
export const options = { low: 0, showArea: true };

// On the server: the markup in index.html, laid out at 600 × 300. A docs
// script writes it there from this function, so it stays what the current
// build renders.
export function serverMarkup(): string {
  return renderForHydration(lineChartConfig(data, options), {
    width: 600,
    height: 300
  });
}
