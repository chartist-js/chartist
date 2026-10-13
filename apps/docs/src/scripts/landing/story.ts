/**
 * The scroll story: the chapter in the middle of the viewport picks the
 * chart on the mascot's board. Each scene's chart is rendered once and
 * re-rendered (drawing in again) when it comes back.
 */
import { barChart, pieChart, type ChartHandle } from 'chartist';
import { mountBoardChart } from '../board-chart';
import { drawIn, renderChart } from '../charts';

const COMPOSED = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu'],
  series: [
    [4, 6, 5, 8],
    [20, 45, 38, 60]
  ] as [number[], number[]]
};

const BOARD_OPTIONS = {
  chartPadding: { top: 8, right: 8, bottom: 0, left: 0 }
};

// On the board the right axis labels need room from the frame.
const BOARD_COMPOSED = { padding: { top: 10, right: 6, bottom: 0, left: 0 } };

const RENDER: Record<string, (element: HTMLElement) => ChartHandle> = {
  line: element => mountBoardChart(element),
  bars: element =>
    barChart(
      element,
      {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        series: [
          [5, 4, 3, 7],
          [3, 2, 9, 5]
        ]
      },
      {
        ...BOARD_OPTIONS,
        seriesBarDistance: 12,
        axisY: { offset: 22, onlyInteger: true },
        axisX: { offset: 18 },
        plugins: [drawIn]
      }
    ),
  donut: element =>
    pieChart(
      element,
      { series: [40, 30, 20, 10] },
      { donut: true, donutWidth: 20, showLabel: false, plugins: [drawIn] }
    ),
  composed: element =>
    renderChart(element, {
      type: 'composed',
      data: COMPOSED,
      options: BOARD_COMPOSED
    }),
  final: element =>
    renderChart(element, {
      type: 'composed',
      data: COMPOSED,
      options: BOARD_COMPOSED
    })
};

export function mountStory() {
  const found = document.querySelector<HTMLElement>('[data-story]');
  if (!found) {
    return;
  }
  const story: HTMLElement = found;
  const stage = story.querySelector<HTMLElement>('.story-stage')!;
  const hero = story.querySelector<HTMLElement>('.stage-hero')!;
  const celebrate = story.querySelector<HTMLElement>('.stage-celebrate')!;
  const chapters = [...story.querySelectorAll<HTMLElement>('[data-chapter]')];
  const dots = [
    ...story.querySelectorAll<HTMLButtonElement>('.dots [data-pick]')
  ];
  const handles = new Map<HTMLElement, ChartHandle>();
  let active = -1;

  const show = (element: HTMLElement) => {
    const handle = handles.get(element);
    if (handle) {
      handle.update({});
    } else {
      handles.set(element, RENDER[element.dataset.stageScene!](element));
    }
  };

  function activate(index: number) {
    if (index === active) {
      return;
    }
    active = index;
    const chapter = chapters[index];
    const final = chapter.dataset.celebrate !== undefined;
    stage.dataset.active = String(index);
    stage.dataset.reaction = chapter.dataset.reaction;
    hero.hidden = final;
    celebrate.hidden = !final;
    const scene = final
      ? celebrate.querySelector<HTMLElement>('[data-stage-scene]')!
      : hero.querySelector<HTMLElement>(
          `[data-stage-scene="${chapter.dataset.scene}"]`
        )!;
    for (const element of story.querySelectorAll<HTMLElement>(
      '[data-stage-scene]'
    )) {
      element.toggleAttribute('data-active', element === scene);
    }
    show(scene);
    story.querySelector('[data-step]')!.textContent =
      `${index + 1} / ${chapters.length}`;
    story.querySelector('[data-caption]')!.textContent =
      chapter.querySelector('h3')!.textContent;
    dots.forEach((dot, i) =>
      i === index
        ? dot.setAttribute('aria-current', 'true')
        : dot.removeAttribute('aria-current')
    );
  }

  for (const button of story.querySelectorAll<HTMLButtonElement>(
    '[data-pick]'
  )) {
    button.addEventListener('click', () =>
      activate(Number(button.dataset.pick))
    );
  }
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activate(chapters.indexOf(entry.target as HTMLElement));
        }
      }
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );
  chapters.forEach(chapter => observer.observe(chapter));
  // The first scene renders when the story comes near.
  const near = new IntersectionObserver(
    entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        near.disconnect();
        if (active < 0) {
          activate(0);
        }
      }
    },
    { rootMargin: '100% 0px' }
  );
  near.observe(story);
}
