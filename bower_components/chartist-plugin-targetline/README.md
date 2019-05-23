# Target Line plugin for Chartist.js

A plugin for Chartist.js that allows the drawing of a target line on a chart.

## Download 
Download from npm:

`npm install chartist-plugin-targetline`

or bower:

`bower install chartist-plugin-targetline`

## Available options and their defaults

```javascript
var defaultOptions = {
  value = null,
  class = 'ct-target-line'
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
    ctTargetLine({
      value: 1000
    })
  ]
});
```

```css
.ct-target-line {
    stroke: blue;
    stroke-width: 2px;
    stroke-dasharray: 4px;
    shape-rendering: crispEdges;
}
```