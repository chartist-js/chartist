/**
 * Chartist.js plugin to display a target line on a chart.
 * With code from @gionkunz in https://github.com/gionkunz/chartist-js/issues/235
 * and @OscarGodson in https://github.com/gionkunz/chartist-js/issues/491.
 * Based on https://github.com/gionkunz/chartist-plugin-pointlabels
 */
!function(t,n,e){"use strict";var c={class:"ct-target-line",value:null};e.plugins=e.plugins||{},e.plugins.ctTargetLine=function(t){return t=e.extend({},c,t),function(n){function e(t,n,e){return t.y1-t.height()/n.max*e}n.on("created",function(n){var c=e(n.chartRect,n.bounds,t.value);n.svg.elem("line",{x1:n.chartRect.x1,x2:n.chartRect.x2,y1:c,y2:c},t.class)})}}}(window,document,Chartist);