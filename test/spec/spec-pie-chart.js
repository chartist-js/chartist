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

    var num = '\\d+(\\.\\d*)?';
    var data, options;
    
    beforeEach(function() {
      data = {
        series: [5, 3, 4]
      };
      options = {
        width: 100,
        height: 100,
        chartPadding: 10,
        labelInterpolationFnc: function(value) {
          return Math.round(value / data.series.reduce(sum) * 100) + '%';
        }
      };
      var sum = function(a, b) { return a + b; };
    });
    
    function onCreated(callback) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');
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
    
    it('should overlap slices', function(done) {
      data = {
        series: [1, 1]
      };
      onCreated(function() {
        var slice1 = $('.ct-slice-pie').eq(0);
        var slice2 = $('.ct-slice-pie').eq(1);

        expect(slice1.attr('d')).toMatch(/^M50,10A40,40,0,0,0,50.\d+,90L50,50Z/);
        expect(slice2.attr('d')).toMatch(/^M50,90A40,40,0,0,0,50,10L50,50Z/);
        done();
      });
    });

    it('should set large arc sweep flag', function(done) {
      data = {
        series: [1, 2]
      };
      onCreated(function() {
        var slice1 = $('.ct-slice-pie').eq(0);
        expect(slice1.attr('d')).toMatch(/^M50,10A40,40,0,1,0/);
        done();
      }, data);
    });

    it('should draw complete circle with gap', function(done) {
      data = {
        series: [1]
      };
      onCreated(function() {
        var slice1 = $('.ct-slice-pie').eq(0);
        expect(slice1.attr('d')).toMatch(/^M49.9\d+,10A40,40,0,1,0,50,10L50,50Z/);
        done();
      });
    });
    
    it('should draw complete circle with startAngle', function(done) {
      data.series = [100];
      options.startAngle = 90;
      onCreated(function() {
        var slice1 = $('.ct-slice-pie').eq(0);
        expect(slice1.attr('d')).toMatch(/^M90,49.9\d+A40,40,0,1,0,90,50L50,50Z/);
        done();
      });
    });
    
    it('should draw complete circle if values are 0', function(done) {
      data = {
        series: [0, 1, 0]
      };
      onCreated(function() {
        var slice1 = $('.ct-slice-pie').eq(1);
        expect(slice1.attr('d')).toMatch(/^M49.9\d+,10A40,40,0,1,0,50,10L50,50Z/);
        done();
      });
    });

  });

  describe('Pie with small slices', function() {
    var data, options;

    beforeEach(function() {
      data = {
        series: [0.001, 2]
      };
      options =  {
        width: 100,
        height: 100,
        chartPadding: 0,
      };  
    });

    function onCreated(callback) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');
      var chart = new Chartist.Pie('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('Pie should render correctly with very small slices', function(done) {
      onCreated(function() { 
        var slice1 = $('.ct-slice-pie').eq(0);
        var slice2 = $('.ct-slice-pie').eq(1);

        expect(slice1.attr('d')).toMatch(/^M49.9\d*,0A50,50,0,1,0,50,0/);
        expect(slice2.attr('d')).toMatch(/^M50.1\d+,0A50,50,0,0,0,50,0/);
        done();
      });
    });
    
    it('Pie should render correctly with very small slices on startAngle', function(done) {
      options.startAngle = 90;
      onCreated(function() { 
        var slice1 = $('.ct-slice-pie').eq(0);
        var slice2 = $('.ct-slice-pie').eq(1);

        expect(slice1.attr('d')).toMatch(/^M100,49.97\d*A50,50,0,1,0,100,49.98\d*/);
        expect(slice2.attr('d')).toMatch(/^M100,50.1\d*A50,50,0,0,0,100,50/);
        done();
      });
    });

    it('Donut should render correctly with very small slices', function(done) {
      options.donut = true;
      onCreated(function() { 
        var slice1 = $('.ct-slice-donut').eq(0);
        var slice2 = $('.ct-slice-donut').eq(1);

        expect(slice1.attr('d')).toMatch(/^M49.9\d*,30A20,20,0,1,0,50,30/);
        expect(slice2.attr('d')).toMatch(/^M50.\d+,30A20,20,0,0,0,50,30/);
        done();
      });
    });

  });
  
  describe('Pie with some empty values configured to be ignored', function() {
    var data, options;

    beforeEach(function() {
      data = {
        series: [1, 2, 0, 4]
      };
      options =  {
        width: 100,
        height: 100,
        ignoreEmptyValues: true
      };
    });

    function onCreated(callback) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');
      var chart = new Chartist.Pie('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('Pie should not render empty slices', function(done) {
      onCreated(function() { 
        var slices = $('.ct-slice-pie');
        
        expect(slices.length).toBe(3);
        
        expect(slices.eq(2).attr('ct:value')).toBe('1');
        expect(slices.eq(1).attr('ct:value')).toBe('2');
        expect(slices.eq(0).attr('ct:value')).toBe('4');
        done();
      });
    });
  });
  
  describe('Pie with some empty values configured not to be ignored', function() {
    var data, options;

    beforeEach(function() {
      data = {
        series: [1, 2, 0, 4]
      };
      options =  {
        width: 100,
        height: 100,
        ignoreEmptyValues: false
      };  
    });

    function onCreated(callback) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');
      var chart = new Chartist.Pie('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('Pie should render empty slices', function(done) {
      onCreated(function() { 
        var slices = $('.ct-slice-pie');
        
        expect(slices.length).toBe(4);
        
        expect(slices.eq(3).attr('ct:value')).toBe('1');
        expect(slices.eq(2).attr('ct:value')).toBe('2');
        expect(slices.eq(1).attr('ct:value')).toBe('0');
        expect(slices.eq(0).attr('ct:value')).toBe('4');
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
