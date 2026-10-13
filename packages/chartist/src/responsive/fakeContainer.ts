/**
 * Test helper: a fake `Element.prototype.matchContainer` whose matches the
 * test sets per query, with `change` events like the polyfill.
 */
export interface FakeContainerQueries {
  set(query: string, matches: boolean, notify?: boolean): void;
  /** Elements matchContainer() was called on. */
  readonly callers: Element[];
  uninstall(): void;
}

export function installFakeMatchContainer(
  options: { events?: boolean; reject?: string } = {}
): FakeContainerQueries {
  const state = new Map<string, boolean>();
  const lists = new Map<string, Set<EventTarget & { matches: boolean }>>();
  const callers: Element[] = [];
  const proto = Element.prototype as unknown as {
    matchContainer?: (query: string) => unknown;
  };
  proto.matchContainer = function (this: Element, query: string) {
    if (query === options.reject) {
      throw new SyntaxError('unsupported feature');
    }
    callers.push(this);
    const list = Object.defineProperty(new EventTarget(), 'matches', {
      get: () => state.get(query) ?? false
    }) as EventTarget & { matches: boolean };
    if (options.events === false) {
      return {
        get matches() {
          return state.get(query) ?? false;
        }
      };
    }
    const set = lists.get(query) ?? new Set();
    set.add(list as never);
    lists.set(query, set);
    return list;
  };
  return {
    callers,
    set(query, matches, notify = true) {
      state.set(query, matches);
      if (notify) {
        lists
          .get(query)
          ?.forEach(list => list.dispatchEvent(new Event('change')));
      }
    },
    uninstall() {
      delete proto.matchContainer;
    }
  };
}
