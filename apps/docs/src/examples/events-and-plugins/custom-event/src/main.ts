import 'chartist/styles.css';
import './style.css';
import { barChart, findAll, type ChartPlugin } from 'chartist';

// The event and its payload, declared so `emit` and `on` are typed.
declare module 'chartist' {
  interface ChartEvents {
    'bar:select': { series: number; index: number; value?: number };
  }
}

// Emits "bar:select" when someone clicks a bar.
const selectBars: ChartPlugin = {
  name: 'select-bars',
  provides: ['bar:select'],
  install(chart) {
    chart.on('mount', ({ scene, elementOf }) => {
      for (const bar of findAll(scene, { role: 'bar' })) {
        elementOf(bar)?.addEventListener('click', () =>
          chart.emit('bar:select', {
            series: bar.ctx.seriesIndex,
            index: bar.ctx.valueIndex,
            // Bar values are { x, y } (or a hole).
            value:
              bar.ctx.value &&
              typeof bar.ctx.value === 'object' &&
              'y' in bar.ctx.value
                ? bar.ctx.value.y
                : undefined
          })
        );
      }
    });
  }
};

const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
const chart = barChart(
  '#chart',
  {
    labels,
    series: [
      [5, 4, 3, 7],
      [3, 2, 9, 5]
    ]
  },
  { plugins: [selectBars] }
);

const output = document.querySelector('#selected');

chart.on('bar:select', ({ series, index, value }) => {
  if (output) {
    output.textContent = `Series ${series + 1}, ${labels[index]}: ${value}`;
  }
});
