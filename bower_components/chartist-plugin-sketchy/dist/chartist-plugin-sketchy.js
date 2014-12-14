(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function () {
      return (root.returnExportsGlobal = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Chartist.plugins.ctSketchy'] = factory();
  }
}(this, function () {

  /**
   * Chartist.js plugin to render sketchy charts that look hand drawn using SVG filters.
   *
   */
  /* global Chartist */
  (function(window, document, Chartist) {
    'use strict';

    var defaultOptions = {
      filterPrefix: 'ctSketchyFilter',
      filterType: 'fractalNoise',
      filterBaseFrequency: 0.05,
      filterNumOctaves: 2,
      filterScale: 5,
      overrides: {}
    };

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.ctSketchy = function(options) {

      options = Chartist.extend({}, defaultOptions, options);

      return function ctPointLabels(chart) {

        chart.on('created', function(data) {
          var defs = data.svg.elem('defs'),
            baseFilter = defs.elem('filter', {
              id: options.filterPrefix
            });

          baseFilter.elem('feTurbulence', {
            type: options.filterType,
            baseFrequency: options.filterBaseFrequency,
            numOctaves: options.filterNumOctaves,
            result: [options.filterPrefix, 'Turbulence'].join('')
          });

          baseFilter.elem('feDisplacementMap', {
            xChannelSelector: 'R',
            yChannelSelector: 'G',
            in: 'SourceGraphic',
            in2: [options.filterPrefix, 'Turbulence'].join(''),
            scale: options.filterScale
          });

          Object.keys(options.overrides).forEach(function(overrideKey) {
            var override = options.overrides[overrideKey];

            if(override === false) {
              return;
            }

            var overrideFilter = defs.elem('filter', {
              id: [options.filterPrefix, overrideKey].join('')
            });

            overrideFilter.elem('feTurbulence', {
              type: override.type || options.filterType,
              baseFrequency: override.baseFrequency || options.filterBaseFrequency,
              numOctaves: override.numOctaves || options.filterNumOctaves,
              result: [options.filterPrefix, overrideKey, 'Turbulence'].join('')
            });

            overrideFilter.elem('feDisplacementMap', {
              xChannelSelector: 'R',
              yChannelSelector: 'G',
              in: 'SourceGraphic',
              in2: [options.filterPrefix, overrideKey, 'Turbulence'].join(''),
              scale: override.scale || options.filterScale
            });
          });
        });

        chart.on('draw', function(data) {
          if(options.overrides[data.type] !== false) {
            var filterName = options.overrides[data.type] ? [options.filterPrefix, data.type].join('') : options.filterPrefix,
              filterAttributes = {
                filter: ['url(#', filterName, ')'].join('')
              };

            if(data.type === 'label') {
              data.group.attr(filterAttributes);
            } else {
              data.element.attr(filterAttributes);
            }
          }
        });
      };
    };

  }(window, document, Chartist));

  return Chartist.plugins.ctSketchy;

}));
