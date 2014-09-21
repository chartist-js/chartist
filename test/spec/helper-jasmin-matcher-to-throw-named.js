

var chartistJasmineMatchers = chartistJasmineMatchers || {};

(function (matchers) {
  'use strict';

  matchers.toThrowNamed = function () {
    return {
      compare: function (actual, expected) {
        var result = {
          pass: true
        };
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
  };
})(chartistJasmineMatchers);
