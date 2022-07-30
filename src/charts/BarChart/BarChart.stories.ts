import 'chartist-dev/styles';
import { BarChart, AutoScaleAxis, Svg, getMultiValue } from 'chartist-dev';
import { Viewport } from '../../../test/utils/storyshots/viewport';

export default {
  title: 'BarChart',
  argTypes: {}
};

export function Default() {
  const root = document.createElement('div');

  new BarChart(
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

export function BiPolar() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
      series: [[1, 2, 4, 8, 6, -2, -1, -4, -6, -2]]
    },
    {
      high: 10,
      low: -10,
      axisX: {
        labelInterpolationFnc(value, index) {
          return index % 2 === 0 ? value : null;
        }
      }
    }
  );

  return root;
}

export function Labels() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      series: [[5, 2, 4, 2, 0]]
    },
    {}
  );

  return root;
}

export function MultilineLabels() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      labels: [
        'First quarter of the year',
        'Second quarter of the year',
        'Third quarter of the year',
        'Fourth quarter of the year'
      ],
      series: [
        [60000, 40000, 80000, 70000],
        [40000, 30000, 70000, 65000],
        [8000, 3000, 10000, 6000]
      ]
    },
    {
      seriesBarDistance: 10,
      axisX: {
        offset: 60
      },
      axisY: {
        offset: 80,
        labelInterpolationFnc(value) {
          return value + ' CHF';
        },
        scaleMinSpace: 15
      }
    }
  );

  return root;
}

export function LabelsPlacement() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      series: [
        [5, 4, 3, 7, 5, 10, 3],
        [3, 2, 9, 5, 4, 6, 4]
      ]
    },
    {
      axisX: {
        // On the x-axis start means top and end means bottom
        position: 'start'
      },
      axisY: {
        // On the y-axis start means left and end means right
        position: 'end'
      }
    }
  );

  return root;
}

export function MultiSeries() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      series: [
        [1, 2, 3, 4],
        [2, 3, 4],
        [3, 4]
      ]
    },
    {}
  );

  return root;
}

export function DistributedSeries() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      labels: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
      series: [20, 60, 120, 200, 180, 20, 10]
    },
    {
      distributeSeries: true
    }
  );

  return root;
}

export function ReverseData() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      series: [
        [1, 2, 3, 4],
        [2, 3, 4],
        [3, 4]
      ]
    },
    {
      reverseData: true
    }
  );

  return root;
}

export function Stack() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        [800000, 1200000, 1400000, 1300000],
        [200000, 400000, 500000, 300000],
        [100000, 200000, 400000, 600000]
      ]
    },
    {
      stackBars: true,
      axisY: {
        labelInterpolationFnc(value) {
          return Number(value) / 1000 + 'k';
        }
      }
    }
  ).on('draw', data => {
    if (data.type === 'bar') {
      data.element.attr({
        style: 'stroke-width: 30px'
      });
    }
  });

  return root;
}

export function Horizontal() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      labels: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      series: [
        [5, 4, 3, 7, 5, 10, 3],
        [3, 2, 9, 5, 4, 6, 4]
      ]
    },
    {
      seriesBarDistance: 10,
      reverseData: true,
      horizontalBars: true,
      axisY: {
        offset: 70
      }
    }
  );

  return root;
}

export function Adaptive() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      labels: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
      series: [
        [5, 4, 3, 7],
        [3, 2, 9, 5],
        [1, 5, 8, 4],
        [2, 3, 4, 6],
        [4, 1, 2, 1]
      ]
    },
    {
      // Default mobile configuration
      stackBars: true,
      axisX: {
        labelInterpolationFnc: value =>
          String(value)
            .split(/\s+/)
            .map(word => word[0])
            .join('')
      },
      axisY: {
        offset: 20
      }
    },
    [
      // Options override for media > 400px
      [
        'screen and (min-width: 400px)',
        {
          reverseData: true,
          horizontalBars: true,
          axisX: {
            labelInterpolationFnc: () => undefined
          },
          axisY: {
            offset: 60
          }
        }
      ],
      // Options override for media > 800px
      [
        'screen and (min-width: 800px)',
        {
          stackBars: false,
          seriesBarDistance: 10
        }
      ],
      // Options override for media > 1000px
      [
        'screen and (min-width: 1000px)',
        {
          reverseData: false,
          horizontalBars: false,
          seriesBarDistance: 15
        }
      ]
    ]
  );

  return root;
}

Adaptive.parameters = {
  storyshots: {
    viewports: [
      Viewport.Default,
      Viewport.Tablet,
      Viewport.MobileLandscape,
      Viewport.Mobile
    ]
  }
};

export function OverlappingBarsOnMobile() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      labels: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ],
      series: [
        [5, 4, 3, 7, 5, 10, 3, 4, 8, 10, 6, 8],
        [3, 2, 9, 5, 4, 6, 4, 6, 7, 8, 7, 4]
      ]
    },
    {
      seriesBarDistance: 10
    },
    [
      [
        'screen and (max-width: 640px)',
        {
          seriesBarDistance: 5,
          axisX: {
            labelInterpolationFnc(value) {
              return String(value)[0];
            }
          }
        }
      ]
    ]
  );

  return root;
}

OverlappingBarsOnMobile.parameters = {
  storyshots: {
    viewports: [Viewport.Default, Viewport.Mobile]
  }
};

export function PeakCircles() {
  const root = document.createElement('div');

  new BarChart(
    root,
    {
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
      series: [[1, 2, 4, 8, 6, -2, -1, -4, -6, -2]]
    },
    {
      high: 10,
      low: -10,
      axisX: {
        labelInterpolationFnc(value, index) {
          return index % 2 === 0 ? value : null;
        }
      }
    }
  ).on('draw', data => {
    // If this draw event is of type bar we can use the data to create additional content
    if (data.type === 'bar') {
      // We use the group element of the current series to append a simple circle with the bar peek coordinates and a circle radius that is depending on the value
      data.group.append(
        new Svg(
          'circle',
          {
            cx: data.x2,
            cy: data.y2,
            r: Math.abs(Number(getMultiValue(data.value))) * 2 + 5
          },
          'ct-slice-pie'
        )
      );
    }
  });

  return root;
}
