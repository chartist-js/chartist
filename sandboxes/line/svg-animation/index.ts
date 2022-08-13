import 'chartist/dist/index.css';
import { LineChart } from 'chartist';

const chart = new LineChart(
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
  {
    low: 0
  }
);

// Let's put a sequence number aside so we can use it in the event callbacks
let seq = 0;
const delays = 80;
const durations = 500;

// Once the chart is fully created we reset the sequence
chart.on('created', () => {
  seq = 0;
});

// On each drawn element by Chartist we use the Svg API to trigger SMIL animations
chart.on('draw', data => {
  seq++;

  if (data.type === 'line') {
    // If the drawn element is a line we do a simple opacity fade in. This could also be achieved using CSS3 animations.
    data.element.animate({
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
  } else if (data.type === 'label' && data.axis.counterUnits.pos === 'x') {
    data.element.animate({
      y: {
        begin: seq * delays,
        dur: durations,
        from: data.y + 100,
        to: data.y,
        // We can specify an easing function from Svg.Easing
        easing: 'easeOutQuart'
      }
    });
  } else if (data.type === 'label' && data.axis.counterUnits.pos === 'y') {
    data.element.animate({
      x: {
        begin: seq * delays,
        dur: durations,
        from: data.x - 100,
        to: data.x,
        easing: 'easeOutQuart'
      }
    });
  } else if (data.type === 'point') {
    data.element.animate({
      x1: {
        begin: seq * delays,
        dur: durations,
        from: data.x - 10,
        to: data.x,
        easing: 'easeOutQuart'
      },
      x2: {
        begin: seq * delays,
        dur: durations,
        from: data.x - 10,
        to: data.x,
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
  } else if (data.type === 'grid') {
    // Using data.axis we get x or y which we can use to construct our animation definition objects
    const pos1Key = (data.axis.units.pos +
      '1') as `${typeof data.axis.units.pos}1`;
    const pos1Value = data[pos1Key];
    const pos1Animation = {
      begin: seq * delays,
      dur: durations,
      from: pos1Value - 30,
      to: pos1Value,
      easing: 'easeOutQuart' as const
    };

    const pos2Key = (data.axis.units.pos +
      '2') as `${typeof data.axis.units.pos}2`;
    const pos2Value = data[pos2Key];
    const pos2Animation = {
      begin: seq * delays,
      dur: durations,
      from: pos2Value - 100,
      to: pos2Value,
      easing: 'easeOutQuart' as const
    };

    const animations = {
      [data.axis.units.pos + '1']: pos1Animation,
      [data.axis.units.pos + '2']: pos2Animation,
      opacity: {
        begin: seq * delays,
        dur: durations,
        from: 0,
        to: 1,
        easing: 'easeOutQuart' as const
      }
    };

    data.element.animate(animations);
  }
});

let timerId: any;

// For the sake of the example we update the chart every time it's created with a delay of 8 seconds
chart.on('created', () => {
  if (timerId) {
    clearTimeout(timerId);
  }

  timerId = setTimeout(chart.update.bind(chart), 12000);
});
