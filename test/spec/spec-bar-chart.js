describe('Bar chart tests', function() {
  'use strict';

  beforeEach(function() {

  });

  afterEach(function() {

  });

  describe('ct:value attribute', function() {
    it('should contain x and y value for each bar', function(done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Bar('.ct-chart', {
        series: [[
          {x: 1, y: 2},
          {x: 3, y: 4}
        ]]
      }, {
        axisX: {
          type: Chartist.AutoScaleAxis
        }
      });

      chart.on('created', function() {
        expect($('.ct-bar').eq(0).attr('ct:value')).toEqual('1,2');
        expect($('.ct-bar').eq(1).attr('ct:value')).toEqual('3,4');
        done();
      });
    });

    it('should render values that are zero', function(done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Bar('.ct-chart', {
        series: [[
          {x: 0, y: 1},
          {x: 2, y: 0},
          {x: 0, y: 0}
        ]]
      }, {
        axisX: {
          type: Chartist.AutoScaleAxis
        }
      });

      chart.on('created', function() {
        expect($('.ct-bar').eq(0).attr('ct:value')).toEqual('0,1');
        expect($('.ct-bar').eq(1).attr('ct:value')).toEqual('2,0');
        expect($('.ct-bar').eq(2).attr('ct:value')).toEqual('0,0');
        done();
      });
    });
  });

  describe('Meta data tests', function () {
    it('should render meta data correctly with mixed value array', function(done) {
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

      var chart = new Chartist.Bar('.ct-chart', data);

      chart.on('created', function() {
        expect(Chartist.deserialize($('.ct-bar').eq(3).attr('ct:meta'))).toEqual(meta);
        done();
      });
    });

    it('should render meta data correctly with mixed value array and different normalized data length', function(done) {
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

      var chart = new Chartist.Bar('.ct-chart', data);

      chart.on('created', function() {
        expect(Chartist.deserialize($('.ct-bar').eq(3).attr('ct:meta'))).toEqual(meta);
        done();
      });
    });

    it('should render meta data correctly with mixed value array and mixed series notation', function(done) {
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

      var chart = new Chartist.Bar('.ct-chart', data);

      chart.on('created', function() {
        expect(Chartist.deserialize($('.ct-series-a .ct-bar').eq(3).attr('ct:meta'))).toEqual(valueMeta);
        expect(Chartist.deserialize($('.ct-series-b')).attr('ct:meta')).toEqual(''+seriesMeta);
        expect(Chartist.deserialize($('.ct-series-b .ct-bar').eq(2).attr('ct:meta'))).toEqual(valueMeta);
        done();
      });
    });
  });
});
