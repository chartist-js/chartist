/**
 * The responsive demos. container() needs Element.matchContainer(), so the
 * match-container polyfill loads with this section.
 */
import { barChart, container, lineChart } from 'chartist';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];
const month = (value: unknown) => String(value).slice(0, 3);
const initial = (value: unknown) => String(value)[0];
const quarter = (value: unknown, index: number) =>
  index % 3 === 0 ? `Q${index / 3 + 1}` : '';

const RULES = [
  { min: 520, label: 'container(width ≥ 520px)' },
  { min: 360, label: 'container(360px ≤ width < 520px)' },
  { min: 0, label: 'container(width < 360px)' }
];

export async function mountResponsiveDemo() {
  await import('match-container');
  const box = document.querySelector<HTMLElement>('[data-resizable]');
  const target = document.querySelector<HTMLElement>('[data-responsive-chart]');
  if (!box || !target) {
    return;
  }
  const range = document.querySelector<HTMLInputElement>('[data-width-range]')!;
  const widthLabel = document.querySelector<HTMLElement>('[data-width]')!;
  const ruleLabel = document.querySelector<HTMLElement>('[data-rule]')!;

  barChart(
    target,
    { labels: MONTHS, series: [[5, 4, 6, 8, 3, 9, 6, 7, 5, 8, 4, 6]] },
    { axisY: { onlyInteger: true, offset: 24 }, seriesBarDistance: 0 },
    [
      [
        container('(width >= 520px)'),
        { axisX: { labelInterpolationFnc: month } }
      ],
      [
        container('(360px <= width < 520px)'),
        { axisX: { labelInterpolationFnc: initial } }
      ],
      [
        container('(width < 360px)'),
        { axisX: { labelInterpolationFnc: quarter } }
      ]
    ]
  );

  const show = (width: number) => {
    widthLabel.textContent = `${Math.round(width)} px`;
    ruleLabel.textContent = RULES.find(rule => width >= rule.min)!.label;
  };
  // Container queries measure the content box, so the label and the range
  // do too; `chrome` is the padding and border around it.
  const style = getComputedStyle(box);
  const content =
    box.clientWidth -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight);
  const chrome = box.offsetWidth - content;
  new ResizeObserver(([entry]) => {
    const width = entry.contentRect.width;
    show(width);
    range.value = String(Math.round(width / 10) * 10);
  }).observe(box);
  range.addEventListener('input', () => {
    box.style.width = `${Number(range.value) + chrome}px`;
  });

  for (const card of document.querySelectorAll<HTMLElement>(
    '[data-cq-chart]'
  )) {
    lineChart(
      card,
      {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        series: [
          [5, 9, 7, 8, 5, 6, 8],
          [3, 4, 6, 3, 4, 2, 5]
        ]
      },
      { fullWidth: true, chartPadding: { right: 20 }, axisY: { offset: 24 } },
      [
        [
          container('(width < 400px)'),
          { showPoint: false, axisX: { labelInterpolationFnc: initial } }
        ]
      ]
    );
  }
}
