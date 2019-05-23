/* chartist-plugin-pointlabels 0.0.6
 * Copyright © 2018 Gion Kunz
 * Free to use under the WTFPL license.
 * http://www.wtfpl.net/
 */

!function(a,b){"function"==typeof define&&define.amd?define(["chartist"],function(c){return a.returnExportsGlobal=b(c)}):"object"==typeof exports?module.exports=b(require("chartist")):a["Chartist.plugins.ctPointLabels"]=b(Chartist)}(this,function(a){return function(a,b,c){"use strict";var d={labelClass:"ct-label",labelOffset:{x:0,y:-10},textAnchor:"middle",align:"center",labelInterpolationFnc:c.noop},e={point:function(a){return{x:a.x,y:a.y}},bar:{left:function(a){return{x:a.x1,y:a.y1}},center:function(a){return{x:a.x1+(a.x2-a.x1)/2,y:a.y1}},right:function(a){return{x:a.x2,y:a.y1}}}};c.plugins=c.plugins||{},c.plugins.ctPointLabels=function(a){function b(b,c){var d=void 0!==c.value.x&&c.value.y?c.value.x+", "+c.value.y:c.value.y||c.value.x;c.group.elem("text",{x:b.x+a.labelOffset.x,y:b.y+a.labelOffset.y,style:"text-anchor: "+a.textAnchor},a.labelClass).text(a.labelInterpolationFnc(d))}return a=c.extend({},d,a),function(d){(d instanceof c.Line||d instanceof c.Bar)&&d.on("draw",function(c){var d=e[c.type]&&e[c.type][a.align]||e[c.type];d&&b(d(c),c)})}}}(window,document,a),a.plugins.ctPointLabels});
//# sourceMappingURL=chartist-plugin-pointlabels.min.js.map