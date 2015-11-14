# FillDonut plugin for Chartist.js

This plugin use jQuery to provides a hacky way to fill a donut before the animation will start. Also on board is a way to add multiple html or text elements to the Donut on different positions.
Plugin will just work with Chartist Pie charts.

Please visit http://gionkunz.github.io/chartist-js/plugins.html for more information.

# FillDonut plugin installation
`bower install chartist-plugin-fill-donut --save`

manual
```
download https://github.com/moxx/chartist-plugin-fill-donut/archive/master.zip
 -> search the dist folder for needed js files
 -> keep in mind you must also include jquery
 -> https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
 ```

## Available options and their defaults

```javascript
var defaultOptions = {
    fillClass: 'ct-fill-donut',
    label : {
        html: '<div class="ct-fill-donut-label"></div>',
    },
    items : [{
	class : '',
        id: '',
        content : 'fillText',
        position: 'center', //bottom, top, left, right
        offsetY: 0, //top, bottom in px
        offsetX: 0 //left, right in px
    }]
};

```

## Sample usage in Chartist.js

`bower install chartist-plugin-fill-donut --save`

Example:
```js
var chart = new Chartist.Pie('#chart-e1', {
              series: [160, 60 ],
              labels: ['', '']
          }, {
              donut: true,
              donutWidth: 20,
              startAngle: 210,
              total: 260,
              showLabel: false,
              plugins: [
                  Chartist.plugins.fillDonut({
                      items: [{ //Item 1
                          content: '<i class="fa fa-tachometer text-muted"></i>',
                          position: 'bottom',
                          offsetY : 10,
                          offsetX: -2
                      }, { //Item 2
                          content: '<h3>160<span class="small">mph</span></h3>'
                      }]
                  })
              ],
          });
          //Animation for the first series
          chart.on('draw', function(data) {
              if(data.type === 'slice' && data.index == 0) {
                  array animation
                  var pathLength = data.element._node.getTotalLength();

                  data.element.attr({
                      'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
                  });

                  var animationDefinition = {
                      'stroke-dashoffset': {
                          id: 'anim' + data.index,
                          dur: 1200,
                          from: -pathLength + 'px',
                          to:  '0px',
                          easing: Chartist.Svg.Easing.easeOutQuint,
                          fill: 'freeze'
                      }
                  };
                  data.element.attr({
                      'stroke-dashoffset': -pathLength + 'px'
                  });
                  data.element.animate(animationDefinition, true);
              }
          });
```

## Needs to be styled

```css
    /*make a color different to fill-donut series*/
    .ct-chart-donut .ct-series-a .ct-slice-donut {
        stroke: red;
    }
    /*make b hidden*/
    .ct-chart-donut .ct-series-b .ct-slice-donut {
        stroke: #efefef;
        opacity: 0.0;
    }
    /*make all fill-donut series visible and set color*/
    .ct-chart-donut .ct-fill-donut .ct-slice-donut{
        stroke: #efefef;
        opacity: 1;
    }
```