describe('Chartist core', function() {
  'use strict';

  beforeEach(function() {

  });

  afterEach(function() {

  });

  describe('createSvg tests', function () {
    it('should not remove non-chartist svg elements', function() {
      jasmine.getFixtures().set('<div id="chart-container"><svg id="foo"></svg><div><svg id="bar"></svg></div></div>');

      var container = $('#chart-container'),
        // We use get(0) because we want the DOMElement, not the jQuery object.
        svg = Chartist.createSvg(container.get(0), '500px', '400px', 'ct-fish-bar');

      expect(svg).toBeDefined();
      expect(svg.classes()).toContain('ct-fish-bar');
      expect(container).toContainElement('#foo');
      expect(container).toContainElement('#bar');
    });

    it('should remove previous chartist svg elements', function() {
      jasmine.getFixtures().set('<div id="chart-container"></div>');

      var container = $('#chart-container'),
        // We use get(0) because we want the DOMElement, not the jQuery object.
        svg1 = Chartist.createSvg(container.get(0), '500px', '400px', 'ct-fish-bar'),
        svg2 = Chartist.createSvg(container.get(0), '800px', '200px', 'ct-snake-bar');

      expect(svg1).toBeDefined();
      expect(svg1.classes()).toContain('ct-fish-bar');
      expect(svg2).toBeDefined();
      expect(svg2.classes()).toContain('ct-snake-bar');
      expect(container).not.toContainElement('.ct-fish-bar');
      expect(container).toContainElement('.ct-snake-bar');
    });
  });

  describe('serialization tests', function () {
    it('should serialize and deserialize regular strings', function() {
      var input = 'String test';
      expect(input).toMatch(Chartist.deserialize(Chartist.serialize(input)));
    });

    it('should serialize and deserialize strings with critical characters', function() {
      var input = 'String test with critical characters " < > \' & &amp;';
      expect(input).toMatch(Chartist.deserialize(Chartist.serialize(input)));
    });

    it('should serialize and deserialize numbers', function() {
      var input = 12345.6789;
      expect(input).toEqual(Chartist.deserialize(Chartist.serialize(input)));
    });

    it('should serialize and deserialize dates', function() {
      var input = new Date(0);
      expect(+input).toEqual(+new Date(Chartist.deserialize(Chartist.serialize(input))));
    });

    it('should serialize and deserialize complex object types', function() {
      var input = {
        a: {
          b: 100,
          c: 'String test',
          d: 'String test with critical characters " < > \' & &amp;',
          e: {
            f: 'String test'
          }
        }
      };

      expect(input).toEqual(Chartist.deserialize(Chartist.serialize(input)));
    });

    it('should serialize and deserialize null, undefined and NaN', function() {
      expect(null).toEqual(Chartist.deserialize(Chartist.serialize(null)));
      expect(undefined).toEqual(Chartist.deserialize(Chartist.serialize(undefined)));
      expect(NaN).toMatch(Chartist.deserialize(Chartist.serialize('NaN')));
    });
  });

  describe('data normalization tests', function () {

    it('normalize mixed series types correctly', function() {
      var data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          {data: [1, 0, 3, 4, 5, 6]},
          [1, {value: 0}, 3, {value: 4}, 5, 6, 7, 8],
          {data: [1, 0, {value: 3}]}
        ]
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [
          [1, 0, 3, 4, 5, 6],
          [1, 0, 3, 4, 5, 6, 7, 8],
          [1, 0, 3]
        ]
      );
    });

    it('normalize mixed series for pie chart correctly', function() {
      var data = {
        series: [1, {value: 0}, 3, {value: 4}, 5, 6, 7, 8]
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [1, 0, 3, 4, 5, 6, 7, 8]
      );
    });

    it('normalize mixed series with string values for pie chart correctly', function() {
      var data = {
        series: ['1', {value: '0'}, '3', {value: '4'}, '5', '6', '7', '8']
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [1, 0, 3, 4, 5, 6, 7, 8]
      );
    });

    it('normalize mixed series types with string values correctly', function() {
      var data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          {data: ['1', '0', '3', '4', '5', '6']},
          ['1', {value: '0'}, '3', {value: '4'}, '5', '6', '7', '8'],
          {data: ['1', '0', {value: '3'}]}
        ]
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [
          [1, 0, 3, 4, 5, 6],
          [1, 0, 3, 4, 5, 6, 7, 8],
          [1, 0, 3]
        ]
      );
    });

    it('normalize mixed series types with weird values correctly', function() {
      var data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          {data: [null, NaN, undefined, '4', '5', '6']},
          ['1', {value: null}, '3', {value: NaN}, '5', '6', '7', '8'],
          {data: ['1', '0', {value: undefined}]}
        ]
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [
          [undefined, undefined, undefined, 4, 5, 6],
          [1, undefined, 3, undefined, 5, 6, 7, 8],
          [1, 0, undefined]
        ]
      );
    });

    it('should normalize correctly with 0 values in data series array objects', function() {
      var data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        series: [{
          data: [
            { value: 1 },
            { value: 4 },
            { value: 2 },
            { value: 7 },
            { value: 2 },
            { value: 0 }
          ]
        }]
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [[1, 4, 2, 7, 2, 0]]
      );
    });

    it('should normalize correctly with mixed dimensional input into multi dimensional output', function() {
      var data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        series: [{
          data: [
            { value: 1 },
            { value: {y: 4, x: 1}},
            { y: 2, x: 2},
            NaN,
            null,
            { value: 7 },
            { value: 2 },
            { value: null },
            { y: undefined, x: NaN }
          ]
        }]
      };

      expect(Chartist.getDataArray(data, false, true)).toEqual(
        [[
          {x: undefined, y: 1},
          {x: 1, y: 4},
          {x: 2, y: 2},
          undefined,
          undefined,
          {x: undefined, y: 7},
          {x: undefined, y: 2},
          undefined,
          {x: undefined, y: undefined}
        ]]
      );
    });
  });

  describe('padding normalization tests', function () {
    it('should normalize number padding', function() {
      expect(Chartist.normalizePadding(10)).toEqual({
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      });
    });

    it('should normalize number padding when 0 is passed', function() {
      expect(Chartist.normalizePadding(0)).toEqual({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      });
    });

    it('should normalize empty padding object with default fallback', function() {
      expect(Chartist.normalizePadding({})).toEqual({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      });
    });

    it('should normalize empty padding object with specified fallback', function() {
      expect(Chartist.normalizePadding({}, 10)).toEqual({
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      });
    });

    it('should normalize partial padding object with specified fallback', function() {
      expect(Chartist.normalizePadding({
        top: 5,
        left: 5
      }, 10)).toEqual({
        top: 5,
        right: 10,
        bottom: 10,
        left: 5
      });
    });

    it('should not modify complete padding object', function() {
      expect(Chartist.normalizePadding({
        top: 5,
        right: 5,
        bottom: 5,
        left: 5
      }, 10)).toEqual({
        top: 5,
        right: 5,
        bottom: 5,
        left: 5
      });
    });
  });
  
  describe('quantity', function() {
    
    it('should return value for numbers', function() {
      expect(Chartist.quantity(100)).toEqual({ value: 100 });
      expect(Chartist.quantity(0)).toEqual({ value: 0 });
      expect(Chartist.quantity(NaN)).toEqual({ value: NaN });
      expect(Chartist.quantity(null)).toEqual({ value: null });
      expect(Chartist.quantity(undefined)).toEqual({ value: undefined });
    });
    
    it('should return value without unit from string', function() {
      expect(Chartist.quantity('100')).toEqual({ value: 100, unit : undefined });
      expect(Chartist.quantity('0')).toEqual({ value: 0, unit : undefined });
    });
    
    it('should return value and unit from string', function() {
      expect(Chartist.quantity('100%')).toEqual({ value: 100, unit :'%' });
      expect(Chartist.quantity('100 %')).toEqual({ value: 100, unit :'%' });
      expect(Chartist.quantity('0px')).toEqual({ value: 0, unit: 'px' });
    });
    
  });
});
