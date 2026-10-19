import 'chartist/styles.css';
import './style.css';
import { lineChart } from 'chartist';
import { source } from './source';

lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [[12, 9, 14, 7, 11]]
  },
  {
    low: 0,
    layers: { above: [source('Source: web analytics, week 20')] }
  }
);
