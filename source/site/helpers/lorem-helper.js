/**
 * Lorem Handlebars Helpers
 * Copyright (c) 2014 Gion Kunz
 * Licensed under the WTFPL License (WTFPL).
 */
'use strict';

var seed = require('seed-random');

// Export helpers
module.exports.register = function (Handlebars, opt, params)  {
  var loremText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit Nullam in pharetra nisl Mauris dictum fermentum malesuada Donec tincidunt, lectus nec tempor eleifend, sem enim rhoncus nibh, nec ultricies ante lectus sit amet mi Proin cursus dolor in nisl varius elementum Aliquam blandit lobortis adipiscing Proin euismod est non feugiat venenatis Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam ac neque consectetur, ullamcorper neque quis, commodo ligula In ornare tempus feugiat Suspendisse ut pretium dui, at egestas velit Etiam ultricies, nisl quis gravida condimentum, dui nisl congue ligula, porta consectetur est sapien viverra est Donec quis ipsum quis metus luctus porttitor sed id justo Proin ultricies adipiscing dolor, luctus interdum urna ullamcorper sit amet Phasellus mollis erat egestas urna tincidunt viverra Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas Nam est ante, blandit vitae porta sed, consectetur vitae libero Sed sit amet auctor diam, eu ullamcorper nulla Aenean interdum, augue nec ullamcorper aliquam, libero justo pellentesque libero, vitae venenatis velit justo pellentesque enim Nam lobortis tortor non sagittis mollis Integer commodo eget nulla vel tincidunt Cras vitae vestibulum ipsum, a sollicitudin erat Cras feugiat vehicula magna, nec vehicula massa lacinia in Nam cursus arcu cursus felis feugiat, vel tincidunt eros aliquet Sed magna est, tincidunt a porta id, aliquam eu orci Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus Donec nec tempus eros Mauris placerat, nisi sit amet varius venenatis, arcu felis cursus risus, ut ultricies tortor lorem nec massa Integer molestie mattis tortor, nec pretium augue accumsan at Mauris nisi risus, hendrerit in libero a, accumsan tincidunt nunc Ut id volutpat massa Duis mattis tellus ut massa ultricies volutpat Curabitur non ante vel odio tempor condimentum Duis eu sollicitudin risus Pellentesque eget metus';
  var loremWords = loremText.split(' ');
  var random = seed(loremText);

  function initCap(str) {
    return str.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
      return m.toUpperCase();
    });
  }

  function randomInt(min, max) {
    min = min || (min === 0 ? 0 : -Math.pow(2, 53));
    max = max || (max === 0 ? 0 : Math.pow(2, 53));

    return Math.floor(random() * (max - min + 1)) + min;
  }

  function n(c, fnc) {
    for(var i = 0; i < c; i++) fnc(i, c);
  }

  function validifyNumber(number, fallback) {
    // If valid number in string, will be converted
    number = +number;
    // undefined, Object, NaN, null etc is not > 0
    if(number > 0) {
      return number;
    } else {
      return fallback;
    }
  }

  // The helpers to be exported
  var helpers = {

    loremWord: function () {
      return initCap(loremWords[randomInt(0) % loremWords.length].replace(/[,]/g, ''));
    },

    loremWords: function (count) {
      count = validifyNumber(count, 1);

      var words = [];
      n(count, function() {
        words.push(loremWords[randomInt(0, loremWords.length)]);
      });

      return words.join(' ');
    },

    loremSentence: function() {
      return helpers.loremWords(randomInt(5, 20)).replace(/^[a-z]/, function(m) {
        return m.toUpperCase();
      }) + '.';
    },

    loremSentences: function(count) {
      count = validifyNumber(count, 1);

      var sentences = [];

      n(count, function() {
        sentences.push(helpers.loremSentence());
      });

      return sentences.join(' ');
    },

    loremParagraph: function () {
      return helpers.loremSentences(randomInt(4, 10));
    }
  };

  opt = opt || {};
  for (var helper in helpers) {
    if (helpers.hasOwnProperty(helper)) {
      Handlebars.registerHelper(helper, helpers[helper]);
    }
  }
};
