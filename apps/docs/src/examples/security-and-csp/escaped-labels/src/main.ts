import 'chartist/styles.css';
import { barChart } from 'chartist';

// Product names as people typed them into a form, markup and all.
const products = [
  'Tea & biscuits',
  '<b>Bold</b> coffee',
  '<img src=x onerror=alert(1)>'
];

// Chartist writes them as text: the labels show these characters, and
// nothing runs.
barChart('#chart', {
  labels: products,
  series: [[42, 31, 18]]
});
