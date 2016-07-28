describe('Axes tests', function() {
  'use strict';

  describe('auto scale axis', function () {

    var axisUnit, chartRect, options, genericAsAxis, otherAsAxis;

    beforeEach(function() {
      axisUnit = {
        'pos':'y',
        'len':'height',
        'dir':'vertical',
        'rectStart':'y2',
        'rectEnd':'y1',
        'rectOffset':'x1'
      };
      chartRect = {
        'padding':{'top':15,'right':15,'bottom':5,'left':10},
        'y2':15,
        'y1':141,
        'x1':50,
        'x2':269
      };
      options = {
        highLow: {
          high: 8.2,
          low: -1
        }
      };
      genericAsAxis = new Chartist.AutoScaleAxis(axisUnit, {}, chartRect, options);

    });

    it('should ensure the inclusion of a tick value set in axis options', function() {

      // proves the possibility of ticks not including a value like 0
      // (0 is probably the most popular use case here)
      expect(genericAsAxis.bounds.step).toEqual(2);
      expect(genericAsAxis.ticks).not.toContain(0);
      expect(genericAsAxis.ticks).toEqual([ -1, 1, 3, 5, 7, 9 ]);

      // preserves step size but ensures the inclusion of zero in ticks
      options.ensureTickValue = 0;
      otherAsAxis = new Chartist.AutoScaleAxis(axisUnit, {}, chartRect, options);
      expect(otherAsAxis.bounds.step).toEqual(genericAsAxis.bounds.step);
      expect(otherAsAxis.ticks).toContain(0);

    });

    it('should ensure the inclusion of a floating number as well', function() {
      options.ensureTickValue = -1.25;
      otherAsAxis = new Chartist.AutoScaleAxis(axisUnit, {}, chartRect, options);
      expect(otherAsAxis.bounds.step).toEqual(genericAsAxis.bounds.step);
      expect(otherAsAxis.ticks).toContain(-1.25);
    });

    it('should re-set the bound\'s range and maximum value if the ensured tick value is larger than the calculated maximum', function() {
      options.ensureTickValue = 250;
      otherAsAxis = new Chartist.AutoScaleAxis(axisUnit, {}, chartRect, options);
      expect(otherAsAxis.bounds.step).toEqual(genericAsAxis.bounds.step);
      expect(otherAsAxis.bounds.range).toBeGreaterThan(genericAsAxis.bounds.range);
      expect(otherAsAxis.bounds.max).toEqual(250);
      expect(otherAsAxis.ticks).toContain(250);
    });

    it('should re-set the bound\'s range and minimum value if the ensured tick value is lower than the calculated minimum', function() {
      options.ensureTickValue = -250;
      otherAsAxis = new Chartist.AutoScaleAxis(axisUnit, {}, chartRect, options);
      expect(otherAsAxis.bounds.step).toEqual(genericAsAxis.bounds.step);
      expect(otherAsAxis.bounds.range).toBeGreaterThan(genericAsAxis.bounds.range);
      expect(otherAsAxis.ticks).toContain(-250);
      expect(otherAsAxis.bounds.min).toEqual(-250);
    });

  });

  describe('fixed scale axis', function () {
    it('should order the tick array', function() {

      var ticks = [10, 5, 0, -5, -10],
      axisUnit = {
        'pos':'y',
        'len':'height',
        'dir':'vertical',
        'rectStart':'y2',
        'rectEnd':'y1',
        'rectOffset':'x1'
      },
      data = {
        'raw': {
          'series':[[ {x: 1, y: 10}, {x: 2, y: 5}, {x: 3, y: -5} ]]
        },
        'normalized':[[ {'y':10,'x':1},{'y':5,'x':2},{'y':-5,'x':3} ]]
      },
      chartRect = {
        'padding':{'top':15,'right':15,'bottom':5,'left':10},
        'y2':15,
        'y1':141,
        'x1':50,
        'x2':269
      },
      options = {
        'offset':40,
        'position':'start',
        'labelOffset':{'x':0,'y':0},
        'showLabel':true,
        'showGrid':true,
        'scaleMinSpace':20,
        'onlyInteger':false,
        'ticks': ticks
      },
      fsaxis = new Chartist.FixedScaleAxis(axisUnit, data, chartRect, options);
      expect(fsaxis.ticks).toEqual([-10, -5, 0, 5, 10]);
    });

  });

  describe('axis label and grid creation', function () {
    var ticks, chartRect, chartOptions, eventEmitter, gridGroup, labelGroup;

    beforeEach(function() {
      eventEmitter = Chartist.EventEmitter();
      gridGroup = new Chartist.Svg('g');
      labelGroup = new Chartist.Svg('g');
      ticks = [1, 2];
      chartRect = {
        padding: {
          bottom: 5,
          left: 10,
          right: 15,
          top: 15
        },
        y2: 15,
        y1: 250,
        x1: 50,
        x2: 450,
        width: function() {
          return this.x2 - this.x1;
        },
        height: function() {
          return this.y1 - this.y2;
        }
      };

      chartOptions = {
        axisX: {
          offset: 30,
          position: 'end',
          labelOffset: {
            x: 0,
            y: 0
          },
          showLabel: true,
          showGrid: true
        },
        classNames: {
          label: 'ct-label',
          labelGroup: 'ct-labels',
          grid: 'ct-grid',
          gridGroup: 'ct-grids',
          vertical: 'ct-vertical',
          horizontal: 'ct-horizontal',
          start: 'ct-start',
          end: 'ct-end'
        }
      };
    });

    it('should skip all grid lines and labels for interpolated value of null', function() {
      chartOptions.axisX.labelInterpolationFnc = function(value, index) {
        return index === 0 ? null : value;
      };

      var axis = new Chartist.Axis(Chartist.Axis.units.x, chartRect, ticks, null);
      axis.projectValue = function(value) {
        return value;
      };

      axis.createGridAndLabels(gridGroup, labelGroup, true, chartOptions, eventEmitter);
      expect(gridGroup.querySelectorAll('.ct-grid').svgElements.length).toBe(1);
      expect(labelGroup.querySelectorAll('.ct-label').svgElements.length).toBe(1);
    });

    it('should skip all grid lines and labels for interpolated value of undefined', function() {
      chartOptions.axisX.labelInterpolationFnc = function(value, index) {
        return index === 0 ? undefined : value;
      };

      var axis = new Chartist.Axis(Chartist.Axis.units.x, chartRect, ticks, null);
      axis.projectValue = function(value) {
        return value;
      };

      axis.createGridAndLabels(gridGroup, labelGroup, true, chartOptions, eventEmitter);
      expect(gridGroup.querySelectorAll('.ct-grid').svgElements.length).toBe(1);
      expect(labelGroup.querySelectorAll('.ct-label').svgElements.length).toBe(1);
    });

    it('should include all grid lines and labels for interpolated value of empty strings', function() {
      chartOptions.axisX.labelInterpolationFnc = function(value, index) {
        return index === 0 ? '' : value;
      };

      var axis = new Chartist.Axis(Chartist.Axis.units.x, chartRect, ticks, null);
      axis.projectValue = function(value) {
        return value;
      };

      axis.createGridAndLabels(gridGroup, labelGroup, true, chartOptions, eventEmitter);
      expect(gridGroup.querySelectorAll('.ct-grid').svgElements.length).toBe(2);
      expect(labelGroup.querySelectorAll('.ct-label').svgElements.length).toBe(2);
    });
  });
});
