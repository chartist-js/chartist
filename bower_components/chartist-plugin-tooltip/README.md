# Tooltip plugin for Chartist.js

This plugin provides quick&easy tooltips for your chartist charts. Touch support is planned soon.

Please visit http://gionkunz.github.io/chartist-js/plugins.html for more information.

## Available options and their defaults

```javascript
var defaultOptions = {
  currency: null //accepts '£', '$', '€', etc.
  //e.g. 4000 => €4,000
};
```

## Sample usage in Chartist.js

`bower install chartist-plugin-tooltip --save`

With descriptive text:
```js
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
}, {
  plugins: [
    Chartist.plugins.tooltip()
  ]
});
```

without:
```js
var chart = new Chartist.Line('.ct-chart', {
  labels: [1, 2, 3, 4, 5, 6, 7],
  series: [
    [1, 5, 3, 4, 6, 2, 3],
    [2, 4, 2, 5, 4, 3, 6]
  ]
}, {
  plugins: [
    Chartist.plugins.tooltip()
  ]
});
```
