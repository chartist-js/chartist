import {extend} from './extend';

/**
 * Provides options handling functionality with callback for options changes triggered by responsive options and media query matches
 *
 * @memberof Chartist.Core
 * @param {Object} options Options set by user
 * @param {Array} responsiveOptions Optional functions to add responsive behavior to chart
 * @param {Object} eventEmitter The event emitter that will be used to emit the options changed events
 * @return {Object} The consolidated options object from the defaults, base and matching responsive options
 */
export function optionsProvider(options, responsiveOptions, eventEmitter) {
  var baseOptions = extend({}, options),
    currentOptions,
    mediaQueryListeners = [],
    i;

  function updateCurrentOptions(mediaEvent) {
    var previousOptions = currentOptions;
    currentOptions = extend({}, baseOptions);

    if (responsiveOptions) {
      for (i = 0; i < responsiveOptions.length; i++) {
        var mql = window.matchMedia(responsiveOptions[i][0]);
        if (mql.matches) {
          currentOptions = extend(currentOptions, responsiveOptions[i][1]);
        }
      }
    }

    if(eventEmitter && mediaEvent) {
      eventEmitter.emit('optionsChanged', {
        previousOptions: previousOptions,
        currentOptions: currentOptions
      });
    }
  }

  function removeMediaQueryListeners() {
    mediaQueryListeners.forEach(function(mql) {
      mql.removeListener(updateCurrentOptions);
    });
  }

  if (!window.matchMedia) {
    throw 'window.matchMedia not found! Make sure you\'re using a polyfill.';
  } else if (responsiveOptions) {

    for (i = 0; i < responsiveOptions.length; i++) {
      var mql = window.matchMedia(responsiveOptions[i][0]);
      mql.addListener(updateCurrentOptions);
      mediaQueryListeners.push(mql);
    }
  }
  // Execute initially without an event argument so we get the correct options
  updateCurrentOptions();

  return {
    removeMediaQueryListeners: removeMediaQueryListeners,
    getCurrentOptions: function getCurrentOptions() {
      return extend({}, currentOptions);
    }
  };
}
