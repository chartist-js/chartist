import 'chartist/styles.css';

const { barChart, fromLegacyPlugin, plugins } = Chartist;

barChart(
  '#chart',
  {
    labels: ['Apples', 'Pears', 'Plums', 'Cherries'],
    series: [[42, 28, 35, 51]]
  },
  {
    chartPadding: { top: 25 },
    plugins: [fromLegacyPlugin(plugins.ctBarLabels())]
  }
);
