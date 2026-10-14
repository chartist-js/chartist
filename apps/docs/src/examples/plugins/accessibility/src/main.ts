import 'chartist/styles.css';
import './style.css';

const { lineChart, fromLegacyPlugin, plugins } = Chartist;

lineChart(
  '#chart',
  {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      { name: 'Income', data: [5000, 6500, 4800, 7200] },
      { name: 'Expenses', data: [4200, 4700, 5100, 5000] }
    ]
  },
  {
    // A fixed height, so the table the plugin adds flows below the chart.
    height: 200,
    plugins: [
      fromLegacyPlugin(
        plugins.ctAccessibility({
          caption: 'Fiscal year 2026',
          seriesHeader: 'Business numbers',
          summary: 'Income and expenses per quarter of the fiscal year 2026',
          valueTransform: (value: number) => `${value} dollars`,
          // Shown here so you can see the table; leave this out to keep it
          // visually hidden.
          visuallyHiddenStyles: 'display: block; margin-top: 12px;'
        })
      )
    ]
  }
);
