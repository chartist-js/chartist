import { accessibleName, defaultParts, fillText, textOf } from './content.ts';
import type { TooltipItem } from './types.ts';

const numbers = new Intl.NumberFormat('en-US');
const element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
const item = (fields: Partial<TooltipItem>): TooltipItem =>
  ({
    role: 'point',
    seriesIndex: 0,
    valueIndex: 1,
    meta: undefined,
    series: [],
    context: {},
    element,
    ...fields
  }) as TooltipItem;

describe('default text', () => {
  it('shows the label, the series name and the value', () => {
    expect(
      defaultParts(
        item({
          label: 'Tue',
          seriesName: 'Visitors',
          value: { x: 1, y: 1500 }
        }),
        numbers
      ).map(part => part.text)
    ).toEqual(['Tue', 'Visitors', '1, 1,500']);
    expect(
      defaultParts(
        item({ label: 'Tue', seriesName: 'Visitors', value: 1500 }),
        numbers
      )
    ).toEqual([
      { className: 'ct-tooltip-title', text: 'Tue' },
      { className: 'ct-tooltip-series', text: 'Visitors' },
      { className: 'ct-tooltip-value', text: '1,500' }
    ]);
  });

  it('takes a string or number meta as the title, not an object', () => {
    expect(
      defaultParts(item({ meta: 'Owls', label: 'Q1', value: 9 }), numbers)[0]
        .text
    ).toBe('Owls');
    expect(defaultParts(item({ meta: 7, value: 9 }), numbers)[0].text).toBe(
      '7'
    );
    expect(
      defaultParts(item({ meta: { a: 1 }, label: 'Q1', value: 9 }), numbers)[0]
        .text
    ).toBe('Q1');
  });

  it('leaves out empty and repeated parts', () => {
    expect(
      defaultParts(
        item({ label: 'Apples', seriesName: 'Apples', value: 3 }),
        numbers
      ).map(part => part.text)
    ).toEqual(['Apples', '3']);
    expect(defaultParts(item({ value: undefined }), numbers)).toEqual([]);
  });

  it('formats values with numberFormat', () => {
    const francs = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CHF'
    });
    expect(
      defaultParts(item({ value: 1250 }), francs)[0].text.replace(/\s/g, ' ')
    ).toBe('CHF 1,250.00');
  });
});

describe('format', () => {
  it('gives the text, keeps the default text, or no tooltip', () => {
    const format = (value: TooltipItem) =>
      value.role === 'bar'
        ? undefined
        : Number(value.value) < 10
          ? null
          : `${value.label}: ${String(value.value)} visitors`;
    expect(
      textOf(item({ label: 'Mon', value: 12 }), { format }, numbers)
    ).toEqual({
      text: 'Mon: 12 visitors',
      custom: true
    });
    expect(textOf(item({ value: 3 }), { format }, numbers)).toBeUndefined();
    expect(
      textOf(item({ value: 3 }), { format: () => '' }, numbers)
    ).toBeUndefined();
    expect(
      textOf(item({ role: 'bar', label: 'Q1', value: 3 }), { format }, numbers)
    ).toEqual({ text: 'Q1, 3', custom: false });
  });

  it('reads line breaks as pauses in the accessible name', () => {
    expect(accessibleName('Mon\n12 visitors')).toBe('Mon, 12 visitors');
  });
});

describe('text only', () => {
  it('shows markup in meta and from format as text', () => {
    const content = document.createElement('div');
    const meta = '<img src=x onerror=alert(1)>';
    fillText(
      content,
      item({ meta, value: 1 }),
      { text: '', custom: false },
      numbers
    );
    expect(content.querySelector('img')).toBeNull();
    expect(content.textContent).toContain(meta);
    fillText(content, item({}), { text: '<b>5</b>', custom: true }, numbers);
    expect(content.querySelector('b')).toBeNull();
    expect(content.textContent).toBe('<b>5</b>');
  });
});
