/**
 * Step axis for step based charts like bar chart or step based line chart
 *
 * @module Chartist.DateAxis
 */
/* global Chartist */
(function(window, document, Chartist) {
    'use strict';

    function DateAxis(units, options) {
        this.units = units;
        this.counterUnits = units === Chartist.Axis.units.x ? Chartist.Axis.units.y : Chartist.Axis.units.x;
        this.options = options || {};

        this.ticksProvider = this.options.ticksProvider || new Chartist.DateTicksProvider();
        this.ticks = [];
    }

    function initialize(chartRect, transform, labelOffset, highLow) {
        this.chartRect = chartRect;
        this.axisLength = chartRect[this.units.rectEnd] - chartRect[this.units.rectStart];
        this.gridOffset = chartRect[this.units.rectOffset];
        this.transform = transform;
        this.labelOffset = labelOffset;


        this.ticks = this.ticksProvider.getTicks(highLow);
        this.min = this.ticks[0].valueOf();
        this.range = this.ticks[this.ticks.length - 1].valueOf() - this.min;
    }

    function projectValue(value) {
        return {
            pos: value * (this.axisLength / this.range) - this.min * (this.axisLength / this.range),
            len: Chartist.projectLength(this.axisLength, this.range / this.ticks.length , this)
        };
    }

    Chartist.DateAxis = Chartist.Axis.extend({
        constructor: DateAxis,
        projectValue: projectValue,
        initialize: initialize
    });

}(window, document, Chartist));