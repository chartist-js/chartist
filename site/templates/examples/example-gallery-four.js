var data = {
  series: [60, 20]
};

var options = {
  donut: true,
    donutWidth: 40,
    total: 100,
    labelInterpolationFnc: function(value) {
    return value + '%';
  }
};

var responsiveOptions = [
  [
    Foundation.media_queries.medium,
    {
      labelOffset: 30,
      chartPadding: 10,
      labelDirection: 'explode'
    }
  ],
  [
    Foundation.media_queries.large,
    {
      labelOffset: -30,
      chartPadding: 0,
      labelDirection: 'implode'
    }
  ]
];

new Chartist.Pie('.ct-chart', data, options, responsiveOptions);