import 'chartist/styles.css';

const { lineChart, fromLegacyPlugin, plugins } = Chartist;

lineChart(
  '#chart',
  {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [
      [
        { meta: 'Snow', value: 2 },
        { meta: 'Thaw', value: 5 },
        { meta: 'Rain', value: 8 },
        { meta: 'Blossom', value: 13 },
        { meta: 'Sun', value: 18 },
        { meta: 'Heat', value: 24 }
      ]
    ]
  },
  { plugins: [fromLegacyPlugin(plugins.tooltip())] }
);
