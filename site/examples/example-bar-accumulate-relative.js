new Chartist.Bar('.ct-chart', {
  labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  series: [
    [5, 4, -3, -5],
    [5, -4, 3, -5]
  ]
}, {
  stackBars: true,
  stackMode: 'accumulate-relative',
});
