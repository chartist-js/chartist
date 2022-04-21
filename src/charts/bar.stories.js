import '../styles/chartist.scss';
import { BarChart } from './bar';
import {AutoScaleAxis} from '../axes/axes';

export default {
  title: 'BarChart',
  argTypes: {}
};

export function Default() {
  const root = document.createElement('div');

  new BarChart(root, {
    labels: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
    series: [
      [5, 4, 3, 7],
      [3, 2, 9, 5],
      [1, 5, 8, 4],
      [2, 3, 4, 6],
      [4, 1, 2, 1]
    ]
  }, {
    // Default mobile configuration
    stackBars: true,
    axisX: {
      labelInterpolationFnc: value => value.split(/\s+/).map(word => word[0]).join('')
    },
    axisY: {
      offset: 20
    }
  }, [
    // Options override for media > 400px
    ['screen and (min-width: 400px)', {
      reverseData: true,
      horizontalBars: true,
      axisX: {
        labelInterpolationFnc: () => undefined,
      },
      axisY: {
        offset: 60
      }
    }],
    // Options override for media > 800px
    ['screen and (min-width: 800px)', {
      stackBars: false,
      seriesBarDistance: 10
    }],
    // Options override for media > 1000px
    ['screen and (min-width: 1000px)', {
      reverseData: false,
      horizontalBars: false,
      seriesBarDistance: 15
    }]
  ]);

  return root
}

export function SimpleGrid() {
  const root = document.createElement('div');

  new BarChart(root, {
    series: [[
      {x: 1, y: 1},
      {x: 3, y: 5}
    ]]
  }, {
    axisX: {
      type: AutoScaleAxis,
      onlyInteger: true
    },
    axisY: {
      type: AutoScaleAxis,
      onlyInteger: true
    }
  }).on('created', () => {
    console.log(document.querySelectorAll('g.ct-grids line.ct-grid.ct-horizontal').length)
    console.log(document.querySelectorAll('g.ct-grids line.ct-grid.ct-vertical').length)
  });

  return root
}
