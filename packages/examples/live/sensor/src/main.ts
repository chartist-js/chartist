import 'chartist/styles.css';
import './style.css';
import { lineChart, type SceneNode } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';

// A seeded generator, so every run shows the same readings.
let seed = 42;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

// The last ten readings of a temperature sensor, one per second.
let data = {
  labels: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s'],
  series: [[21.2, 21.4, 21.3, 21.7, 21.9, 21.8, 22.1, 22, 22.3, 22.2]]
};

const readout = document.querySelector('#changes')!;
const count = (node: SceneNode): number =>
  1 + node.children.reduce((sum, child) => sum + count(child), 0);

const chart = lineChart('#chart', data, {
  // Keep the SVG, know each reading by its label, and animate updates.
  renderer: liveDomRenderer({ key: 'label', animations: smilAnimations() }),
  showArea: true,
  // A fixed range, so the axis stays and only the readings move.
  low: 20,
  high: 24,
  on: {
    // What each render did to the SVG's elements.
    mount: ({ scene, changes, cause }) => {
      const total = count(scene);
      if (cause === 'create') {
        readout.textContent = `Drew ${total} elements.`;
        return;
      }
      const tally = { add: 0, update: 0, remove: 0 };
      for (const change of changes) {
        tally[change.op] += 1;
      }
      readout.textContent =
        `Kept ${total - tally.add} of ${total} elements (${tally.update} changed), ` +
        `added ${tally.add}, removed ${tally.remove}.`;
    }
  }
});

let second = 10;
setInterval(() => {
  second += 1;
  const [values] = data.series;
  const last = values[values.length - 1];
  const next = last + random() - 0.5;
  const reading = Math.round(Math.min(23.5, Math.max(20.5, next)) * 10) / 10;
  // Drop the oldest reading and add the new one.
  data = {
    labels: [...data.labels.slice(1), `${second}s`],
    series: [[...values.slice(1), reading]]
  };
  chart.update({ data });
}, 1000);
