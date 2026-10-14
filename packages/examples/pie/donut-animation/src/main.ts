import 'chartist/styles.css';
import {
  pieChart,
  easings,
  findAll,
  Svg,
  type AnimationDefinition,
  type ChartPlugin
} from 'chartist';

// Draws the slices one after the other, each one starting when the previous one ends.
const drawSlices: ChartPlugin = {
  name: 'draw-slices',
  install(chart) {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    // `mount` runs after every render, once the SVG is in the page.
    chart.on('mount', ({ scene, elementOf }) => {
      for (const slice of findAll(scene, { role: 'slice' })) {
        const element = elementOf(slice);
        if (!element) {
          continue;
        }
        const index = (slice.ctx?.index as number | undefined) ?? 0;
        const svg = new Svg(element);

        // Get the total path length in order to use for dash array animation
        const pathLength = (element as SVGGeometryElement).getTotalLength();

        // Set a dasharray that matches the path length as prerequisite to animate dashoffset
        svg.attr({
          'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
        });

        // Create animation definition while also assigning an ID to the animation for later sync usage
        const animationDefinition: Record<string, AnimationDefinition> = {
          'stroke-dashoffset': {
            id: 'anim' + index,
            dur: 1000,
            from: -pathLength + 'px',
            to: '0px',
            easing: easings.easeOutQuint,
            // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
            fill: 'freeze'
          }
        };

        // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
        if (index !== 0) {
          animationDefinition['stroke-dashoffset'].begin =
            'anim' + (index - 1) + '.end';
        }

        // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
        svg.attr({
          'stroke-dashoffset': -pathLength + 'px'
        });

        // We can't use guided mode as the animations need to rely on setting begin manually
        svg.animate(animationDefinition, false);
      }

      // For the sake of the example we redraw the chart every time it's rendered with a delay of 10 seconds
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => chart.update({}), 10000);
    });
  }
};

pieChart(
  '#chart',
  {
    series: [10, 20, 50, 20, 5, 50, 15],
    labels: [1, 2, 3, 4, 5, 6, 7]
  },
  {
    plugins: [drawSlices],
    donut: true,
    showLabel: false
  }
);
