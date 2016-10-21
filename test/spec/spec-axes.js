describe('Axes tests', function() {
  'use strict';

  describe('StepAxis projectValue should not return NaN', function() {
    it('should return 0 if options.ticks.length == 1', function() {
      var ticks = [1],
      axisUnit = {
        'pos':'y',
        'len':'height',
        'dir':'vertical',
        'rectStart':'y2',
        'rectEnd':'y1',
        'rectOffset':'x1'
      },
      data = [[1]],
      chartRect = {
        'y2':0,
        'y1':15,
        'x1':50,
        'x2':100
      },
      options = {
        'ticks': ticks
      },
      stepAxis = new Chartist.StepAxis(axisUnit, data, chartRect, options);
      expect(stepAxis.stepLength).toEqual(15);
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
      data = [[ {x: 1, y: 10}, {x: 2, y: 5}, {x: 3, y: -5} ]],
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
