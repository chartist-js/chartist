import {
  applyResponsive,
  container,
  resetResponsiveWarning,
  watchResponsive
} from './responsive';
import { installFakeMatchContainer } from './fakeContainer';

const merge = <T>(a: T, b: Partial<T>) => ({ ...a, ...b });

describe('responsive', () => {
  let fake: ReturnType<typeof installFakeMatchContainer>;
  beforeEach(() => {
    fake = installFakeMatchContainer();
  });
  afterEach(() => fake.uninstall());

  it('merges matching media and container entries in order', () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) =>
      ({ matches: query === '(min-width: 1px)' }) as MediaQueryList;
    try {
      const host = document.createElement('div');
      const entries = [
        ['(min-width: 1px)', { area: true, points: true }],
        [container('(width < 400px)'), { area: false }],
        ['(max-width: 1px)', { points: false }]
      ] as const;
      fake.set('(width < 400px)', true, false);
      const watcher = watchResponsive(entries, host, () => undefined);
      expect(watcher.matching).toEqual([0, 1]);
      expect(
        applyResponsive(
          { area: true, points: false },
          entries,
          watcher.matching,
          merge
        )
      ).toEqual({
        area: false,
        points: true
      });
      watcher.stop();
    } finally {
      window.matchMedia = original;
    }
  });

  it('reports only changes of the matching set', () => {
    const host = document.createElement('div');
    const onChange = vi.fn();
    const watcher = watchResponsive(
      [[container('(width < 400px)'), {}]],
      host,
      onChange
    );
    expect(watcher.check()).toBe(false);
    fake.set('(width < 400px)', true);
    expect(onChange).toHaveBeenCalledTimes(1);
    fake.set('(width < 400px)', true);
    expect(onChange).toHaveBeenCalledTimes(1);
    watcher.stop();
    fake.set('(width < 400px)', false);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('works without change events through check()', () => {
    fake.uninstall();
    fake = installFakeMatchContainer({ events: false });
    const host = document.createElement('div');
    const watcher = watchResponsive(
      [[container('(width < 400px)'), {}]],
      host,
      () => undefined
    );
    fake.set('(width < 400px)', true);
    expect(watcher.matching).toEqual([]);
    expect(watcher.check()).toBe(true);
    expect(watcher.matching).toEqual([0]);
  });

  it('asks from one stable probe in the container, removed by stop()', () => {
    const host = document.createElement('div');
    const watcher = watchResponsive(
      [
        [container('(width < 400px)'), {}],
        [container('(width > 800px)'), {}]
      ],
      host,
      () => undefined
    );
    const probe = host.querySelector('.ct-probe')!;
    expect(probe).not.toBeNull();
    expect(fake.callers).toEqual([probe, probe]);
    watcher.stop();
    expect(host.querySelector('.ct-probe')).toBeNull();
  });

  it('names a rejected condition', () => {
    fake.uninstall();
    fake = installFakeMatchContainer({ reject: '(orientation: portrait)' });
    const host = document.createElement('div');
    expect(() =>
      watchResponsive(
        [[container('(orientation: portrait)'), {}]],
        host,
        () => undefined
      )
    ).toThrow('invalid container condition "(orientation: portrait)"');
    expect(host.querySelector('.ct-probe')).toBeNull();
  });
});

describe('responsive without matchContainer', () => {
  it('warns once per page and ignores container entries', () => {
    resetResponsiveWarning();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const host = document.createElement('div');
      const entries = [[container('(width < 400px)'), {}]] as const;
      expect(watchResponsive(entries, host, () => undefined).matching).toEqual(
        []
      );
      watchResponsive(entries, host, () => undefined);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('matchContainer');
      expect(warn.mock.calls[0][0]).toContain('match-container');
      expect(host.querySelector('.ct-probe')).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it('stays silent without a DOM host', () => {
    resetResponsiveWarning();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(
        watchResponsive(
          [[container('(width < 400px)'), {}]],
          undefined,
          () => undefined
        ).matching
      ).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
