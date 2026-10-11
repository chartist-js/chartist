import 'chartist/dist/index.css';
import { BarChart, Svg, getMultiValue } from 'chartist';

// Create a simple bi-polar bar chart
const chart = new BarChart(
  '#chart',
  {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
    series: [[1, 2, 4, 8, 6, -2, -1, -4, -6, -2]]
  },
  {
    high: 10,
    low: -10,
    axisX: {
      labelInterpolationFnc: (value, index) => (index % 2 === 0 ? value : null)
    }
  }
);

// Listen for draw events on the bar chart
chart.on('draw', data => {
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
