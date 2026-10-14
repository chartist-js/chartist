import 'chartist/styles.css';
import { lineChart } from 'chartist';
import { fromLegacyPlugin } from 'chartist/compat';

// Plugin scripts register on the global `Chartist`.
const { plugins } = Chartist;
const caption = document.querySelector('#caption')!;

lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [[1, 5, 3, 4, 6, 2, 3]]
  },
  {
    height: 220,
    plugins: [
      fromLegacyPlugin(
        plugins.hover({
          // The plugin passes the event, with the hovered point as target.
          onMouseEnter: (event: { target: Element }) => {
            caption.textContent = `Value: ${event.target.getAttribute('ct:value')}`;
          },
          onMouseLeave: () => {
            caption.textContent = 'Hover the chart.';
          }
        })
      )
    ]
  }
);
