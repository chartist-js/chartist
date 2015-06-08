/**
 * The linear scale axis uses standard linear scale projection of values along an axis.
 *
 * @module Chartist.LinearScaleAxis
 */
/* global Chartist */
(function (window, document, Chartist) {
  'use strict';

  function LinearScaleAxis(axisUnit, data, chartRect, options) {
    // Usually we calculate highLow based on the data but this can be overriden by a highLow object in the options
    this.highLow = options.highLow || Chartist.getHighLow(data.normalized, options, axisUnit.pos);
    this.bounds = Chartist.getBounds(chartRect[axisUnit.rectEnd] - chartRect[axisUnit.rectStart], this.highLow, options.scaleMinSpace, options.referenceValue, options.onlyInteger);

    Chartist.LinearScaleAxis.super.constructor.call(this,
      axisUnit,
      chartRect,
      this.bounds.values,
      options);
  }

  function projectValue(value) {
    return this.axisLength * (+Chartist.getMultiValue(value, this.units.pos) - this.bounds.min) / this.bounds.range;
  }

  Chartist.LinearScaleAxis = Chartist.Axis.extend({
    constructor: LinearScaleAxis,
    projectValue: projectValue
  });

}(window, document, Chartist));
