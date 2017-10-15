new Chartist.Line('.ct-chart', {
  series: [
    [{x: 1, y:12}, {x:2, y:9}, {x:3, y:7}, {x: 4, y:8}, {x:5, y:5}, {x: 6, y: 7}],
    [{x: 1, y:120}, {x:2, y:90}, {x:3, y:70}, {x: 4, y:80}, {x:5, y:50}, {x:6, y:70} ],
    [{x: 1, y:20}, {x:2, y:40}, {x:3, y:170}, {x: 4, y:80}, {x:5, y:50}, {x:6, y:50}],
    []
  ]
}, {
  fullWidth: true,
  chartPadding: {
    right: 40
  },
  axisY: {
      onlyInteger: true,
      autoScaleMargin: 0.25
  },
  axisX: {
      showGrid: false
  },
  plugins: [
    Chartist.plugins.tooltip2({
        // Value transform function
        // It receives a single argument that contains the current value
        // "this" is the current chart
        // It must return the formatted value to be added in the tooltip (eg: currency format)
        valueTransformFunction: null,

        // Use an already existing element as a template for the tooltip
        // the content of the element must be a Mustache-style template
        // {{value}} {{metaElement}}
        elementTemplateSelector: null,

        // Markup to use as a template for the content of the tooltip
        template: '<span>{{value}}</span>',

        // The delay before hiding the tooltip after the mouse has left the point, slice or bar
        hideDelay: 500,
    })
  ]
});
