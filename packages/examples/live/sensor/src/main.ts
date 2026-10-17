import 'chartist/styles.css';
import './style.css';
import { lineChart, type SceneNode } from 'chartist';
import { liveDomRenderer } from 'chartist/live';
import { firstReadings, onReading } from './readings';

const readout = document.querySelector('#changes')!;
const count = (node: SceneNode): number =>
  1 + node.children.reduce((sum, child) => sum + count(child), 0);

const chart = lineChart('#chart', firstReadings, {
  // Keep the SVG, and know each reading by its label.
  renderer: liveDomRenderer({ key: 'label' }),
  showArea: true,
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

// A new reading every second: the oldest one goes, the new one comes.
onReading(data => chart.update({ data }));
