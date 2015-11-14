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

  describe('Simple Pie Chart', function() {
    // https://gionkunz.github.io/chartist-js/examples.html#simple-pie-chart

    function onCreated(callback) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');
      var data = {
        series: [5, 3, 4]
      };
      var options =  {
        width: 100,
        height: 100,
        chartPadding: 10,
        labelInterpolationFnc: function(value) {
          return Math.round(value / data.series.reduce(sum) * 100) + '%';
        }
      };

      var sum = function(a, b) { return a + b; };

      var chart = new Chartist.Pie('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('should render three slices', function(done) {
      onCreated(function() {
        expect($('.ct-slice-pie').length).toBe(3);
        done();
      });
    });

    it('should set value attribute', function(done) {
      onCreated(function() {
        var slices = $('.ct-slice-pie');
        expect(slices.eq(2).attr('ct:value')).toBe('5');
        expect(slices.eq(1).attr('ct:value')).toBe('3');
        expect(slices.eq(0).attr('ct:value')).toBe('4');
        done();
      });
    });

    it('should create slice path', function(done) {
      onCreated(function() {
        $('.ct-slice-pie').each(function() {

          var num = '\\d+(\\.\\d*)?';
          var pattern =
            '^M' + num + ',' + num +
            'A40,40,0,0,0,' + num + ',' + num +
            'L50,50Z$';
          var path = $(this).attr('d');
          expect(path).toMatch(pattern);
        });
        done();
      });
    });

    it('should add labels', function(done) {
      onCreated(function() {
        var labels = $('.ct-label');
        expect(labels.eq(0).text()).toBe('42%');
        expect(labels.eq(1).text()).toBe('25%');
        expect(labels.eq(2).text()).toBe('33%');
        done();
      });

    });
  });



  describe('Gauge Chart', function() {
    // https://gionkunz.github.io/chartist-js/examples.html#gauge-chart

    function onCreated(callback) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');
      var data = {
        series: [20, 10, 30, 40]
      };
      var options =  {
        chartPadding:50,
        height:500,
        width:500,
        donut: true,
        donutWidth: 60,
        startAngle: 270,
        total: 200,
        showLabel: false
      };
      var chart = new Chartist.Pie('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('should render four strokes', function(done) {
      onCreated(function() {
        expect($('.ct-slice-donut').length).toBe(4);
        done();
      });
    });

    it('should set value attribute', function(done) {
      onCreated(function() {
        var slices = $('.ct-slice-donut');
        expect(slices.eq(3).attr('ct:value')).toBe('20');
        expect(slices.eq(2).attr('ct:value')).toBe('10');
        expect(slices.eq(1).attr('ct:value')).toBe('30');
        expect(slices.eq(0).attr('ct:value')).toBe('40');
        done();
      });
    });

    it('should create slice path', function(done) {
      onCreated(function() {
        $('.ct-slice-donut').each(function() {

          var num = '\\d+(\\.\\d*)?';
          var pattern =
            '^M' + num + ',' + num +
            'A170,170,0,0,0,' + num + ',' + num +
            '$';
          var path = $(this).attr('d');
          expect(path).toMatch(pattern);
        });
        done();
      });
    });

    it('should set stroke-width', function(done) {
     onCreated(function() {
        $('.ct-slice-donut').each(function() {
          var style = $(this).attr('style');
          expect(style).toMatch('stroke-width:\\s?60px');
        });
        done();
      });
    });

    it('should not add labels', function(done) {
      onCreated(function() {
        var labels = $('.ct-label');
        expect(labels.length).toBe(0);
        done();
      });

    });

  });

  describe('Pie Chart with relative donutWidth', function() {

    function onCreated(callback) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');
      var data = {
        series: [20, 10, 30, 40]
      };
      var options =  {
        chartPadding:50,
        height:500,
        width:500,
        donut: true,
        donutWidth: '25%',
        showLabel: false
      };
      var chart = new Chartist.Pie('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('should render four strokes', function(done) {
      onCreated(function() {
        expect($('.ct-slice-donut').length).toBe(4);
        done();
      });
    });

    it('should create slice path', function(done) {
      onCreated(function() {
        $('.ct-slice-donut').each(function() {

          var num = '\\d+(\\.\\d*)?';
          var pattern =
            '^M' + num + ',' + num +
            'A175,175,0,0,0,' + num + ',' + num +
            '$';
          var path = $(this).attr('d');
          expect(path).toMatch(pattern);
        });
        done();
      });
    });

    it('should set stroke-width', function(done) {
     onCreated(function() {
        $('.ct-slice-donut').each(function() {
          var style = $(this).attr('style');
          expect(style).toMatch('stroke-width:\\s?50px');
        });
        done();
      });
    });
  });

});
