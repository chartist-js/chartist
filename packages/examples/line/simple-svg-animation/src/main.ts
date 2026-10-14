import 'chartist/styles.css';
import { lineChart, easings, findAll, Svg, type ChartPlugin } from 'chartist';

// The points fade and slide in with SMIL, one after the other.
const fadeInPoints: ChartPlugin = {
  name: 'fade-in-points',
  install(chart) {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    chart.on('mount', ({ scene, elementOf }) => {
      // A sequence number, reset on every render
      let seq = 0;

      for (const point of findAll(scene, { role: 'point' })) {
        const element = elementOf(point);
        if (!element) {
          continue;
        }
        const x = point.ctx?.x as number;
        // We use the Svg API to trigger SMIL animations on each point
        new Svg(element).animate({
          opacity: {
            // The delay when we like to start the animation
            begin: seq++ * 80,
            // Duration of the animation
            dur: 500,
            // The value where the animation should start
            from: 0,
            // The value where it should end
            to: 1
          },
          x1: {
            begin: seq++ * 80,
            dur: 500,
            from: x - 100,
            to: x,
            // You can specify an easing function name or use easing functions from `easings` directly
            easing: easings.easeOutQuart
          }
        });
      }

      // For the sake of the example we redraw the chart every time it's
      // rendered with a delay of 8 seconds
      clearTimeout(timerId);
      timerId = setTimeout(() => chart.update({}), 8000);
    });
  }
};

lineChart(
  '#chart',
  {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    series: [
      [12, 4, 2, 8, 5, 4, 6, 2, 3, 3, 4, 6],
      [4, 8, 9, 3, 7, 2, 10, 5, 8, 1, 7, 10]
    ]
  },
  {
    plugins: [fadeInPoints],
    low: 0,
    showLine: false,
    axisX: {
      showLabel: false,
      offset: 0
    },
    axisY: {
      showLabel: false,
      offset: 0
    }
  }
);
