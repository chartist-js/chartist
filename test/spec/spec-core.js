/*globals Chartist*/

describe('Chartist core tests', function() {
  'use strict';

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

  describe('extend', function () {
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
  });
});
