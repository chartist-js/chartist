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
  const baseOptions = extend({}, options);
  let currentOptions;
  const mediaQueryListeners = [];

  function updateCurrentOptions(mediaEvent) {
    const previousOptions = currentOptions;
    currentOptions = extend({}, baseOptions);

    if(responsiveOptions) {
      responsiveOptions.forEach((responsiveOption) => {
        const mql = window.matchMedia(responsiveOption[0]);
        if(mql.matches) {
          currentOptions = extend(currentOptions, responsiveOption[1]);
        }
      });
    }

    if(eventEmitter && mediaEvent) {
      eventEmitter.emit('optionsChanged', {
        previousOptions,
        currentOptions
      });
    }
  }

  function removeMediaQueryListeners() {
    mediaQueryListeners.forEach((mql) => mql.removeListener(updateCurrentOptions));
  }

  if(!window.matchMedia) {
    throw new Error('window.matchMedia not found! Make sure you\'re using a polyfill.');
  } else if(responsiveOptions) {
    responsiveOptions.forEach((responsiveOption) => {
      const mql = window.matchMedia(responsiveOption[0]);
      mql.addListener(updateCurrentOptions);
      mediaQueryListeners.push(mql);
    });
  }
  // Execute initially without an event argument so we get the correct options
  updateCurrentOptions();

  return {
    removeMediaQueryListeners,
    getCurrentOptions() {
      return extend({}, currentOptions);
    }
  };
}
