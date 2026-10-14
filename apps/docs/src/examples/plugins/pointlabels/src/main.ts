import 'chartist/styles.css';

const { lineChart, fromLegacyPlugin, plugins } = Chartist;

lineChart(
  '#chart',
  {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [[12.5, 18.25, 9.75, 21]]
  },
  {
    chartPadding: { top: 30, right: 30, left: 30 },
    // The labels show every value, so the Y axis keeps only its grid.
    axisY: { showLabel: false, offset: 0 },
    plugins: [
      fromLegacyPlugin(
        plugins.ctPointLabels({
          textAnchor: 'middle',
          labelInterpolationFnc: (value: number) => `$${value.toFixed(2)}`
        })
      )
    ]
  }
);
