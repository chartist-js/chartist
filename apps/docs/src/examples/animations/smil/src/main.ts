import 'chartist/styles.css';
import { barChart, findAll, Svg, type ChartPlugin } from 'chartist';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Bars grow from the axis with SMIL, one after the other.
const growBars: ChartPlugin = {
  name: 'grow-bars',
  install(chart) {
    chart.on('mount', ({ scene, elementOf }) => {
      if (reducedMotion.matches) {
        return;
      }
      for (const bar of findAll(scene, { role: 'bar' })) {
        const element = elementOf(bar);
        if (!element) {
          continue;
        }
        new Svg(element).animate({
          y2: {
            begin: (bar.ctx?.valueIndex ?? 0) * 120,
            dur: 700,
            from: bar.attrs.y1,
            to: bar.attrs.y2,
            easing: 'easeOutQuint'
          }
        });
      }
    });
  }
};

barChart(
  '#chart',
  {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      [5, 4, 3, 7],
      [3, 2, 9, 5]
    ]
  },
  { plugins: [growBars] }
);
