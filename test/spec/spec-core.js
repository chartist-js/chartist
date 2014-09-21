/*globals Chartist, jQuery, chartistJasmineMatchers*/

var $ = jQuery;

describe('Chartist core tests', function() {
  'use strict';

  beforeEach(function () {
    jasmine.addMatchers(chartistJasmineMatchers);
  });

  describe('alphaNumerate', function () {
      
    it('should exist in global namespace', function () {
      expect(window.Chartist.alphaNumerate).toBeDefined();
    });
    
    it('should generate a different character for a given number from 0 to 26', function () {
      var charMap = {};
      for (var i = 0; i < 26; i++) {
        var character = window.Chartist.alphaNumerate(i);
        expect(character).toBeDefined();
        expect(charMap[character]).not.toBeDefined();
        charMap[character] = i;
      }
    });

    it('should not through and exception in case of a given number outside of the expected range', function () {
      expect(window.Chartist.alphaNumerate(100)).toBeDefined();
    });
  });

  describe('extend()', function () {
    it('should recursively extend the given objects', function  () {
      var result = Chartist.extend({
          one: 'one',
          two: {
            twentyThree: 'twenty three',
            twentyFour: 'twenty four'
          }
        }, {
          one: 1,
          two: {
            twentyTwo: 22,
            twentyThree: 23
          }
        });
      expect(result.one).toEqual(1);
      expect(result.two.twentyTwo).toEqual(22);
    });

    it('should create the target if a falsy one is given', function () {
      var result = Chartist.extend(null, {one: '1'});
      expect(result).toBeDefined();
      expect(result.one).toEqual('1');
    });
  });

  describe('createSvg()', function () {

    it('should throw an exception if no element with the given query can be found', function () {
      expect(function () {
        Chartist.createSvg('.non-existing-element-selector');
      }).toThrowNamed('NodeNotFoundException');
    });

    it('should try to create an svg object for the given node', function () {
      var el = $('<div id="create-svg-test" />').appendTo('body')[0];
      Chartist.createSvg(el);
      expect(el._ctChart).toBeDefined();
    });

    it('should mutate the given svg object if it exists', function () {
      var el = $('<div id="create-svg-test-2" />').appendTo('body')[0];
      var svg1 = Chartist.createSvg(el);
      var svg2 = Chartist.createSvg(el, '90%', '80%');
      expect(svg1).toBe(svg2);
    });
  });

  describe('getDataArray()', function () {
    it('should try to get the series.data object if it exists', function () {
      var result = Chartist.getDataArray({
        series: [
          {data: 1},
          {data: 2},
          {data: 3}
        ]
      });
      expect(result).toEqual([1, 2, 3]);
    });

    it('should use the series property it self if no data is defined within it', function () {
      var result = Chartist.getDataArray({
        series: [ 2, 4, 5 ]
      });
      expect(result).toEqual([2, 4, 5]);
    });
  });

  describe('normalizeDataArray()', function () {
    it('should add a zero to any empty slot of the given array', function () {
      expect(Chartist.normalizeDataArray([
        [1],
        [1, 2],
        [1, 2, 3],
        [1, 2, 3, 4],
        [1, 2, 3, 4, 5]
      ], 5)).toEqual([
        [1, 0, 0, 0, 0],
        [1, 2, 0, 0, 0],
        [1, 2, 3, 0, 0],
        [1, 2, 3, 4, 0],
        [1, 2, 3, 4, 5]
      ]);
    });
  });

  describe('orderOfMagnitude()', function () {
    it('should return order of magnitute of the given value', function () {
      expect(Chartist.orderOfMagnitude(0.0004)).toEqual(-4);
      expect(Chartist.orderOfMagnitude(0.003)).toEqual(-3);
      expect(Chartist.orderOfMagnitude(0.02)).toEqual(-2);
      expect(Chartist.orderOfMagnitude(0.1)).toEqual(-1);
      expect(Chartist.orderOfMagnitude(1234)).toEqual(3);
      expect(Chartist.orderOfMagnitude(12345)).toEqual(4);
      expect(Chartist.orderOfMagnitude(123456)).toEqual(5);
    });
  });

  describe('getHighLow()', function () {
    it('should return an object with the highest and lowest value of the given data', function () {
      expect(Chartist.getHighLow([
        [-20, 3, 5],
        [-30, 200, 3]
      ])).toEqual({
        high: 200,
        low: -30
      });
    });
  });

  describe('polarToCartesian()', function () {
    it('should return an object with x and y coordinates on circumference', function () {
      expect(Chartist.polarToCartesian(1, 1, 2, 90)).toEqual({
        x: 3,
        y: 1
      });
    });
  });
});
