/**
 * The linear scale axis uses standard linear scale projection of values along an axis.
 *
 * @module Chartist.LinearScaleAxis
 */
/* global Chartist */
(function (window, document, Chartist) {
  'use strict';

  function LinearScaleAxis(axisUnit, chartRect, transform, labelOffset, options) {
    Chartist.LinearScaleAxis.super.constructor.call(this,
      axisUnit,
      chartRect,
      transform,
      labelOffset,
      options);

    this.bounds = Chartist.getBounds(this.axisLength, options.highLow, options.scaleMinSpace, options.referenceValue);
  }

  function projectValue(value) {
    return {
      pos: this.axisLength * (value - this.bounds.min) / (this.bounds.range + this.bounds.step),
      len: Chartist.projectLength(this.axisLength, this.bounds.step, this.bounds)
    };
  }

  Chartist.LinearScaleAxis = Chartist.Axis.extend({
    constructor: LinearScaleAxis,
    projectValue: projectValue
  });

}(window, document, Chartist));
