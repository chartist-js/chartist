# Zoom plugin for Chartist.js

Please visit http://gionkunz.github.io/chartist-js/plugins.html for more information.

## Available options and their defaults

```javascript
var defaultOptions = {
  onZoom : undefined  // A callback (chart, resetFnc) => void which will be called on zoom. 
                      // resetFnc() will reset zoom.
};
```

## Sample usage in Chartist.js

    
```javascript
var chart = new Chartist.Line('.ct-chart', {
  series: [/* */]
}, {
  axisX : {
    type: Chartist.AutoScaleAxis,
  },
  plugins: [
    Chartist.plugins.zoom({
      onZoom : function(chart, reset) { storeReset(reset); };
    })
  ]
});
```

```css
/* style the svg rect */
.ct-zoom-rect {
	fill: rgba(200, 100, 100, 0.3);
  stroke: red;
}
```
