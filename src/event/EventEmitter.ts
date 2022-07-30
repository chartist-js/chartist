/* eslint-disable @typescript-eslint/no-explicit-any */
export type EventListener<T = any> = (data: T) => void;

export type AllEventsListener<T = any> = (event: string, data: T) => void;

export class EventEmitter {
  private readonly listeners = new Map<string, Set<EventListener>>();
  private readonly allListeners = new Set<AllEventsListener>();

  /**
   * Add an event handler for a specific event
   * @param event The event name
   * @param listener A event handler function
   */
  on(event: '*', listener: AllEventsListener): void;
  on(event: string, listener: EventListener): void;
  on(event: string, listener: EventListener | AllEventsListener) {
    const { allListeners, listeners } = this;

    if (event === '*') {
      allListeners.add(listener);
    } else {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }

      (listeners.get(event) as Set<EventListener>).add(
        listener as EventListener
      );
    }
  }

  /**
   * Remove an event handler of a specific event name or remove all event handlers for a specific event.
   * @param event The event name where a specific or all handlers should be removed
   * @param [listener] An optional event handler function. If specified only this specific handler will be removed and otherwise all handlers are removed.
   */
  off(event: '*', listener?: AllEventsListener): void;
  off(event: string, listener?: EventListener): void;
  off(event: string, listener?: EventListener | AllEventsListener) {
    const { allListeners, listeners } = this;

    if (event === '*') {
      if (listener) {
        allListeners.delete(listener);
      } else {
        allListeners.clear();
      }
    } else if (listeners.has(event)) {
      const eventListeners = listeners.get(event) as Set<EventListener>;

      if (listener) {
        eventListeners.delete(listener as EventListener);
      } else {
        eventListeners.clear();
      }

      if (!eventListeners.size) {
        listeners.delete(event);
      }
    }
  }

  /**
   * Use this function to emit an event. All handlers that are listening for this event will be triggered with the data parameter.
   * @param event The event name that should be triggered
   * @param data Arbitrary data that will be passed to the event handler callback functions
   */
  emit<T = any>(event: string, data: T) {
    const { allListeners, listeners } = this;

    // Only do something if there are event handlers with this name existing
    if (listeners.has(event)) {
      (listeners.get(event) as Set<EventListener>).forEach(listener =>
        listener(data)
      );
    }

    // Emit event to star event handlers
    allListeners.forEach(listener => listener(event, data));
  }
}
