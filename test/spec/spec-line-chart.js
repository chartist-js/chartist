describe('Line chart tests', function () {
  'use strict';

  beforeEach(function () {

  });

  afterEach(function () {

  });

  describe('grids', function() {

    var chart;
    var options;
    var data;

    beforeEach(function() {
      data = {
        series: [[
          { x: 1, y: 1 },
          { x: 3, y: 5 }
        ]]
      };
      options =  {
        axisX: {
          type: Chartist.AutoScaleAxis,
          onlyInteger: true
        },
        axisY: {
          type: Chartist.AutoScaleAxis,
          onlyInteger: true
        }
      };
    });

    function onCreated(fn) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');
      chart = new Chartist.Line('.ct-chart', data, options);
      chart.on('created', fn);
    }

    it('should contain ct-grids group', function(done) {
      onCreated(function () {
        expect($('g.ct-grids').length).toBe(1);
        done();
      });
    });

    it('should draw grid lines', function(done) {
      onCreated(function () {
        expect($('g.ct-grids line.ct-grid.ct-horizontal').length).toBe(3);
        expect($('g.ct-grids line.ct-grid.ct-vertical').length).toBe(5);
        done();
      });
    });

    it('should draw grid background', function(done) {
      options.showGridBackground = true;
      onCreated(function () {
        expect($('g.ct-grids rect.ct-grid-background').length).toBe(1);
        done();
      });
    });

    it('should not draw grid background if option set to false', function(done) {
      options.showGridBackground = false;
      onCreated(function () {
        expect($('g.ct-grids rect.ct-grid-background').length).toBe(0);
        done();
      });
    });

  });

  describe('AxisY position tests', function() {
    var options;
    var data;

    beforeEach(function() {
      data = {
        series: [[
          { x: 1, y: 1 },
          { x: 3, y: 5 }
        ]]
      };
      options =  {};
    });

    function onCreated(callback) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');
      var chart = new Chartist.Line('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('class should be ct-start if position start', function(done) {
      options = {
        axisY: {
          position: 'start'
        }
      };
      onCreated(function() {
          $('.ct-label.ct-vertical').each(function() {
            expect($(this).attr('class')).toBe('ct-label ct-vertical ct-start');
          });
          done();
        });
      });

    it('class should be ct-end if position is any other value than start', function(done) {
      options = {
        axisY: {
          position: 'right'
        }
      };
      onCreated(function() {
        $('.ct-label.ct-vertical').each(function() {
          expect($(this).attr('class')).toBe('ct-label ct-vertical ct-end');
        });
        done();
      });
    });
  });

  describe('ct:value attribute', function () {
    it('should contain x and y value for each datapoint', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', {
        series: [[
          {x: 1, y: 2},
          {x: 3, y: 4}
        ]]
      }, {
        axisX: {
          type: Chartist.FixedScaleAxis
        }
      });

      chart.on('created', function () {
        expect($('.ct-point').eq(0).attr('ct:value')).toBe('1,2');
        expect($('.ct-point').eq(1).attr('ct:value')).toBe('3,4');
        done();
      });
    });

    it('should render values that are zero', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', {
        series: [[
          {x: 0, y: 1},
          {x: 1, y: 0},
          {x: 0, y: 0}
        ]]
      }, {
        axisX: {
          type: Chartist.FixedScaleAxis
        }
      });

      chart.on('created', function () {
        expect($('.ct-point').eq(0).attr('ct:value')).toBe('0,1');
        expect($('.ct-point').eq(1).attr('ct:value')).toBe('1,0');
        expect($('.ct-point').eq(2).attr('ct:value')).toBe('0,0');
        done();
      });
    });
  });

  describe('Meta data tests', function () {
    it('should render meta data correctly with mixed value array', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var meta = {
        test: 'Serialized Test'
      };

      var data = {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
        series: [
          [5, 2, 4, {
            value: 2,
            meta: meta
          }, 0]
        ]
      };

      var chart = new Chartist.Line('.ct-chart', data);

      chart.on('created', function () {
        expect(Chartist.deserialize($('.ct-point').eq(3).attr('ct:meta'))).toEqual(meta);
        done();
      });
    });

    it('should render meta data correctly with mixed value array and different normalized data length', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var meta = {
        test: 'Serialized Test'
      };

      var data = {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        series: [
          [5, 2, 4, {
            value: 2,
            meta: meta
          }, 0]
        ]
      };

      var chart = new Chartist.Line('.ct-chart', data);

      chart.on('created', function () {
        expect(Chartist.deserialize($('.ct-point').eq(3).attr('ct:meta'))).toEqual(meta);
        done();
      });
    });

    it('should render meta data correctly with mixed value array and mixed series notation', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var seriesMeta = 9999,
        valueMeta = {
          test: 'Serialized Test'
        };

      var data = {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        series: [
          [5, 2, 4, {
            value: 2,
            meta: valueMeta
          }, 0],
          {
            meta: seriesMeta,
            data: [5, 2, {
              value: 2,
              meta: valueMeta
            }, 0]
          }
        ]
      };

      var chart = new Chartist.Line('.ct-chart', data);

      chart.on('created', function () {
        expect(Chartist.deserialize($('.ct-series-a .ct-point').eq(3).attr('ct:meta'))).toEqual(valueMeta);
        expect(Chartist.deserialize($('.ct-series-b')).attr('ct:meta')).toEqual('' + seriesMeta);
        expect(Chartist.deserialize($('.ct-series-b .ct-point').eq(2).attr('ct:meta'))).toEqual(valueMeta);
        done();
      });
    });
  });

  describe('Line charts with holes', function () {
    it('should render correctly with Interpolation.none and holes everywhere', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      }, {
        lineSmooth: false
      });

      chart.on('draw', function (context) {
        if (context.type === 'line') {
          expect(context.path.pathElements.map(function (pathElement) {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            {command: 'L', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'L', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });

    it('should render correctly with Interpolation.cardinal and holes everywhere', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      }, {
        lineSmooth: true
      });

      chart.on('draw', function (context) {
        if (context.type === 'line') {
          expect(context.path.pathElements.map(function (pathElement) {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            // Cardinal should create Line path segment if only one connection
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            // Cardinal should create Curve path segment for 2 or more connections
            {command: 'C', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'C', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });

    it('should render correctly with Interpolation.monotoneCubic and holes everywhere', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      }, {
        lineSmooth: Chartist.Interpolation.monotoneCubic()
      });

      chart.on('draw', function (context) {
        if (context.type === 'line') {
          expect(context.path.pathElements.map(function (pathElement) {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            // Monotone cubic should create Line path segment if only one connection
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            // Monotone cubic should create Curve path segment for 2 or more connections
            {command: 'C', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'C', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });

    it('should render correctly with Interpolation.simple and holes everywhere', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      }, {
        lineSmooth: Chartist.Interpolation.simple()
      });

      chart.on('draw', function (context) {
        if (context.type === 'line') {
          expect(context.path.pathElements.map(function (pathElement) {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            {command: 'C', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            {command: 'C', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'C', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });

    it('should render correctly with postponed Interpolation.step and holes everywhere', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      }, {
        lineSmooth: Chartist.Interpolation.step()
      });

      chart.on('draw', function (context) {
        if (context.type === 'line') {
          expect(context.path.pathElements.map(function (pathElement) {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            {command: 'L', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            {command: 'L', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            {command: 'L', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'L', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'L', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });

    it('should render correctly with preponed Interpolation.step and holes everywhere', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      }, {
        lineSmooth: Chartist.Interpolation.step({
          postpone: false
        })
      });

      chart.on('draw', function (context) {
        if (context.type === 'line') {
          expect(context.path.pathElements.map(function (pathElement) {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            {command: 'L', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'L', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'L', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'L', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });
  });

  describe('Single value data tests', function() {
    var data;

    beforeEach(function() {
      data = {
        labels: [1],
        series: [[1]]
      };
    });

    function onCreated(callback) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');
      var chart = new Chartist.Line('.ct-chart', data);
      chart.on('created', callback);
    }

    it('should render without NaN values and points', function(done) {
      onCreated(function() {
          expect($('.ct-line').eq(0).attr('d')).toBe('M50,15');
          expect($('.ct-point').eq(0).attr('x1')).toBe('50');
          expect($('.ct-point').eq(0).attr('x2')).toBe('50.01');
          done();
        });
      });
  });

  describe('Empty data tests', function () {
    it('should render empty grid with no data', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart');

      chart.on('created', function () {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });

    it('should render empty grid with only labels', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var data = {
        labels: [1, 2, 3, 4]
      };
      var chart = new Chartist.Line('.ct-chart', data);

      chart.on('created', function () {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        // Find exactly as many horizontal grid lines as labels were specified (Step Axis)
        expect(document.querySelectorAll('.ct-grids .ct-grid.ct-horizontal').length).toBe(data.labels.length);
        done();
      });
    });

    it('should generate labels and render empty grid with only series in data', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var data = {
        series:  [
          [1, 2, 3, 4],
          [2, 3, 4],
          [3, 4]
        ]
      };
      var chart = new Chartist.Line('.ct-chart', data);

      chart.on('created', function () {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        // Should generate the labels using the largest series count
        expect(document.querySelectorAll('.ct-grids .ct-grid.ct-horizontal').length).toBe(Math.max.apply(null, data.series.map(function(series) {
          return series.length;
        })));
        done();
      });
    });

    it('should render empty grid with no data and specified high low', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', null, {
        width: 400,
        height: 300,
        high: 100,
        low: -100
      });

      chart.on('created', function () {
        // Find first and last label
        var labels = document.querySelectorAll('.ct-labels .ct-label.ct-vertical');
        var firstLabel = labels[0];
        var lastLabel = labels[labels.length - 1];

        expect(firstLabel.textContent).toBe('-100');
        expect(lastLabel.textContent).toBe('100');
        done();
      });
    });

    it('should render empty grid with no data and reverseData option', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', null, {
        reverseData: true
      });

      chart.on('created', function () {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });
  });

  describe('x1 and x2 attribute', function () {
    it('should contain just a datapoint', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Line('.ct-chart', {
        series: [[
          {x: 1, y: 2}
        ]]
      }, {
       fullWidth: true
      });

      chart.on('created', function () {
        expect($('.ct-point').eq(0).attr('x1')).not.toBe('NaN');
        expect($('.ct-point').eq(0).attr('x2')).not.toBe('NaN');
        done();
      });
    });
  });
});
