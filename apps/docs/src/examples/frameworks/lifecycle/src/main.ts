import 'chartist/styles.css';
import './style.css';
import { lineChart, type ChartHandle } from 'chartist';
import { liveDomRenderer } from 'chartist/live';

const container = document.querySelector<HTMLElement>('#chart')!;
const log = document.querySelector('#log')!;
const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const random = () => labels.map(() => Math.round(Math.random() * 10));

// What a component does with a chart: one handle while it's mounted.
let chart: ChartHandle | undefined;

function mount() {
  // Created once, after the framework put the container in the page.
  chart ??= lineChart(
    container,
    { labels, series: [random()] },
    {
      low: 0,
      renderer: liveDomRenderer(),
      on: {
        mount: ({ cause, changes }) => {
          log.textContent = `${cause}: ${changes.length} changes`;
        }
      }
    }
  );
}

function update() {
  // New data goes to the handle; the chart keeps its svg.
  chart?.update({ data: { labels, series: [random()] } });
}

function unmount() {
  // Removes the svg and everything the chart listened to.
  chart?.destroy();
  chart = undefined;
  log.textContent = 'destroyed';
}

document.querySelector('#mount')!.addEventListener('click', mount);
document.querySelector('#update')!.addEventListener('click', update);
document.querySelector('#unmount')!.addEventListener('click', unmount);
mount();
