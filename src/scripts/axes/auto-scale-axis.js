/**
 * The auto scale axis uses standard linear scale projection of values along an axis. It uses order of magnitude to find a scale automatically and evaluates the available space in order to find the perfect amount of ticks for your chart.
 * **Options**
 * The following options are used by this axis in addition to the default axis options outlined in the axis configuration of the chart default settings.
 * ```javascript
 * var options = {
 *   // If high is specified then the axis will display values explicitly up to this value and the computed maximum from the data is ignored
 *   high: 100,
 *   // If low is specified then the axis will display values explicitly down to this value and the computed minimum from the data is ignored
 *   low: 0,
 *   // This option will be used when finding the right scale division settings. The amount of ticks on the scale will be determined so that as many ticks as possible will be displayed, while not violating this minimum required space (in pixel).
 *   scaleMinSpace: 20,
 *   // Can be set to true or false. If set to true, the scale will be generated with whole numbers only.
 *   onlyInteger: true,
 *   // The reference value can be used to make sure that this value will always be on the chart. This is especially useful on bipolar charts where the bipolar center always needs to be part of the chart.
 *   referenceValue: 5
 * };
 * ```
 *
 * @module Chartist.AutoScaleAxis
 */
/* global Chartist */
(function (window, document, Chartist) {
  'use strict';

  function AutoScaleAxis(axisUnit, data, chartRect, options) {
    // Usually we calculate highLow based on the data but this can be overriden by a highLow object in the options
    var highLow = options.highLow || Chartist.getHighLow(data.normalized, options, axisUnit.pos);
    this.bounds = Chartist.getBounds(chartRect[axisUnit.rectEnd] - chartRect[axisUnit.rectStart], highLow, options.scaleMinSpace || 20, options.onlyInteger);

    var ticks = this.bounds.values;
    if (options.ticks) {
      ticks = ticks.concat(options.ticks).filter(function(value, index, self) {
        return self.indexOf(value) === index;
      }).sort(function(a, b) {
        return a - b;
      });
    }

    if (!isNaN(parseFloat(options.ensureTickValue)) && ticks.indexOf(options.ensureTickValue) == -1) {

      // redefine ticks by ensuring a given tick value and by preserving the calculated step size / interval
      ticks = [];
      var currTick = options.ensureTickValue;
      var tickStep = this.bounds.step;
      var minTick = this.bounds.min;
      var maxTick = this.bounds.max;

      // Step down from the ensured tick value to generate lower tick values and define a new minimum limit
      while (currTick > minTick) {
        currTick -= tickStep;
        ticks.push(Chartist.roundWithPrecision(currTick));
      }
      ticks = ticks.reverse();
      this.bounds.min = currTick;

      // Step up from the ensured value to generate higher tick values and define a new maximum limit
      currTick = options.ensureTickValue;
      ticks.push(currTick);
      while (currTick < maxTick) {
        currTick += tickStep;
        ticks.push(Chartist.roundWithPrecision(currTick));
      }
      this.bounds.max = currTick;

      // redefine bounds properties by new ticks, minimum and maximum limit
      this.bounds.valueRange = this.bounds.range = this.bounds.max - this.bounds.min;
      this.bounds.numberOfSteps = ticks.length;

    }

    this.range = {
      min: this.bounds.min,
      max: this.bounds.max
    };

    Chartist.AutoScaleAxis.super.constructor.call(this,
      axisUnit,
      chartRect,
      ticks,
      options);
  }

  function projectValue(value) {
    return this.axisLength * (+Chartist.getMultiValue(value, this.units.pos) - this.bounds.min) / this.bounds.range;
  }

  Chartist.AutoScaleAxis = Chartist.Axis.extend({
    constructor: AutoScaleAxis,
    projectValue: projectValue
  });

}(window, document, Chartist));
