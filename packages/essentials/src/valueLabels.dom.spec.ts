// @vitest-environment jsdom
import { barChart, lineChart } from 'chartist';
import { liveDomRenderer } from 'chartist/live';
import { valueLabels } from './valueLabels.ts';

/** A container with a fixed size (jsdom has no layout). */
function container() {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => 500 },
    clientHeight: { get: () => 300 }
  });
  document.body.appendChild(element);
  return element;
}

const labels = (element: Element) =>
  Array.from(element.querySelectorAll('text.ct-value-label'));

describe('valueLabels in a live chart', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps a changed value’s label element, with its new text and place', () => {
    const element = container();
    const chart = barChart(
      element,
      { labels: ['a', 'b', 'c'], series: [[3, 4, 5]] },
      {
        high: 10,
        layers: { above: [valueLabels()] },
        renderer: liveDomRenderer()
      }
    );
    const before = labels(element)[2];
    const y = before.getAttribute('y');
    chart.update({ data: { labels: ['a', 'b', 'c'], series: [[3, 4, 8]] } });
    const after = labels(element)[2];
    expect(after).toBe(before);
    expect(after.textContent).toBe('8');
    expect(after.getAttribute('y')).not.toBe(y);
  });

  it('follows the labels that stay in a sliding window', () => {
    const element = container();
    const chart = lineChart(
      element,
      { labels: ['Mon', 'Tue', 'Wed'], series: [[1, 2, 3]] },
      {
        layers: { above: [valueLabels()] },
        renderer: liveDomRenderer({ key: 'label' })
      }
    );
    const [mon, tue, wed] = labels(element);
    chart.update({
      data: { labels: ['Tue', 'Wed', 'Thu'], series: [[2, 3, 4]] }
    });
    const now = labels(element);
    expect(now).toHaveLength(3);
    expect(now[0]).toBe(tue);
    expect(now[1]).toBe(wed);
    expect(now).not.toContain(mon);
    expect(now[2].textContent).toBe('4');
  });
});
