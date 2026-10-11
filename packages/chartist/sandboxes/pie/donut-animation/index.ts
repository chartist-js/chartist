import 'chartist/dist/index.css';
import { PieChart, easings, AnimationDefinition } from 'chartist';

const chart = new PieChart(
  '#chart',
  {
    series: [10, 20, 50, 20, 5, 50, 15],
    labels: [1, 2, 3, 4, 5, 6, 7]
  },
  {
    donut: true,
    showLabel: false
  }
);

chart.on('draw', data => {
  if (data.type === 'slice') {
    // Get the total path length in order to use for dash array animation
    const pathLength = data.element
      .getNode<SVGGeometryElement>()
      .getTotalLength();

    // Set a dasharray that matches the path length as prerequisite to animate dashoffset
    data.element.attr({
      'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
    });

    // Create animation definition while also assigning an ID to the animation for later sync usage
    const animationDefinition: Record<string, AnimationDefinition> = {
      'stroke-dashoffset': {
        id: 'anim' + data.index,
        dur: 1000,
        from: -pathLength + 'px',
        to: '0px',
        easing: easings.easeOutQuint,
        // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
        fill: 'freeze'
      }
    };

    // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
    if (data.index !== 0) {
      animationDefinition['stroke-dashoffset'].begin =
        'anim' + (data.index - 1) + '.end';
    }

    // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
    data.element.attr({
      'stroke-dashoffset': -pathLength + 'px'
    });

    // We can't use guided mode as the animations need to rely on setting begin manually
    data.element.animate(animationDefinition, false);
  }
});

let timerId: any;

// For the sake of the example we update the chart every time it's created with a delay of 8 seconds
chart.on('created', () => {
  if (timerId) {
    clearTimeout(timerId);
  }

  timerId = setTimeout(chart.update.bind(chart), 10000);
});
