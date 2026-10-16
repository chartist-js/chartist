import 'chartist/styles.css';
import { lineChart } from 'chartist';
import { liveDomRenderer } from 'chartist/live';

// The last ten readings of a temperature sensor, one per second.
let data = {
  labels: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s'],
  series: [[21.2, 21.4, 21.3, 21.7, 21.9, 21.8, 22.1, 22, 22.3, 22.2]]
};

const chart = lineChart('#chart', data, {
  // Keep the SVG, and know each reading by its label.
  renderer: liveDomRenderer({ key: 'label' }),
  showArea: true
});

let second = 10;
setInterval(() => {
  second += 1;
  const [values] = data.series;
  const last = values[values.length - 1];
  const reading = Math.round((last + Math.random() - 0.5) * 10) / 10;
  // Drop the oldest reading and add the new one.
  data = {
    labels: [...data.labels.slice(1), `${second}s`],
    series: [[...values.slice(1), reading]]
  };
  chart.update({ data });
}, 1000);
