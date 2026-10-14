import 'chartist/styles.css';
import './style.css';

const { pieChart, fromLegacyPlugin, plugins } = Chartist;

// A gauge, as in the plugin's README: 160 of 260 on a ring that leaves a
// gap at the bottom. The second slice is the rest of the scale; it's hidden,
// and the plugin's copy of it, drawn behind, is the track.
pieChart(
  '#chart',
  { series: [160, 100] },
  {
    donut: true,
    donutWidth: 20,
    startAngle: 210,
    total: 260,
    showLabel: false,
    plugins: [
      fromLegacyPlugin(
        plugins.fillDonut({
          items: [{ content: '<strong>160</strong> mph' }]
        })
      )
    ]
  }
);
