import { createPhaseEmitter } from './emitter';

describe('pipeline/emitter', () => {
  it('chains return values in registration order', () => {
    const emitter = createPhaseEmitter();
    const seen: number[] = [];
    emitter.on('prepare', (value: number) => {
      seen.push(value);
      return value + 1;
    });
    emitter.on('prepare', (value: number) => {
      seen.push(value);
    });
    emitter.on('prepare', (value: number) => value * 10);
    expect(emitter.transform('prepare', 1)).toBe(20);
    expect(seen).toEqual([1, 2]);
  });

  it('keeps the identical value when listeners return nothing', () => {
    const emitter = createPhaseEmitter();
    const payload = { data: [1] };
    emitter.on('prepare', () => undefined);
    expect(emitter.transform('prepare', payload)).toBe(payload);
  });

  it('null drops the value and stops the chain', () => {
    const emitter = createPhaseEmitter();
    const later = vi.fn();
    emitter.on('compose', () => null);
    emitter.on('compose', later);
    expect(emitter.transform('compose', { name: 'line' })).toBeNull();
    expect(later).not.toHaveBeenCalled();
  });

  it('off removes one listener or all listeners of a phase', () => {
    const emitter = createPhaseEmitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on('layout', a);
    emitter.on('layout', b);
    emitter.off('layout', a);
    emitter.notify('layout', 1);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
    emitter.off('layout');
    emitter.notify('layout', 2);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('"*" listeners observe the final value of every phase', () => {
    const emitter = createPhaseEmitter();
    const all = vi.fn();
    emitter.on('*', all);
    emitter.on('prepare', () => 'changed');
    emitter.transform('prepare', 'original');
    emitter.notify('mount', 'output');
    expect(all.mock.calls).toEqual([
      ['prepare', 'changed'],
      ['mount', 'output']
    ]);
    emitter.off('*', all);
    emitter.notify('mount', 'again');
    expect(all).toHaveBeenCalledTimes(2);
  });

  it('notify ignores return values', () => {
    const emitter = createPhaseEmitter();
    const second = vi.fn();
    emitter.on('render', () => 'ignored');
    emitter.on('render', second);
    emitter.notify('render', 'output');
    expect(second).toHaveBeenCalledWith('output');
  });

  it('a listener removed during emit does not affect the running chain', () => {
    const emitter = createPhaseEmitter();
    const second = vi.fn();
    const first = () => emitter.off('scene', second);
    emitter.on('scene', first);
    emitter.on('scene', second);
    emitter.transform('scene', 1);
    expect(second).toHaveBeenCalledTimes(1);
    emitter.transform('scene', 1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('clear removes all listeners', () => {
    const emitter = createPhaseEmitter();
    const a = vi.fn();
    const all = vi.fn();
    emitter.on('layout', a);
    emitter.on('*', all);
    emitter.clear();
    emitter.notify('layout', 1);
    expect(a).not.toHaveBeenCalled();
    expect(all).not.toHaveBeenCalled();
  });
});
