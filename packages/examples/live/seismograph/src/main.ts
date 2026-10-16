import 'chartist/styles.css';
import './style.css';
import { lineChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';
import { firstReadings, onReadings } from './seismometer';

const chart = lineChart('#chart', firstReadings, {
  // Readings are known by their time, so the trace scrolls.
  renderer: liveDomRenderer({ key: 'label', animations: smilAnimations() }),
  low: -8,
  high: 8,
  showPoint: false,
  lineSmooth: false,
  axisX: { showGrid: false, showLabel: false },
  axisY: { onlyInteger: true }
});

onReadings(data => chart.update({ data }));
