import 'chartist/styles.css';
import './style.css';
import { barChart, type ChartEvents, type ChartPlugin } from 'chartist';

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
    // What each bar element stands for in the latest render.
    const bars = new WeakMap<Element, ChartEvents['bar:select']>();
    chart.on('mount', ({ changes, elementOf }) => {
      for (const { op, node: bar } of changes) {
        const element = elementOf(bar);
        if (op === 'remove' || bar.role !== 'bar' || !element) {
          continue;
        }
        bars.set(element, {
          series: bar.ctx.seriesIndex,
          index: bar.ctx.valueIndex,
          // Bar values are { x, y } (or a hole).
          value:
            bar.ctx.value &&
            typeof bar.ctx.value === 'object' &&
            'y' in bar.ctx.value
              ? bar.ctx.value.y
              : undefined
        });
        // New elements only: an element the renderer kept has its handler.
        if (op === 'add') {
          element.addEventListener('click', () => {
            const selected = bars.get(element);
            if (selected) {
              chart.emit('bar:select', selected);
            }
          });
        }
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
