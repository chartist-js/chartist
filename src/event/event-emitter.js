export class EventEmitter {
  constructor() {
    this.handlers = [];
  }

  /**
   * Add an event handler for a specific event
   *
   * @memberof Chartist.Event
   * @param {String} event The event name
   * @param {Function} handler A event handler function
   */
  addEventHandler(event, handler) {
    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].push(handler);
  }

  /**
   * Remove an event handler of a specific event name or remove all event handlers for a specific event.
   *
   * @memberof Chartist.Event
   * @param {String} event The event name where a specific or all handlers should be removed
   * @param {Function} [handler] An optional event handler function. If specified only this specific handler will be removed and otherwise all handlers are removed.
   */
  removeEventHandler(event, handler) {
    // Only do something if there are event handlers with this name existing
    if(this.handlers[event]) {
      // If handler is set we will look for a specific handler and only remove this
      if(handler) {
        this.handlers[event].splice(this.handlers[event].indexOf(handler), 1);
        if(this.handlers[event].length === 0) {
          delete this.handlers[event];
        }
      } else {
        // If no handler is specified we remove all handlers for this event
        delete this.handlers[event];
      }
    }
  }

  /**
   * Use this function to emit an event. All handlers that are listening for this event will be triggered with the data parameter.
   *
   * @memberof Chartist.Event
   * @param {String} event The event name that should be triggered
   * @param {*} data Arbitrary data that will be passed to the event handler callback functions
   */
  emit(event, data) {
    // Only do something if there are event handlers with this name existing
    if(this.handlers[event]) {
      this.handlers[event].forEach((handler) => handler(data));
    }

    // Emit event to star event handlers
    if(this.handlers['*']) {
      this.handlers['*'].forEach((starHandler) => starHandler(event, data));
    }
  }
}
