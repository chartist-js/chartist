/**
 * The linear scale axis uses standard linear scale projection of values along an axis.
 *
 * @module Chartist.LinearScaleAxis
 */
/* global Chartist */
(function (window, document, Chartist) {
  'use strict';

  function LinearScaleAxis(axisUnit, chartRect, options) {
    Chartist.LinearScaleAxis.super.constructor.call(this,
      axisUnit,
      chartRect,
      options);

    this.bounds = Chartist.getBounds(this.axisLength, options.highLow, options.scaleMinSpace, options.referenceValue, options.onlyInteger);
  }

  function projectValue(value) {
    return {
      pos: this.axisLength * (value - this.bounds.min) / this.bounds.range,
      len: Chartist.projectLength(this.axisLength, this.bounds.step, this.bounds)
    };
  }

  Chartist.LinearScaleAxis = Chartist.Axis.extend({
    constructor: LinearScaleAxis,
    projectValue: projectValue
  });

}(window, document, Chartist));
