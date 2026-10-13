import 'chartist/styles.css';
import { lineChart } from 'chartist';

// The sensor was offline on Wednesday and Thursday.
lineChart('#chart', {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  series: [[4, 6, null, null, 5, 7, 6]]
});
