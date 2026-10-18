import 'chartist/styles.css';
import './style.css';
import { lineChart, type ChartHandle, type SceneChange } from 'chartist';
import { liveDomRenderer } from 'chartist/live';
import { data, options } from './chart';

const status = document.querySelector('#status')!;
const renders: string[] = [];
// The elements the server rendered, before the chart runs.
const server = Array.from(
  document.querySelectorAll('#chart svg, #chart svg *')
);

/** How many changes of each kind a render made. */
function count(changes: readonly SceneChange[]) {
  const ops = { add: 0, update: 0, remove: 0 };
  changes.forEach(change => ops[change.op]++);
  return `${ops.add} added, ${ops.update} changed, ${ops.remove} removed`;
}

const hydrateButton = document.querySelector<HTMLButtonElement>('#hydrate')!;
const updateButton = document.querySelector<HTMLButtonElement>('#update')!;
let chart: ChartHandle | undefined;

// #chart holds the server's markup. On a real page, the chart is created
// right away; here, Hydrate creates it, so you can look at the markup first.
// The chart takes the server's elements over instead of drawing new ones,
// and changes them on every later render.
hydrateButton.addEventListener('click', () => {
  chart = lineChart('#chart', data, {
    ...options,
    renderer: liveDomRenderer(),
    on: {
      mount: ({ cause, changes, hydration }) => {
        const kept = server.filter(element => element.isConnected).length;
        const render =
          cause === 'hydrate'
            ? `hydrate: took ${changes.length} elements over, ${hydration?.repaired} repaired`
            : `${cause}: ${count(changes)}`;
        // The last three renders, and what's left of the server's elements.
        renders.push(render);
        renders.splice(0, renders.length - 3);
        status.textContent = `${renders.join('\n')}\n${kept} of the server's ${server.length} elements are still in the chart.`;
      }
    }
  });
  hydrateButton.disabled = true;
  updateButton.disabled = false;
});

const random = () => Math.round(Math.random() * 120) / 10;
updateButton.addEventListener('click', () => {
  chart?.update({
    data: { ...data, series: data.series.map(series => series.map(random)) }
  });
});
