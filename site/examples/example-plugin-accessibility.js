new Chartist.Line('.ct-chart', {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  series: [
    {name: 'Income', data: [20000, 30000, 35000, 32000, 40000, 42000, 50000, 62000, 80000, 94000, 100000, 120000]},
    {name: 'Expenses', data: [10000, 15000, 12000, 14000, 20000, 23000, 22000, 24000, 21000, 18000, 30000, 32000]}
  ]
}, {
  fullWidth: true,
  lineSmooth: false,
  chartPadding: {
    right: 20,
    left: 10
  },
  axisX: {
    labelInterpolationFnc: function(value) {
      return value.split('').slice(0, 3).join('');
    }
  },
  plugins: [
    Chartist.plugins.ctAccessibility({
      caption: 'Fiscal year 2015',
      seriesHeader: 'business numbers',
      summary: 'A graphic that shows the business numbers of the fiscal year 2015',
      valueTransform: function(value) {
        return value + ' dollar';
      },
      // ONLY USE THIS IF YOU WANT TO MAKE YOUR ACCESSIBILITY TABLE ALSO VISIBLE!
      visuallyHiddenStyles: 'position: absolute; top: 100%; width: 100%; font-size: 11px; overflow-x: auto; background-color: rgba(0, 0, 0, 0.1); padding: 10px'
    })
  ]
});

// This is only used for the example on the Chartist example page
$chart.parent().css({
  'margin-bottom': '160px'
});
