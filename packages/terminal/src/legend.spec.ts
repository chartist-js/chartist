import { legend } from './legend.ts';

const named = {
  series: [
    { name: 'Visitors', data: [1, 2] },
    { name: 'Sign-ups', data: [2, 1] }
  ]
};

describe('legend', () => {
  it('lists named series with a marker', () => {
    expect(legend(named, { color: 'none' })).toBe('■ Visitors  ■ Sign-ups');
  });

  it('colors the markers by series', () => {
    expect(legend(named)).toBe(
      '\x1b[38;2;215;2;6m■\x1b[0m Visitors  \x1b[38;2;240;91;79m■\x1b[0m Sign-ups'
    );
    expect(legend(named, { color: '256' })).toMatch(/^.\[38;5;\d+m■/);
  });

  it('leaves out unnamed series, keeping the colors of the others', () => {
    const data = { series: [[1, 2], { name: 'Second', data: [3] }] };
    expect(legend(data, { palette: ['#000000', '#ffffff'] })).toBe(
      '\x1b[38;2;255;255;255m■\x1b[0m Second'
    );
    expect(legend({ series: [[1], [2]] })).toBe('');
  });

  it('names pie slices by their labels', () => {
    expect(
      legend({ labels: ['A', 'B'], series: [3, 2] }, { color: 'none' })
    ).toBe('■ A  ■ B');
  });

  it('wraps entries that do not fit the columns', () => {
    expect(legend(named, { color: 'none', columns: 15 })).toBe(
      '■ Visitors\n■ Sign-ups'
    );
  });

  it('renders HTML with series classes', () => {
    expect(
      legend({ series: [{ name: '<b>', data: [1] }] }, { format: 'html' })
    ).toBe(
      '<pre class="ct-terminal ct-legend"><span class="ct-series-a">■</span> &lt;b&gt;</pre>'
    );
  });
});
