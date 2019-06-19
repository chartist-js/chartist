import 'utils/dom-prepare-before-each';
import 'utils/dom-cleanup-after-each';

import Chartist from '../../dist/chartist';

import { appendToDom, cleanupDom } from 'utils/dom';

describe('Pie chart tests', function() {
  'use strict';

  beforeEach(function() {

  });

  afterEach(function() {

  });

  describe('Meta data tests', function() {
    beforeEach(function() {
      appendToDom('<div class="ct-chart ct-golden-section"></div>');
    });

    afterEach(function () {
      cleanupDom();
    });

    it('should render meta data correctly on slice with mixed value array', function (done) {
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
        const slices = document.querySelectorAll('.ct-slice-pie');

        expect(Chartist.deserialize(slices[1].getAttribute('ct:meta'))).toEqual(meta);
        done();
      });
    });
  });

  describe('Simple Pie Chart', function() {
    // https://gionkunz.github.io/chartist-js/examples.html#simple-pie-chart

    var num = '\\d+(\\.\\d*)?';
    var data, options;

    beforeEach(function() {
      appendToDom('<div class="ct-chart ct-golden-section"></div>');

      var sum = function(a, b) { return a + b; };
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
    });

    afterEach(function () {
      cleanupDom();
    });

    function onCreated(callback) {
      var chart = new Chartist.Pie('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('should render three slices', function(done) {
      onCreated(function() {
        const slices = document.querySelectorAll('.ct-slice-pie');

        expect(slices.length).toBe(3);
        done();
      });
    });

    it('should set value attribute', function(done) {
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');

        expect(slices[0].getAttribute('ct:value')).toBe('5');
        expect(slices[1].getAttribute('ct:value')).toBe('3');
        expect(slices[2].getAttribute('ct:value')).toBe('4');
        done();
      });
    });

    it('should create slice path', function(done) {
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');

        [].slice.call(slices).forEach(function(el) {
          var pattern =
            '^M' + num + ',' + num +
            'A40,40,0,0,0,' + num + ',' + num +
            'L50,50Z$';
          var path = el.getAttribute('d');
          expect(path).toMatch(new RegExp(pattern));
        });
        done();
      });
    });

    it('should add labels', function(done) {
      onCreated(function() {
        var labels = document.querySelectorAll('.ct-label');

        expect(labels[0].textContent).toContain('42%');
        expect(labels[1].textContent).toContain('25%');
        expect(labels[2].textContent).toContain('33%');
        done();
      });
    });

    it('should overlap slices', function(done) {
      data = {
        series: [1, 1]
      };
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');
        var slice1 = slices[0];
        var slice2 = slices[1];

        expect(slice1.getAttribute('d')).toMatch(/^M50,90A40,40,0,0,0,50,10L50,50Z/);
        expect(slice2.getAttribute('d')).toMatch(/^M50,10A40,40,0,0,0,50.\d+,90L50,50Z/);
        done();
      });
    });

    it('should set large arc sweep flag', function(done) {
      data = {
        series: [1, 2]
      };
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');
        var slice1 = slices[1];
        
        expect(slice1.getAttribute('d')).toMatch(/^M50,10A40,40,0,1,0/);
        done();
      }, data);
    });

    it('should draw complete circle with gap', function(done) {
      data = {
        series: [1]
      };
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');
        var slice1 = slices[0];
        expect(slice1.getAttribute('d')).toMatch(/^M49.9\d+,10A40,40,0,1,0,50,10L50,50Z/);
        done();
      });
    });

    it('should draw complete circle with startAngle', function(done) {
      data.series = [100];
      options.startAngle = 90;
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');
        var slice1 = slices[0];
        expect(slice1.getAttribute('d')).toMatch(/^M90,49.9\d+A40,40,0,1,0,90,50L50,50Z/);
        done();
      });
    });

    it('should draw complete circle if values are 0', function(done) {
      data = {
        series: [0, 1, 0]
      };
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');
        var slice1 = slices[1];
        expect(slice1.getAttribute('d')).toMatch(/^M49.9\d+,10A40,40,0,1,0,50,10L50,50Z/);
        done();
      });
    });

  });

  describe('Pie with small slices', function() {
    var data, options;

    beforeEach(function() {
      appendToDom('<div class="ct-chart ct-golden-section"></div>');

      data = {
        series: [0.001, 2]
      };
      options =  {
        width: 100,
        height: 100,
        chartPadding: 0
      };
    });

    afterEach(function () {
      cleanupDom();
    });

    function onCreated(callback) {
      var chart = new Chartist.Pie('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('Pie should render correctly with very small slices', function(done) {
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');
        var slice1 = slices[0];
        var slice2 = slices[1];

        expect(slice1.getAttribute('d')).toMatch(/^M50.1\d+,0A50,50,0,0,0,50,0/);
        expect(slice2.getAttribute('d')).toMatch(/^M49.9\d*,0A50,50,0,1,0,50,0/);
        done();
      });
    });

    it('Pie should render correctly with very small slices on startAngle', function(done) {
      options.startAngle = 90;
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');
        var slice1 = slices[0];
        var slice2 = slices[1];

        expect(slice1.getAttribute('d')).toMatch(/^M100,50.1\d*A50,50,0,0,0,100,50/);
        expect(slice2.getAttribute('d')).toMatch(/^M100,49.97\d*A50,50,0,1,0,100,49.98\d*/);
        done();
      });
    });

    it('Donut should render correctly with very small slices', function(done) {
      options.donut = true;
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-donut');
        var slice1 = slices[0];
        var slice2 = slices[1];

        expect(slice1.getAttribute('d')).toMatch(/^M50.\d+,30A20,20,0,0,0,50,30/);
        expect(slice2.getAttribute('d')).toMatch(/^M49.9\d*,30A20,20,0,1,0,50,30/);
        done();
      });
    });

  });

  describe('Pie with some empty values configured to be ignored', function() {
    var data, options;

    beforeEach(function() {
      appendToDom('<div class="ct-chart ct-golden-section"></div>');

      data = {
        series: [1, 2, 0, 4]
      };
      options =  {
        width: 100,
        height: 100,
        ignoreEmptyValues: true
      };
    });

    afterEach(function () {
      cleanupDom();
    });

    function onCreated(callback) {
      var chart = new Chartist.Pie('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('Pie should not render empty slices', function(done) {
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');

        expect(slices.length).toBe(3);

        expect(slices[0].getAttribute('ct:value')).toBe('1');
        expect(slices[1].getAttribute('ct:value')).toBe('2');
        expect(slices[2].getAttribute('ct:value')).toBe('4');
        done();
      });
    });
  });

  describe('Pie with empty values', function() {
    var data;

    beforeEach(function() {
      appendToDom('<div class="ct-chart ct-golden-section"></div>');

      data = {
        series: [0, 0, 0]
      };
    });

    afterEach(function () {
      cleanupDom();
    });

    function onCreated(callback) {
      var chart = new Chartist.Pie('.ct-chart', data, {});
      chart.on('created', callback);
    }

    it('Pie should render without NaN values and points', function(done) {
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');

        expect(slices.length).toBe(3);

        expect(slices[0].getAttribute('ct:value')).toBe('0');
        expect(slices[1].getAttribute('ct:value')).toBe('0');
        expect(slices[2].getAttribute('ct:value')).toBe('0');

        expect(slices[0].getAttribute('d')).toMatchSnapshot();
        expect(slices[1].getAttribute('d')).toMatchSnapshot();
        expect(slices[2].getAttribute('d')).toMatchSnapshot();
        done();
      });
    });
  });

  describe('Pie with some empty values configured not to be ignored', function() {
    var data, options;

    beforeEach(function() {
      appendToDom('<div class="ct-chart ct-golden-section"></div>');

      data = {
        series: [1, 2, 0, 4]
      };
      options =  {
        width: 100,
        height: 100,
        ignoreEmptyValues: false
      };
    });

    afterEach(function () {
      cleanupDom();
    });

    function onCreated(callback) {
      var chart = new Chartist.Pie('.ct-chart', data, options);
      chart.on('created', callback);
    }

    it('Pie should render empty slices', function(done) {
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-pie');

        expect(slices.length).toBe(4);

        expect(slices[0].getAttribute('ct:value')).toBe('1');
        expect(slices[1].getAttribute('ct:value')).toBe('2');
        expect(slices[2].getAttribute('ct:value')).toBe('0');
        expect(slices[3].getAttribute('ct:value')).toBe('4');
        done();
      });
    });
  });

  describe('Gauge Chart', function() {
    // https://gionkunz.github.io/chartist-js/examples.html#gauge-chart
    beforeEach(function() {
      appendToDom('<div class="ct-chart ct-golden-section"></div>');
    });

    afterEach(function () {
      cleanupDom();
    });

    function onCreated(callback) {
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
        expect(document.querySelectorAll('.ct-slice-donut').length).toBe(4);
        done();
      });
    });

    it('should set value attribute', function(done) {
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-donut');

        expect(slices[0].getAttribute('ct:value')).toBe('20');
        expect(slices[1].getAttribute('ct:value')).toBe('10');
        expect(slices[2].getAttribute('ct:value')).toBe('30');
        expect(slices[3].getAttribute('ct:value')).toBe('40');
        done();
      });
    });

    it('should create slice path', function(done) {
      onCreated(function() {
        var slices = document.querySelectorAll('.ct-slice-donut');

        [].slice.call(slices).forEach(function(el) {
          var num = '\\d+(\\.\\d*)?';
          var pattern =
            '^M' + num + ',' + num +
            'A170,170,0,0,0,' + num + ',' + num +
            '$';
          var path = el.getAttribute('d');
          expect(path).toMatch(new RegExp(pattern));
        });
        done();
      });
    });

    it('should set stroke-width', function(done) {
     onCreated(function() {
      var slices = document.querySelectorAll('.ct-slice-donut');

      [].slice.call(slices).forEach(function(el) {
          var style = el.getAttribute('style');
          expect(style).toMatch(new RegExp('stroke-width:\\s?60px'));
        });
        done();
      });
    });

    it('should not add labels', function(done) {
      onCreated(function() {
        var labels = document.querySelectorAll('.ct-label');
        expect(labels.length).toBe(0);
        done();
      });

    });

  });

  describe('Pie Chart with relative donutWidth', function() {
    beforeEach(function() {
      appendToDom('<div class="ct-chart ct-golden-section"></div>');
    });

    afterEach(function () {
      cleanupDom();
    });

    function onCreated(callback) {
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
        expect(document.querySelectorAll('.ct-slice-donut').length).toBe(4);
        done();
      });
    });

    it('should create slice path', function(done) {
      onCreated(function() {
        [].slice.call(document.querySelectorAll('.ct-slice-donut')).forEach(function(el) {

          var num = '\\d+(\\.\\d*)?';
          var pattern =
            '^M' + num + ',' + num +
            'A175,175,0,0,0,' + num + ',' + num +
            '$';
          var path = el.getAttribute('d');
          expect(path).toMatch(new RegExp(pattern));
        });
        done();
      });
    });

    it('should set stroke-width', function(done) {
     onCreated(function() {
        [].slice.call(document.querySelectorAll('.ct-slice-donut')).forEach(function(el) {
          var style = el.getAttribute('style');
          expect(style).toMatch(new RegExp('stroke-width:\\s?50px'));
        });
        done();
      });
    });
  });

});
