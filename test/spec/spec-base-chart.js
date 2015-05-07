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

  it('should update correctly with data only in same call stack', function(done) {
    jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

    var dataEventsSpy = jasmine.createSpy('dataEventSpy');

    var chart = new Chartist.Line('.ct-chart', {
      labels: [1, 2, 3, 4],
      series: [[0, 1, 2, 3]]
    });

    var updatedData = {
      labels: [1, 2, 3, 4],
      series: [[3, 2, 1, 0]]
    };

    chart.update(updatedData);

    chart.on('data', dataEventsSpy);

    chart.on('created', function() {
      expect(chart.data.series[0]).toEqual([3, 2, 1, 0]);
      // As called in same call stack we should only have one data event (the initial one)
      expect(dataEventsSpy.calls.count()).toBe(1);
      expect(dataEventsSpy.calls.argsFor(0)[0].type).toBe('initial');
      done();
    });
  });

  it('should update correctly with data only in a different call stack', function(done) {
    jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

    var dataEventsSpy = jasmine.createSpy('dataEventSpy');

    var createdCount = 0;

    var initialData = {
      labels: [1, 2, 3, 4],
      series: [[0, 1, 2, 3]]
    };

    var updatedData = {
      labels: [1, 2, 3, 4],
      series: [[3, 2, 1, 0]]
    };

    var chart = new Chartist.Line('.ct-chart', initialData);

    setTimeout(function() {
      chart.update(updatedData);
    });

    chart.on('data', dataEventsSpy);

    // On the second created event we will finish and evaluate the test
    chart.on('created', function() {
      createdCount++;

      if(createdCount === 2) {
        expect(chart.data.series[0]).toEqual([3, 2, 1, 0]);
        // Called from a later call stack in the event loop, there should be two data update counts now
        expect(dataEventsSpy.calls.count()).toBe(2);
        expect(dataEventsSpy.calls.argsFor(0)[0].type).toBe('initial');
        expect(dataEventsSpy.calls.argsFor(0)[0].data).toEqual(initialData);
        expect(dataEventsSpy.calls.argsFor(1)[0].type).toBe('update');
        expect(dataEventsSpy.calls.argsFor(1)[0].data).toEqual(updatedData);
        done();
      }
    });
  });

  it('should update correctly with options only in same call stack', function(done) {
    jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

    var dataEventsSpy = jasmine.createSpy('dataEventSpy');
    var optionsChangedEventsSpy = jasmine.createSpy('optionsChangedEventsSpy');

    var chart = new Chartist.Line('.ct-chart', {
      labels: [1, 2, 3, 4],
      series: [[0, 1, 2, 3]]
    }, {
      showArea: true,
      showPoint: false
    });

    var updatedOptions = {
      showArea: false,
      showPoint: true
    };

    chart.update(null, updatedOptions);

    chart.on('data', dataEventsSpy);
    chart.on('optionsChanged', optionsChangedEventsSpy);

    chart.on('created', function() {
      // Data has not been updated and only initialized, therefore the initial type and only 1 call
      expect(dataEventsSpy.calls.count()).toBe(1);
      expect(dataEventsSpy.calls.argsFor(0)[0].type).toBe('initial');

      // Options changed should not be fired as called in same call stack
      expect(optionsChangedEventsSpy.calls.count()).toBe(0);

      // Updated options should be present as we updated it in same call stack before chart creation
      expect(chart.optionsProvider.getCurrentOptions().showArea).toBe(false);
      expect(chart.optionsProvider.getCurrentOptions().showPoint).toBe(true);
      done();
    });
  });

  it('should update correctly with options only in a different call stack', function(done) {
    jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

    var createdCount = 0;
    var dataEventsSpy = jasmine.createSpy('dataEventSpy');
    var optionsChangedEventsSpy = jasmine.createSpy('optionsChangedEventsSpy');

    var initialData = {
      labels: [1, 2, 3, 4],
      series: [[0, 1, 2, 3]]
    };

    var chart = new Chartist.Line('.ct-chart', initialData, {
      showArea: true,
      showPoint: false
    });

    var updatedOptions = {
      showArea: false,
      showPoint: true
    };

    setTimeout(function() {
      chart.update(null, updatedOptions);
    });

    chart.on('data', dataEventsSpy);
    chart.on('optionsChanged', optionsChangedEventsSpy);

    chart.on('created', function() {
      createdCount++;

      // On the second created event we will finish and evaluate the test
      if(createdCount === 2) {
        // Called from a later call stack in the event loop, there should be two data update counts now
        expect(dataEventsSpy.calls.count()).toBe(1);
        expect(dataEventsSpy.calls.argsFor(0)[0].type).toBe('initial');
        expect(dataEventsSpy.calls.argsFor(0)[0].data).toEqual(initialData);

        // Update should not cause any optionsChanged event
        expect(optionsChangedEventsSpy.calls.count()).toBe(0);

        done();
      }
    });
  });

  it('should update options with override=false correctly', function(done) {
    jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

    var chart = new Chartist.Line('.ct-chart', {
      labels: [1, 2, 3, 4],
      series: [[0, 1, 2, 3]]
    }, {
      showArea: true
    });

    var updatedOptions = {
      showPoint: false
    };

    // With override set to true, the previous option showArea=true should still be available on chart creation
    chart.update(null, updatedOptions);

    chart.on('created', function() {
      // showArea is false in the default settings and as we didn't use current options and override option it should
      // be back to default.
      expect(chart.optionsProvider.getCurrentOptions().showArea).toBe(false);
      expect(chart.optionsProvider.getCurrentOptions().showPoint).toBe(false);
      done();
    });
  });

  it('should update options with override=true correctly', function(done) {
    jasmine.getFixtures().set('<div class="ct-chart ct-golden-section"></div>');

    var chart = new Chartist.Line('.ct-chart', {
      labels: [1, 2, 3, 4],
      series: [[0, 1, 2, 3]]
    }, {
      showArea: true
    });

    var updatedOptions = {
      showPoint: false
    };

    // With override set to true, the previous option showArea=true should still be available on chart creation
    chart.update(null, updatedOptions, true);

    chart.on('created', function() {
      expect(chart.optionsProvider.getCurrentOptions().showArea).toBe(true);
      expect(chart.optionsProvider.getCurrentOptions().showPoint).toBe(false);
      done();
    });
  });
});
