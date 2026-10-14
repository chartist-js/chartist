import 'chartist/styles.css';
import './style.css';
import { lineChart, AutoScaleAxis } from 'chartist';
import { fromLegacyPlugin } from 'chartist/compat';

// Plugin scripts register on the global `Chartist`.
const { plugins } = Chartist;
const button = document.querySelector<HTMLButtonElement>('#reset')!;
let reset: (() => void) | undefined;

const points = Array.from({ length: 40 }, (_, x) => ({
  x,
  y: Math.round(10 + 8 * Math.sin(x / 4) + x / 3)
}));

lineChart(
  '#chart',
  { series: [points] },
  {
    // The plugin zooms auto and fixed scale axes, not the default step axis.
    axisX: { type: AutoScaleAxis, onlyInteger: true, scaleMinSpace: 40 },
    axisY: { type: AutoScaleAxis },
    plugins: [
      fromLegacyPlugin(
        plugins.zoom({
          onZoom: (_chart: unknown, resetZoom: () => void) => {
            reset = resetZoom;
            button.disabled = false;
          }
        })
      )
    ]
  }
);

button.addEventListener('click', () => {
  reset?.();
  button.disabled = true;
});
