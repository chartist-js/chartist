/*globals Chartist, jQuery*/

var $ = jQuery;

describe('Chartist core tests', function() {
  'use strict';

  beforeEach(function () {
    jasmine.addMatchers({
      toThrowNamed: function () {
        return {
          compare: function(actual, expected) {
            var result = { pass: true };
            try {
              actual();

              result.pass = false;
              result.message = 'Expected "' + expected + '" to occure but exception was throughn';
            } catch (e) {
              if (!(e.name) || e.name !== expected) {
                result.pass = false;
                result.message = 'Expected "' + expected + '" exception but got "' + e.name + '"';
              }
            }

            return result;
          }
        };
      }
    });
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
});
