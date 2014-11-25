var data = {
  labels: ['Day one', 'Day two', 'Day three', 'Day four'],
  series: [20, 15, 40, 10]
};

var options = {
  labelInterpolationFnc: function(value) {
    return value.split(/\s+/).reduce(function(str, elem) {
      return str + elem[0] + '.';
    }, '');
  }
};

var responsiveOptions = [
  [
    Foundation.media_queries.medium,
    {
      chartPadding: 30,
      labelOffset: 50,
      labelDirection: 'explode',
      labelInterpolationFnc: function(value) {
        return value;
      }
    }
  ],
  [
    Foundation.media_queries.large,
    {
      labelOffset: 80
    }
  ],
  [
    Foundation.media_queries.xlarge,
    {
      labelOffset: 100
    }
  ]
];

new Chartist.Pie('.ct-chart', data, options, responsiveOptions);