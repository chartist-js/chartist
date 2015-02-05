/**
 * Line XY Chart.
 *
 *
 *
 * @module Chartist.LineXY
 */
/* global Chartist */
(function(window, document, Chartist) {
    'use strict';

    function getSeriesData(drawContext, options) {
        var yValues = [];
        var xValues = [];

        var seriesData = [];
        this.data.series.forEach(function(series, seriesIndex) {
            xValues[seriesIndex] = [];
            yValues[seriesIndex] = [];
            seriesData[seriesIndex] = [];
            series.data.forEach(function(value, valueIndex) {
                value = this.dataTransform(value);
                seriesData[seriesIndex].push(value);
                xValues[seriesIndex][valueIndex] = value.x;
                yValues[seriesIndex][valueIndex] = value.y;
            }.bind(this));
        }.bind(this));

        drawContext.xValues = xValues;
        drawContext.yValues = yValues;

        return seriesData;
    }

    function getAndDrawAxes(drawContext, options) {
        var highLowForY = Chartist.getHighLow(drawContext.yValues);
        var highLowForX = Chartist.getHighLow(drawContext.xValues);
        // Overrides of high / low from settings
        highLowForY.high = +options.high || (options.high === 0 ? 0 : highLowForY.high);
        highLowForY.low = +options.low || (options.low === 0 ? 0 : highLowForY.low);

        var xAxisTransform = function xAxisTransform(projectedValue) {
            projectedValue.pos = drawContext.chartRect.x1 + projectedValue.pos;
            return projectedValue;
        };

        var yAxisTransform = function yAxisTransform(projectedValue) {
            projectedValue.pos = drawContext.chartRect.y1 - projectedValue.pos;
            return projectedValue;
        };

        var xLabelOffset = {
            x: options.axisX.labelOffset.x,
            y: drawContext.chartRect.y1 + options.axisX.labelOffset.y + (this.supportsForeignObject ? 5 : 20)
        };

        var yLabelOffset = {
            x: options.chartPadding + options.axisY.labelOffset.x + (this.supportsForeignObject ? -10 : 0),
            y: options.axisY.labelOffset.y + (this.supportsForeignObject ? -15 : 0)
        };

        if (this.axisX) {
            this.axisX.initialize(
                drawContext.chartRect,
                xAxisTransform,
                xLabelOffset,
                highLowForX);
        }

        if (this.axisY) {
            this.axisY.initialize(
                drawContext.chartRect,
                yAxisTransform,
                yLabelOffset,
                highLowForY);
        }

        var axisX = this.axisX || new Chartist.LinearScaleAxis(
            Chartist.Axis.units.x,
            drawContext.chartRect,
            xAxisTransform,
            xLabelOffset, {
                highLow: highLowForX,
                scaleMinSpace: options.axisX.scaleMinSpace
            }
        );

        var axisY = this.axisY || new Chartist.LinearScaleAxis(
            Chartist.Axis.units.y,
            drawContext.chartRect,
            yAxisTransform,
            yLabelOffset, {
                highLow: highLowForY,
                scaleMinSpace: options.axisY.scaleMinSpace
            }
        );

        var ticksX = axisX.ticks || axisX.bounds.values;
        var ticksY = axisY.ticks || axisY.bounds.values;

        Chartist.createAxis(
            axisX,
            ticksX,
            drawContext.chartRect,
            drawContext.gridGroup,
            drawContext.labelGroup,
            this.supportsForeignObject,
            options,
            this.eventEmitter
        );

        Chartist.createAxis(
            axisY,
            ticksY,
            drawContext.chartRect,
            drawContext.gridGroup,
            drawContext.labelGroup,
            this.supportsForeignObject,
            options,
            this.eventEmitter
        );

        return {
            axisX: axisX,
            axisY: axisY
        }
    }

    function getPathCoordinatesAndDrawPoints(drawContext, seriesIndex, options) {
        var pathCoordinates = [];
        var seriesData = drawContext.seriesData[seriesIndex];
        seriesData.forEach(function(value, valueIndex) {
            var p = {
                x: drawContext.chartRect.x1 + drawContext.axisX.projectValue(value.x, valueIndex, seriesData).pos,
                y: drawContext.chartRect.y1 - drawContext.axisY.projectValue(value.y, valueIndex, seriesData).pos
            };
            pathCoordinates.push(p.x, p.y);

            //If we should show points we need to create them now to avoid secondary loop
            // Small offset for Firefox to render squares correctly
            if (options.showPoint) {
                this.drawPoint(drawContext.seriesGroups[seriesIndex], p, {
                    'value.x': value.x,
                    'value.y': value.y,
                    'meta': Chartist.getMetaData(this.data.series[seriesIndex], valueIndex)
                }, {
                    value: value,
                    index: valueIndex,
                }, options);
            }
        }.bind(this));

        return pathCoordinates;
    }

    function emitCreatedEvent(drawContext, options) {
        this.eventEmitter.emit('created', {
            axisX: drawContext.axisX,
            axisY: drawContext.axisY,
            chartRect: drawContext.chartRect,
            svg: this.svg,
            options: options
        });
    }

    function LineXY(query, data, options, responsiveOptions, axisX, axisY, dataTransform) {
        Chartist.LineXY.super.constructor.call(this,
            query,
            data,
            options,
            responsiveOptions);
        this.axisX = axisX;
        this.axisY = axisY;
        this.dataTransform = dataTransform || Chartist.noop;
    }

    // Creating line chart type in Chartist namespace
    Chartist.LineXY = Chartist.Line.extend({
        constructor: LineXY,
        getSeriesData: getSeriesData,
        getAndDrawAxes: getAndDrawAxes,
        getPathCoordinatesAndDrawPoints: getPathCoordinatesAndDrawPoints,
        emitCreatedEvent: emitCreatedEvent
    });

}(window, document, Chartist));