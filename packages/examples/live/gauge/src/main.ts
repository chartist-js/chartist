import 'chartist/styles.css';
import './style.css';
import { pieChart } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';
import { firstLoad, onLoad } from './load';

// The load, and the rest of the scale as a track, on a half ring: a total
// of 200 leaves the lower half empty.
const series = (load: number) => [load, 100 - load];

const chart = pieChart(
  '#chart',
  { series: series(firstLoad) },
  {
    renderer: liveDomRenderer({ animations: smilAnimations() }),
    donut: true,
    donutWidth: 40,
    startAngle: 270,
    total: 200,
    showLabel: false
  }
);

onLoad(load => chart.update({ data: { series: series(load) } }));
