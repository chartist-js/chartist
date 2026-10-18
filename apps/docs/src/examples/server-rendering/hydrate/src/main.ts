import 'chartist/styles.css';
import './style.css';
import { lineChart } from 'chartist';
import { liveDomRenderer } from 'chartist/live';
import { data, options } from './chart';

const status = document.querySelector('#status')!;
const server = document.querySelector('#chart svg');
const renders: string[] = [];

// #chart holds the server's markup: the chart takes its elements over
// instead of drawing new ones, and keeps them on every update.
const chart = lineChart('#chart', data, {
  ...options,
  renderer: liveDomRenderer(),
  on: {
    mount: ({ cause, hydration }) => {
      renders.push(
        hydration ? `${cause} (${hydration.repaired} repaired)` : cause
      );
      const kept = document.querySelector('#chart svg') === server;
      status.textContent = `${renders.slice(-3).join(' → ')}: ${kept ? "still the server's svg" : 'a new svg'}`;
    }
  }
});

const random = () => Math.round(Math.random() * 120) / 10;
document.querySelector('#update')!.addEventListener('click', () => {
  chart.update({
    data: { ...data, series: data.series.map(series => series.map(random)) }
  });
});
