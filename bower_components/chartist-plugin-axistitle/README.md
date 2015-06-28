# Axis title plugin for Chartist.js

This plugin allows the creation and placement of axis titles. The plugin will throw an error if it is applied to a chart
that contains no axes, such as a Pie chart.

In order to use it, you will need to include the excellent charting library Chartist.js in your page.

http://gionkunz.github.io/chartist-js/index.html


## Available options and their defaults

```javascript
var defaultOptions = {
  // The title to be displayed on the axis. If at least one axis title is not supplied then an error is thrown.
  axisTitle: '',
  
  // One or more class names to be added to the axis title. Multiple class names should be separated by a space.
  axisClass: 'ct-axis-title',
  
  // How much to offset the title by.
  offset: {x:0, y:0},
  
  // Defines the anchoring of the title text. Possible values are 'start', 'end' and 'middle'.
  textAnchor: 'middle',

  // Whether to flip the direction of the text. Note - This can only be used on axis Y.
  flipText : false
  
};
```

## Sample usage

```javascript
var chart = new Chartist.Line('.ct-chart', {
            labels: ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90', '91-105', '106-120'],
                series: [1, 3, 7, 12, 1, 2, 1, 0]
            }, {
                chartPadding: {
                    top: 20,
                    right: 0,
                    bottom: 20,
                    left: 0
                },
                axisY: {
                    onlyInteger: true
                },
                plugins: [
                    Chartist.plugins.ctAxisTitle({
                        axisX: {
                            axisTitle: 'Time (mins)',
                            axisClass: 'ct-axis-title',
                            offset: {
                                x: 0,
                                y: 50
                            },
                            textAnchor: 'middle'
                        },
                        axisY: {
                            axisTitle: 'Goals',
                            axisClass: 'ct-axis-title',
                            offset: {
                                x: 0,
                                y: 0
                            },
                            flipTitle: false
                        }
                    })
                ]
            });
```