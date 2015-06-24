/* chartist-plugin-pointlabels 0.0.4
 * Copyright © 2015 Gion Kunz
 * Free to use under the WTFPL license.
 * http://www.wtfpl.net/
 */

!function(a,b){"function"==typeof define&&define.amd?define([],function(){return a.returnExportsGlobal=b()}):"object"==typeof exports?module.exports=b():a["Chartist.plugins.ctPointLabels"]=b()}(this,function(){return function(a,b,c){"use strict";var d={labelClass:"ct-label",labelOffset:{x:0,y:-10},textAnchor:"middle",labelInterpolationFnc:c.noop};c.plugins=c.plugins||{},c.plugins.ctPointLabels=function(a){return a=c.extend({},d,a),function(b){b instanceof c.Line&&b.on("draw",function(b){"point"===b.type&&b.group.elem("text",{x:b.x+a.labelOffset.x,y:b.y+a.labelOffset.y,style:"text-anchor: "+a.textAnchor},a.labelClass).text(a.labelInterpolationFnc(void 0===b.value.x?b.value.y:b.value.x+", "+b.value.y))})}}}(window,document,Chartist),Chartist.plugins.ctPointLabels});
//# sourceMappingURL=chartist-plugin-pointlabels.min.js.map