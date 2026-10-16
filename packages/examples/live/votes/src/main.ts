import 'chartist/styles.css';
import { pieChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';

// A seeded generator, so every run counts the same votes.
let seed = 3;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

// Votes come in district by district; each slice shows its share.
const parties = ['Greens', 'Blues', 'Reds', 'Yellows'];
const leaning = [0.32, 0.27, 0.24, 0.17];
let votes = [120, 100, 90, 60];

const total = () => votes.reduce((sum, value) => sum + value, 0);

const chart = pieChart(
  '#chart',
  { labels: parties, series: votes },
  {
    // Slices are known by their party, and turn to their new size.
    renderer: liveDomRenderer({ key: 'label', animations: smilAnimations() }),
    labelTransform: (label, index) =>
      `${label}\n${Math.round((votes[index] / total()) * 100)}%`
  }
);

setInterval(() => {
  // The next district, with its own mood.
  votes = votes.map(
    (value, index) =>
      value + Math.round(400 * leaning[index] * (0.5 + random()))
  );
  chart.update({ data: { labels: parties, series: votes } });
}, 1500);
