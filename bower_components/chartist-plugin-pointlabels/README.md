# Point Labels plugin for Chartist.js

This is a simple plugin for Chartist.js that will put a label on top of data points on line charts. This plugin serves
as an example plugin package and can be used as starting point to create your own awesome Chartist.js plugin.

Please visit http://gionkunz.github.io/chartist-js/plugins.html for more information.

## Available options and their defaults

```javascript
var defaultOptions = {
  labelClass: 'ct-label',
  labelOffset: {
    x: 0,
    y: -10
  },
  textAnchor: 'middle',
  labelInterpolationFnc: Chartist.noop
};
```

## Sample usage in Chartist.js

```javascript
var chart = new Chartist.Line('.ct-chart', {
  labels: [1, 2, 3, 4, 5, 6, 7],
  series: [
    [1, 5, 3, 4, 6, 2, 3],
    [2, 4, 2, 5, 4, 3, 6]
  ]
}, {
  plugins: [
    ctPointLabels({
      textAnchor: 'middle',
      labelInterpolationFnc: function(value) {return '$' + value.toFixed(2)}
    })
  ]
});
```
