/**
 * Axis base class used to implement different axis types
 *
 * @module Chartist.Axis
 */
/* global Chartist */
(function (window, document, Chartist) {
  'use strict';

  var axisUnits = {
    x: {
      pos: 'x',
      len: 'width',
      dir: 'horizontal'
    },
    y: {
      pos: 'y',
      len: 'height',
      dir: 'vertical'
    }
  };

  function Axis(units, axisLength, options) {
    this.units = units;
    this.counterUnits = units === axisUnits.x ? axisUnits.y : axisUnits.x;
    this.axisLength = axisLength;
    this.options = options;
  }

  Chartist.Axis = Chartist.Class.extend({
    constructor: Axis,
    projectValue: function(value, index, data) {
      throw new Error('Base axis can\'t be instantiated!');
    }
  });

  Chartist.Axis.units = axisUnits;

}(window, document, Chartist));
