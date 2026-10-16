import 'chartist/styles.css';
import './style.css';
import { pieChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';
import { firstCount, onCount, parties } from './count';

let votes = firstCount;
const total = () => votes.reduce((sum, value) => sum + value, 0);

const chart = pieChart(
  '#chart',
  { labels: parties, series: votes },
  {
    // Slices are known by their party, and turn to their new share.
    renderer: liveDomRenderer({ key: 'label', animations: smilAnimations() }),
    // Each slice shows its share.
    labelTransform: (label, index) =>
      `${label}\n${Math.round((votes[index] / total()) * 100)}%`
  }
);

// The next district's results.
onCount(count => {
  votes = count;
  chart.update({ data: { labels: parties, series: votes } });
});
