import type { EventEmitter } from '../event';
import type { OptionsChangedEvent, ResponsiveOptions } from './types';
import { extend } from '../utils';

export interface OptionsProvider<T = unknown> {
  removeMediaQueryListeners(): void;
  getCurrentOptions(): T;
}

/**
 * Provides options handling functionality with callback for options changes triggered by responsive options and media query matches
 * @param options Options set by user
 * @param responsiveOptions Optional functions to add responsive behavior to chart
 * @param eventEmitter The event emitter that will be used to emit the options changed events
 * @return The consolidated options object from the defaults, base and matching responsive options
 */
export function optionsProvider<T = unknown>(
  options: T,
  responsiveOptions: ResponsiveOptions<T> | undefined,
  eventEmitter: EventEmitter
): OptionsProvider<T> {
  let currentOptions: T;
  const mediaQueryListeners: MediaQueryList[] = [];

  function updateCurrentOptions(mediaEvent?: Event) {
    const previousOptions = currentOptions;
    currentOptions = extend({}, options);

    if (responsiveOptions) {
      responsiveOptions.forEach(responsiveOption => {
        const mql = window.matchMedia(responsiveOption[0]);
        if (mql.matches) {
          currentOptions = extend(currentOptions, responsiveOption[1]);
        }
      });
    }

    if (eventEmitter && mediaEvent) {
      eventEmitter.emit<OptionsChangedEvent<T>>('optionsChanged', {
        previousOptions,
        currentOptions
      });
    }
  }

  function removeMediaQueryListeners() {
    mediaQueryListeners.forEach(mql =>
      mql.removeEventListener('change', updateCurrentOptions)
    );
  }

  if (!window.matchMedia) {
    throw new Error(
      "window.matchMedia not found! Make sure you're using a polyfill."
    );
  } else if (responsiveOptions) {
    responsiveOptions.forEach(responsiveOption => {
      const mql = window.matchMedia(responsiveOption[0]);
      mql.addEventListener('change', updateCurrentOptions);
      mediaQueryListeners.push(mql);
    });
  }
  // Execute initially without an event argument so we get the correct options
  updateCurrentOptions();

  return {
    removeMediaQueryListeners,
    getCurrentOptions() {
      return currentOptions;
    }
  };
}
