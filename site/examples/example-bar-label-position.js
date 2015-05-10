new Chartist.Bar('.ct-chart', {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  series: [
    [5, 4, 3, 7, 5, 10, 3],
    [3, 2, 9, 5, 4, 6, 4]
  ]
}, {
  axisX: {
    // On the x-axis start means top and end means bottom
    position: 'start'
  },
  axisY: {
    // On the y-axis start means left and end means right
    position: 'end'
  }
});
