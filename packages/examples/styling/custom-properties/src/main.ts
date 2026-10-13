import 'chartist/styles.css';
import './style.css';
import { lineChart } from 'chartist';

// The same chart twice: the second container sets --ct-* properties.
for (const cell of document.querySelectorAll('.cell')) {
  lineChart(
    cell,
    {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      series: [
        [12, 9, 7, 8, 5],
        [2, 1, 3.5, 7, 3]
      ]
    },
    { showArea: true, fullWidth: true, chartPadding: { right: 30 } }
  );
}
