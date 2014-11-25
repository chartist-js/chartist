(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function () {
      return (root.returnExportsGlobal = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Chartist'] = factory();
  }
}(this, function () {

  /* Chartist.js 0.4.1
   * Copyright © 2014 Gion Kunz
   * Free to use under the WTFPL license.
   * http://www.wtfpl.net/
   */


  return Chartist;


}));
