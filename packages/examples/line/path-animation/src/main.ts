import 'chartist/styles.css';
import {
  lineChart,
  easings,
  findAll,
  Svg,
  type ChartPlugin,
  type SvgPath
} from 'chartist';

// Lines and areas grow from the bottom with SMIL, one series after the other.
const growPaths: ChartPlugin = {
  name: 'grow-paths',
  install(chart) {
    let height = 0;
    chart.on('layout', ({ area }) => {
      height = area.y1 - area.y2;
    });
    chart.on('mount', ({ scene, elementOf }) => {
      const shapes = [
        ...findAll(scene, { role: 'line' }),
        ...findAll(scene, { role: 'area' })
      ];
      for (const shape of shapes) {
        const element = elementOf(shape);
        if (!element) {
          continue;
        }
        const path = shape.ctx?.path as SvgPath;
        new Svg(element).animate({
          d: {
            begin: 2000 * (shape.ctx?.seriesIndex ?? 0),
            dur: 2000,
            from: path.clone().scale(1, 0).translate(0, height).stringify(),
            to: path.clone().stringify(),
            easing: easings.easeOutQuint
          }
        });
      }
    });
  }
};

lineChart(
  '#chart',
  {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    series: [
      [1, 5, 2, 5, 4, 3],
      [2, 3, 4, 8, 1, 2],
      [5, 4, 3, 2, 1, 0.5]
    ]
  },
  {
    plugins: [growPaths],
    low: 0,
    showArea: true,
    showPoint: false,
    fullWidth: true
  }
);
