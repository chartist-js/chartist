import 'chartist/styles.css';
import './style.css';
import { barChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';
import { firstNumbers, onNumbers } from './numbers';

const chart = barChart(
  '#chart',
  firstNumbers,
  // How long the animations take is up to style.css.
  { renderer: liveDomRenderer({ animations: smilAnimations() }) }
);

onNumbers(data => chart.update({ data }));
