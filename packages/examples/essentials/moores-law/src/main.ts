import 'chartist/styles.css';
import './style.css';
import { autoScaleAxis, lineChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';
import { logAxis } from '@chartist-js/essentials';
import { processors } from './processors';

// Moore's law: the transistors on a chip double about every two years. On
// a linear axis that's a flat line and a wall at the end; on a log axis
// with minor grid lines, a straight climb from 2,250 to 114 billion.
const compact = new Intl.NumberFormat('en-US', { notation: 'compact' });
const log = logAxis({ minorTicks: true });
const linear = autoScaleAxis();

const chart = lineChart(
  '#chart',
  {
    series: [processors.map(({ name, x, y }) => ({ x, y, meta: name }))]
  },
  {
    showLine: false,
    // Room for the last X label, which starts at its tick.
    chartPadding: { right: 32 },
    axisX: { type: autoScaleAxis(), onlyInteger: true },
    axisY: {
      type: log,
      offset: 48,
      labelTransform: value => compact.format(Number(value))
    },
    // The points move from one scale to the other.
    renderer: liveDomRenderer({ animations: smilAnimations() })
  }
);

const button = document.querySelector<HTMLButtonElement>('#scale')!;
let onLog = true;
button.addEventListener('click', () => {
  onLog = !onLog;
  chart.setOptions({ axisY: { type: onLog ? log : linear } });
  button.textContent = `Show on a ${onLog ? 'linear' : 'log'} scale`;
});
