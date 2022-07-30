import 'chartist-dev/styles';
import faker from 'faker';
import {
  LineChart,
  AutoScaleAxis,
  Interpolation,
  Svg,
  easings
} from 'chartist-dev';

export default {
  title: 'LineChart',
  argTypes: {}
};

export function Default() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      series: [
        [12, 9, 7, 8, 5],
        [2, 1, 3.5, 7, 3],
        [1, 3, 4, 5, 6]
      ]
    },
    {
      fullWidth: true,
      chartPadding: {
        right: 40
      }
    }
  );

  return root;
}

export function AutoScale() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      series: [
        [
          { x: 1, y: 1 },
          { x: 3, y: 5 }
        ]
      ]
    },
    {
      axisX: {
        type: AutoScaleAxis,
        onlyInteger: true
      },
      axisY: {
        type: AutoScaleAxis,
        onlyInteger: true
      }
    }
  );

  return root;
}

export function Labels() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      series: [[5, 2, 4, 2, 0]]
    },
    {}
  );

  return root;
}

export function MultiSeries() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series: [
        [5, 2, 4, 2, 0],
        [5, 2, 2, 0]
      ]
    },
    {}
  );

  return root;
}

export function Holes() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      series: [
        [5, 5, 10, 8, 7, 5, 4, null, null, null, 10, 10, 7, 8, 6, 9],
        [
          10,
          15,
          null,
          12,
          null,
          10,
          12,
          15,
          null,
          null,
          12,
          null,
          14,
          null,
          null,
          null
        ],
        [null, null, null, null, 3, 4, 1, 3, 4, 6, 7, 9, 5, null, null, null],
        [
          { x: 3, y: 3 },
          { x: 4, y: 3 },
          { x: 5, y: undefined },
          { x: 6, y: 4 },
          { x: 7, y: null },
          { x: 8, y: 4 },
          { x: 9, y: 4 }
        ]
      ]
    },
    {
      fullWidth: true,
      chartPadding: {
        right: 10
      },
      low: 0
    }
  );

  return root;
}

export function FilledHoles() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      series: [
        [5, 5, 10, 8, 7, 5, 4, null, null, null, 10, 10, 7, 8, 6, 9],
        [
          10,
          15,
          null,
          12,
          null,
          10,
          12,
          15,
          null,
          null,
          12,
          null,
          14,
          null,
          null,
          null
        ],
        [null, null, null, null, 3, 4, 1, 3, 4, 6, 7, 9, 5, null, null, null],
        [
          { x: 3, y: 3 },
          { x: 4, y: 3 },
          { x: 5, y: undefined },
          { x: 6, y: 4 },
          { x: 7, y: null },
          { x: 8, y: 4 },
          { x: 9, y: 4 }
        ]
      ]
    },
    {
      fullWidth: true,
      chartPadding: {
        right: 10
      },
      lineSmooth: Interpolation.cardinal({
        fillHoles: true
      }),
      low: 0
    }
  );

  return root;
}

export function OnlyWholeNumbers() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8],
      series: [
        [1, 2, 3, 1, -2, 0, 1, 0],
        [-2, -1, -2, -1, -3, -1, -2, -1],
        [0, 0, 0, 1, 2, 3, 2, 1],
        [3, 2, 1, 0.5, 1, 0, -1, -3]
      ]
    },
    {
      high: 3,
      low: -3,
      fullWidth: true,
      // As this is axis specific we need to tell Chartist to use whole numbers only on the concerned axis
      axisY: {
        onlyInteger: true,
        offset: 20
      }
    }
  );

  return root;
}

export function NoInterpolationWithHoles() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      series: [[NaN, 15, 0, null, 2, 3, 4, undefined, 1, null]]
    },
    {
      lineSmooth: false
    }
  );

  return root;
}

export function CardinalInterpolationWithHoles() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      series: [[NaN, 15, 0, null, 2, 3, 4, undefined, 1, null]]
    },
    {
      lineSmooth: true
    }
  );

  return root;
}

export function MonotoneCubicInterpolationWithHoles() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      series: [[NaN, 15, 0, null, 2, 3, 4, undefined, 1, null]]
    },
    {
      lineSmooth: Interpolation.monotoneCubic()
    }
  );

  return root;
}

export function SimpleInterpolationWithHoles() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      series: [[NaN, 15, 0, null, 2, 3, 4, undefined, 1, null]]
    },
    {
      lineSmooth: Interpolation.simple()
    }
  );

  return root;
}

export function StepInterpolationWithHoles() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      series: [[NaN, 15, 0, null, 2, 3, 4, undefined, 1, null]]
    },
    {
      lineSmooth: Interpolation.step()
    }
  );

  return root;
}

export function StepNoPostponeInterpolationWithHoles() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      series: [[NaN, 15, 0, null, 2, 3, 4, undefined, 1, null]]
    },
    {
      lineSmooth: Interpolation.step({
        postpone: false
      })
    }
  );

  return root;
}

export function SeriesOverrides() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
      // Naming the series with the series object array notation
      series: [
        {
          name: 'series-1',
          data: [5, 2, -4, 2, 0, -2, 5, -3]
        },
        {
          name: 'series-2',
          data: [4, 3, 5, 3, 1, 3, 6, 4]
        },
        {
          name: 'series-3',
          data: [2, 4, 3, 1, 4, 5, 3, 2]
        }
      ]
    },
    {
      fullWidth: true,
      // Within the series options you can use the series names
      // to specify configuration that will only be used for the
      // specific series.
      series: {
        'series-1': {
          lineSmooth: Interpolation.step()
        },
        'series-2': {
          lineSmooth: Interpolation.simple(),
          showArea: true
        },
        'series-3': {
          showPoint: false
        }
      }
    },
    [
      // You can even use responsive configuration overrides to
      // customize your series configuration even further!
      [
        'screen and (max-width: 320px)',
        {
          series: {
            'series-1': {
              lineSmooth: Interpolation.none()
            },
            'series-2': {
              lineSmooth: Interpolation.none(),
              showArea: false
            },
            'series-3': {
              lineSmooth: Interpolation.none(),
              showPoint: true
            }
          }
        }
      ]
    ]
  );

  return root;
}

export function ReverseData() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      series: [
        [
          { x: 1, y: 1 },
          { x: 3, y: 5 }
        ]
      ]
    },
    {
      reverseData: true
    }
  );

  return root;
}

export function FullWidth() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      series: [
        [
          { x: 1, y: 1 },
          { x: 3, y: 5 }
        ]
      ]
    },
    {
      fullWidth: true
    }
  );

  return root;
}

export function Scatter() {
  const root = document.createElement('div');
  const data = Array.from({ length: 52 }).reduce<{
    labels: number[];
    series: number[][];
  }>(
    (data, _, index) => {
      data.labels.push(index + 1);
      data.series.forEach(series => {
        series.push(faker.datatype.number({ min: 0, max: 100 }));
      });

      return data;
    },
    {
      labels: [],
      series: Array.from({ length: 4 }, () => [])
    }
  );

  new LineChart(
    root,
    data,
    {
      showLine: false,
      axisX: {
        labelInterpolationFnc(value, index) {
          return index % 13 === 0 ? 'W' + value : null;
        }
      }
    },
    [
      [
        'screen and (min-width: 640px)',
        {
          axisX: {
            labelInterpolationFnc(value, index) {
              return index % 4 === 0 ? 'W' + value : null;
            }
          }
        }
      ]
    ]
  );

  return root;
}

export function Area() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8],
      series: [[5, 9, 7, 8, 5, 3, 5, 4]]
    },
    {
      low: 0,
      showArea: true
    }
  );

  return root;
}

export function BiPolarArea() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: [1, 2, 3, 4, 5, 6, 7, 8],
      series: [
        [1, 2, 3, 1, -2, 0, 1, 0],
        [-2, -1, -2, -1, -2.5, -1, -2, -1],
        [0, 0, 0, 1, 2, 2.5, 2, 1],
        [2.5, 2, 1, 0.5, 1, 0.5, -1, -2.5]
      ]
    },
    {
      high: 3,
      low: -3,
      showArea: true,
      showLine: false,
      showPoint: false,
      fullWidth: true,
      axisX: {
        showLabel: false,
        showGrid: false
      }
    }
  );

  return root;
}

export function CustomPoints() {
  const root = document.createElement('div');

  new LineChart(root, {
    labels: [1, 2, 3, 4, 5],
    series: [[12, 9, 7, 8, 5]]
  }).on('draw', data => {
    // If the draw event was triggered from drawing a point on the line chart
    if (data.type === 'point') {
      // We are creating a new path SVG element that draws a triangle around the point coordinates
      const triangle = new Svg(
        'path',
        {
          d: [
            'M',
            data.x,
            data.y - 15,
            'L',
            data.x - 15,
            data.y + 8,
            'L',
            data.x + 15,
            data.y + 8,
            'z'
          ].join(' '),
          style: 'fill-opacity: 1'
        },
        'ct-area'
      );

      // With data.element we get the Chartist SVG wrapper and we can replace the original point drawn by Chartist with our newly created triangle
      data.element.replace(triangle);
    }
  });

  return root;
}

export function PathAnimation() {
  const root = document.createElement('div');

  new LineChart(
    root,
    {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      series: [
        [1, 5, 2, 5, 4, 3],
        [2, 3, 4, 8, 1, 2],
        [5, 4, 3, 2, 1, 0.5]
      ]
    },
    {
      low: 0,
      showArea: true,
      showPoint: false,
      fullWidth: true
    }
  ).on('draw', data => {
    if (
      !process.env.STORYBOOK_STORYSHOTS &&
      (data.type === 'line' || data.type === 'area')
    ) {
      data.element.animate({
        d: {
          begin: 2000 * data.index,
          dur: 2000,
          from: data.path
            .clone()
            .scale(1, 0)
            .translate(0, data.chartRect.height())
            .stringify(),
          to: data.path.clone().stringify(),
          easing: easings.easeOutQuint
        }
      });
    }
  });

  return root;
}
