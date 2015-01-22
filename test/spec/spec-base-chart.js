describe('Base chart tests', function() {
  'use strict';

  beforeEach(function() {

  });

  afterEach(function() {

  });

  it('should fire initial data event correctly', function(done) {
    jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

    var chart = new Chartist.Line('.ct-chart', {
      labels: [1, 2, 3, 4],
      series: [[0, 1, 2, 3]]
    });

    chart.on('data', function(data) {
      expect(data.type).toEqual('initial');
      expect(data.data.series[0]).toEqual([0, 1, 2, 3]);
      done();
    });
  });

  it('should fire update data event correctly', function(done) {
    jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

    var chart = new Chartist.Line('.ct-chart', {
      labels: [1, 2, 3, 4],
      series: [[0, 1, 2, 3]]
    });

    chart.on('data', function(data) {
      if(data.type === 'update') {
        expect(data.data.series[0]).toEqual([3, 2, 1, 0]);
        done();
      }
    });

    chart.update({
      labels: [1, 2, 3, 4],
      series: [[3, 2, 1, 0]]
    });
  });

  it('should transform data before rendering with data event', function(done) {
    jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

    var chart = new Chartist.Line('.ct-chart', {
      labels: [1, 2, 3, 4],
      series: [[0, 1, 2, 3]]
    });

    chart.on('data', function(data) {
      data.data.series[0] = data.data.series[0].reverse();
    });

    chart.on('created', function() {
      expect(chart.data.series[0]).toEqual([3, 2, 1, 0]);
      done();
    });
  });
});
