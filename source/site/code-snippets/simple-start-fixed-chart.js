var data = {
  // A labels array that can contain any sort of values
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  // Our series array that contains series objects or in this case series data arrays
  series: [
    [5, 2, 4, 2, 0]
  ]
};

// As options we currently only set a static size of 300x200 px. We can also omit this and use aspect ratio containers
// as you saw in the previous example
var options = {
  width: 300,
  height: 200
};

// In the global name space Chartist we call the Bar function to initialize a bar chart
// As a first parameter we pass in a selector where we would like to get our chart created
// Second parameter is the actual data object and as a third parameter we pass in our options
Chartist.Bar('.ct-chart', data, options);