describe('Pie chart tests', function() {
  'use strict';

  beforeEach(function() {

  });

  afterEach(function() {

  });

  describe('Meta data tests', function() {
    it('should render meta data correctly on slice with mixed value array', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var meta = {
        test: 'Serialized Test'
      };

      var data = {
        labels: ['A', 'B', 'C'],
        series: [5, {
          value: 8,
          meta: meta
        }, 1]
      };

      var chart = new Chartist.Pie('.ct-chart', data);

      chart.on('created', function() {
        expect(Chartist.deserialize($('.ct-slice-pie').eq(1).attr('ct:meta'))).toEqual(meta);
        done();
      });
    });
  });
});
