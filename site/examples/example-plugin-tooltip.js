var chart = new Chartist.Line('.ct-chart', {
  labels: [1, 2, 3],
  series: [
    [
      {meta: 'description', value: 1 },
      {meta: 'description', value: 5},
      {meta: 'description', value: 3}
    ],
    [
      {meta: 'other description', value: 2},
      {meta: 'other description', value: 4},
      {meta: 'other description', value: 2}
    ]
  ]
}, {
  low: 0,
  high: 8,
  fullWidth: true,
  plugins: [
    Chartist.plugins.tooltip()
  ]
});
