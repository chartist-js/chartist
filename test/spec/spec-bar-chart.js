describe('Bar chart tests', function() {
  'use strict';

  beforeEach(function() {

  });

  afterEach(function() {

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
      chart = new Chartist.Bar('.ct-chart', data, options);
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
        expect($('g.ct-grids line.ct-grid.ct-vertical').length).toBe(6);        
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

  describe('Empty data tests', function () {
    it('should render empty grid with no data', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Bar('.ct-chart');

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
      var chart = new Chartist.Bar('.ct-chart', data);

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
      var chart = new Chartist.Bar('.ct-chart', data);

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

      var chart = new Chartist.Bar('.ct-chart', null, {
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

      var chart = new Chartist.Bar('.ct-chart', null, {
        reverseData: true
      });

      chart.on('created', function () {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });

    it('should render empty grid with no data and stackBars option', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Bar('.ct-chart', null, {
        stackBars: true
      });

      chart.on('created', function () {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });

    it('should render empty grid with no data and horizontalBars option', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Bar('.ct-chart', null, {
        horizontalBars: true
      });

      chart.on('created', function () {
        // Find at least one vertical grid line
        // TODO: In theory the axis should be created with ct-horizontal class
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });

    it('should render empty grid with no data and distributeSeries option', function (done) {
      jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

      var chart = new Chartist.Bar('.ct-chart', null, {
        distributeSeries: true
      });

      chart.on('created', function () {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });
  });
});
