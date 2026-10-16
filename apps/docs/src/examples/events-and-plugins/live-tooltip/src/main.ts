import 'chartist/styles.css';
import './style.css';
import { lineChart, type ChartPlugin, type UpdateAnimation } from 'chartist';
import { liveDomRenderer, smilAnimations } from 'chartist/live';

// Shows the value of the point under the pointer, and stays on it
// while the chart updates.
const tooltip: ChartPlugin = {
  name: 'tooltip',
  install(chart) {
    const tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.hidden = true;
    chart.container?.append(tip);
    let point: Element | undefined;

    const show = (animation?: UpdateAnimation) => {
      if (!point?.isConnected) {
        tip.hidden = true;
        return;
      }
      const from = tip.hidden ? '' : tip.style.transform;
      const to = `translate(${point.getAttribute('x1')}px, ${point.getAttribute('y1')}px)`;
      tip.textContent = point.getAttribute('ct:value');
      tip.style.transform = to;
      tip.hidden = false;
      // Move along with the point, with the chart's timing.
      if (animation && from && from !== to) {
        tip.animate({ transform: [from, to] }, animation);
      }
    };

    chart.on('mount', ({ changes, elementOf, animation }) => {
      // New points only: kept ones have their listeners already.
      for (const change of changes) {
        const element = elementOf(change.node);
        if (change.op !== 'add' || change.node.role !== 'point' || !element) {
          continue;
        }
        element.addEventListener('pointerenter', () => {
          point = element;
          show();
        });
        element.addEventListener('pointerleave', () => {
          point = undefined;
          tip.hidden = true;
        });
      }
      // The hovered point may have a new value and place.
      show(animation);
    });

    // The tooltip isn't part of the chart's SVG: remove it on destroy().
    return () => tip.remove();
  }
};

let visitors = [12, 15, 14, 18, 21, 19, 23, 22];

const chart = lineChart(
  '#chart',
  { series: [visitors] },
  {
    renderer: liveDomRenderer({ animations: smilAnimations() }),
    plugins: [tooltip],
    low: 0
  }
);

// A new count of visitors on the site every second.
setInterval(() => {
  const last = visitors[visitors.length - 1];
  const next = Math.max(0, last + Math.round(Math.random() * 8 - 4));
  visitors = [...visitors.slice(1), next];
  chart.update({ data: { series: [visitors] } });
}, 1000);
