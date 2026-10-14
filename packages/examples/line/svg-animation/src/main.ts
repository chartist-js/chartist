import 'chartist/styles.css';
import {
  lineChart,
  findAll,
  Svg,
  type AnimationDefinition,
  type ChartPlugin,
  type SceneNode
} from 'chartist';

const delays = 80;
const durations = 500;

// Grid lines and axis labels know their axis.
const dimensionOf = (element: SceneNode) => {
  if (element.role === 'grid') {
    return element.ctx.axis.dimension;
  }
  if (element.role === 'label' && element.ctx.kind === 'axis') {
    return element.ctx.axis.dimension;
  }
  return undefined;
};

// Every element of the chart flies in with SMIL, one after the other: per
// axis tick its grid line and its label (X axis first), then per series its
// points and its line.
const flyIn: ChartPlugin = {
  name: 'fly-in',
  install(chart) {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    chart.on('mount', ({ scene, elementOf }) => {
      // A sequence number that counts the animated elements
      let seq = 0;
      const animate = (
        element: SceneNode,
        animations: Record<string, AnimationDefinition>
      ) => {
        const svgElement = elementOf(element);
        if (svgElement) {
          new Svg(svgElement).animate(animations);
        }
      };

      const grids = findAll(scene, { role: 'grid' });
      const labels = findAll(scene, { role: 'label' });
      for (const dimension of ['x', 'y'] as const) {
        const onAxis = (element: SceneNode) =>
          dimensionOf(element) === dimension;
        for (const grid of grids.filter(onAxis)) {
          seq++;
          // The grid line moves along its axis: x1 and x2 on the X axis
          const pos1Value = Number(grid.attrs[`${dimension}1`]);
          const pos2Value = Number(grid.attrs[`${dimension}2`]);
          animate(grid, {
            [`${dimension}1`]: {
              begin: seq * delays,
              dur: durations,
              from: pos1Value - 30,
              to: pos1Value,
              easing: 'easeOutQuart'
            },
            [`${dimension}2`]: {
              begin: seq * delays,
              dur: durations,
              from: pos2Value - 100,
              to: pos2Value,
              easing: 'easeOutQuart'
            },
            opacity: {
              begin: seq * delays,
              dur: durations,
              from: 0,
              to: 1,
              easing: 'easeOutQuart'
            }
          });

          const label = labels.find(
            candidate =>
              onAxis(candidate) && candidate.ctx.index === grid.ctx.index
          );
          if (!label) {
            continue;
          }
          seq++;
          if (dimension === 'y') {
            const y = Number(label.attrs.y);
            animate(label, {
              y: {
                begin: seq * delays,
                dur: durations,
                from: y + 100,
                to: y,
                easing: 'easeOutQuart'
              }
            });
          } else {
            const x = Number(label.attrs.x);
            animate(label, {
              x: {
                begin: seq * delays,
                dur: durations,
                from: x - 100,
                to: x,
                easing: 'easeOutQuart'
              }
            });
          }
        }
      }

      for (const series of findAll(scene, { role: 'series' })) {
        for (const point of series.children.filter(n => n.role === 'point')) {
          seq++;
          const x = point.ctx.x;
          animate(point, {
            x1: {
              begin: seq * delays,
              dur: durations,
              from: x - 10,
              to: x,
              easing: 'easeOutQuart'
            },
            x2: {
              begin: seq * delays,
              dur: durations,
              from: x - 10,
              to: x,
              easing: 'easeOutQuart'
            },
            opacity: {
              begin: seq * delays,
              dur: durations,
              from: 0,
              to: 1,
              easing: 'easeOutQuart'
            }
          });
        }
        for (const line of series.children.filter(n => n.role === 'line')) {
          seq++;
          // The line fades in. This could also be achieved using CSS3 animations.
          animate(line, {
            opacity: {
              // The delay when we like to start the animation
              begin: seq * delays + 1000,
              // Duration of the animation
              dur: durations,
              // The value where the animation should start
              from: 0,
              // The value where it should end
              to: 1
            }
          });
        }
      }

      // For the sake of the example we redraw the chart every time it's
      // rendered with a delay of 12 seconds
      clearTimeout(timerId);
      timerId = setTimeout(() => chart.update({}), 12000);
    });
  }
};

lineChart(
  '#chart',
  {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    series: [
      [12, 9, 7, 8, 5, 4, 6, 2, 3, 3, 4, 6],
      [4, 5, 3, 7, 3, 5, 5, 3, 4, 4, 5, 5],
      [5, 3, 4, 5, 6, 3, 3, 4, 5, 6, 3, 4],
      [3, 4, 5, 6, 7, 6, 4, 5, 6, 7, 6, 3]
    ]
  },
  { plugins: [flyIn], low: 0 }
);
