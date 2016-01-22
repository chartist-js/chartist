describe('Line chart tests', function () {
  'use strict';

  beforeEach(function () {

  });

  afterEach(function () {

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

    it('should render correctly with Interpolation.simple, holes everywhere, and stacked lines', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var series = [
        [5, 5, 10, 8, 7, 5, 4, null, null, null ],
        [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null],
        [4, null, null, null, 10, 10, 7, 8, 6, 9]
      ];
      var chart = new Chartist.Line('.ct-chart', {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: series
      }, {
        stackLines: true,
        lineSmooth: Chartist.Interpolation.simple()
      });

      var commandLines = [];
      var expectedCommandLines = [
        [
          {"command":"M","data":{"value":{"y":5},"valueIndex":0}},
          {"command":"C","data":{"value":{"y":5},"valueIndex":1}},
          {"command":"C","data":{"value":{"y":10},"valueIndex":2}},
          {"command":"C","data":{"value":{"y":8},"valueIndex":3}},
          {"command":"C","data":{"value":{"y":7},"valueIndex":4}},
          {"command":"C","data":{"value":{"y":5},"valueIndex":5}},
          {"command":"C","data":{"value":{"y":4},"valueIndex":6}}
        ],
        [
          {"command":"M","data":{"value":{"y":20},"valueIndex":1}},
          {"command":"C","data":{"value":{"y":0},"valueIndex":2}},
          {"command":"M","data":{"value":{"y":9},"valueIndex":4}},
          {"command":"C","data":{"value":{"y":8},"valueIndex":5}},
          {"command":"C","data":{"value":{"y":8},"valueIndex":6}},
          {"command":"M","data":{"value":{"y":1},"valueIndex":8,"meta":"meta data"}}
        ],
        [
          {"command":"M","data":{"value":{"y":9},"valueIndex":0}},
          {"command":"M","data":{"value":{"y":26},"valueIndex":4}},
          {"command":"C","data":{"value":{"y":23},"valueIndex":5}},
          {"command":"C","data":{"value":{"y":19},"valueIndex":6}},
          {"command":"C","data":{"value":{"y":8},"valueIndex":7}},
          {"command":"C","data":{"value":{"y":7},"valueIndex":8}},
          {"command":"C","data":{"value":{"y":9},"valueIndex":9}}
        ]
      ];

      var onDraw = function (context) {
        var commands;
        if (context.type === 'line') {
          commands = context.path.pathElements.map(function (pathElement) {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          });
          commandLines.push(commands);

          // wait until three lines are drawn
          if (commandLines.length === series.length) {
            // jasmine has a really hard time comparing these two arrays,
            // even if we loop through each level individually.
            // so cheat and compare the stringified versions.
            expect(JSON.stringify(commandLines)).
              toEqual(JSON.stringify(expectedCommandLines));

            chart.off('draw', onDraw);
            done();
          }
        }
      }

      chart.on('draw', onDraw);
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
});
