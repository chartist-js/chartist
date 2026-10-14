import 'chartist/styles.css';
import { barChart } from 'chartist';

const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
const random = () => labels.map(() => Math.round(Math.random() * 9) + 1);

const chart = barChart('#chart', {
  labels,
  series: [
    [5, 4, 3, 7],
    [3, 2, 9, 5]
  ]
});

document.querySelector('#shuffle')?.addEventListener('click', () => {
  chart.update({ data: { labels, series: [random(), random()] } });
});
