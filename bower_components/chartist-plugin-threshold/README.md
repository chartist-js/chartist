# Threshold plugin for Chartist

This Chartist plugin can be used to divide your Line or Bar chart with a threshold. Everything above and below the 
threshold will be tagged with a special class, in order for your to apply different styling where appropriate.

![The Chartist Guy](https://raw.github.com/gionkunz/chartist-plugin-threshold/develop/ct-threshold-demo.gif "Threshold Example Screenshot")

## Usage example

You can use the Plugin for bar and line charts. Chartist will split the relevant elements so that they get divided in 
an above and below part. All elements will receive classes that allow you to style the parts above the threshold different
than the parts below.

```javascript
new Chartist.Line('.ct-chart', {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    [5, -4, 3, 7, 20, 10, 3, 4, 8, -10, 6, -8]
  ]
}, {
  showArea: true,
  axisY: {
    onlyInteger: true
  },
  plugins: [
    Chartist.plugins.ctThreshold({
      threshold: 4
    })
  ]
});
```

Use the following CSS to style the chart parts

```css
.ct-line.ct-threshold-above, .ct-point.ct-threshold-above, .ct-bar.ct-threshold-above {
  stroke: #f05b4f;
}

.ct-line.ct-threshold-below, .ct-point.ct-threshold-below, .ct-bar.ct-threshold-below {
  stroke: #59922b;
}

.ct-area.ct-threshold-above {
  stroke: #f05b4f;
}

.ct-area.ct-threshold-below {
  stroke: #59922b;
}
```

You can, of course, also split multiple series with the threshold plugin. Just make sure you modify the CSS selectors 
with the necessary parent series class.

```css
.ct-series-a .ct-bar.ct-threshold-above {
  stroke: #f05b4f;
}

.ct-series-a .ct-bar.ct-threshold-below {
  stroke: #59922b;
}
```

## Default options

These are the default options of the threshold plugin. All options can be customized within the plugin factory function.

```
var defaultOptions = {
  threshold: 0,
  classNames: {
    aboveThreshold: 'ct-threshold-above',
    belowThreshold: 'ct-threshold-below'
  },
  maskNames: {
    aboveThreshold: 'ct-threshold-mask-above',
    belowThreshold: 'ct-threshold-mask-below'
  }
};
```
