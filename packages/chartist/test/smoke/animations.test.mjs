/**
 * Update animation smoke test: charts drawn with the live renderer and SMIL
 * update animations, from the browser builds, in Chromium, Firefox and
 * WebKit. Each case pauses the SVG timeline, updates the chart and samples
 * what is drawn with setCurrentTime(): positions halfway, an update during
 * an animation, a sliding line, pie frames on their arc, an easing that
 * overshoots, a path that can't be interpolated, plugin keyframes, and no
 * animation on resize or with reduced motion.
 *
 * Run: pnpm nx run chartist:test:smoke (builds first).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const pkgDir = fileURLToPath(new URL('../..', import.meta.url));
const ORIGIN = 'http://chartist.test';

const page = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="/dist/index.css">
<style>
  .case { width: 400px; height: 200px; --ct-update-duration: 1s; --ct-update-easing: linear; }
  #overshoot { --ct-update-easing: cubic-bezier(0.34, 1.56, 0.64, 1); }
</style>
</head><body>
<div class="case" id="chart"></div>
<script type="module">
  import * as Chartist from '/dist/index.min.js';
  import * as Live from '/dist/live.min.js';
  window.Chartist = Chartist;
  window.Live = Live;
  document.body.dataset.ready = '';
</script>
</body></html>`;

/** Waits for two frames, so a paused SMIL timeline shows its new time. */
const FRAME = `() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`;

let browsers;

before(async () => {
  const engines = { chromium, firefox, webkit };
  const launched = await Promise.allSettled(
    Object.values(engines).map(engine => engine.launch())
  );
  const failed = launched.find(result => result.status === 'rejected');
  if (failed) {
    // An open browser would keep the test process from ever ending.
    await Promise.all(
      launched
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value.close())
    );
    throw failed.reason;
  }
  browsers = Object.fromEntries(
    Object.keys(engines).map((name, i) => [name, launched[i].value])
  );
});

after(async () => {
  await Promise.all(
    Object.values(browsers ?? {}).map(browser => browser.close())
  );
});

/** Opens the page in a browser, with the builds served from dist. */
async function open(
  name,
  { reducedMotion = 'no-preference', id = 'chart' } = {}
) {
  const tab = await browsers[name].newPage();
  await tab.emulateMedia({ reducedMotion });
  await tab.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) {
      return route.abort();
    }
    if (url.pathname === '/') {
      return route.fulfill({
        body: page.replace('id="chart"', `id="${id}"`),
        contentType: 'text/html'
      });
    }
    const file = path.join(pkgDir, url.pathname);
    if (!file.startsWith(path.join(pkgDir, 'dist') + path.sep)) {
      return route.fulfill({ status: 404 });
    }
    try {
      return route.fulfill({
        body: await readFile(file),
        contentType: file.endsWith('.css') ? 'text/css' : 'text/javascript'
      });
    } catch {
      return route.fulfill({ status: 404 });
    }
  });
  const errors = [];
  tab.on('pageerror', error => errors.push(error.message));
  await tab.goto(`${ORIGIN}/`);
  await tab.waitForSelector('body[data-ready]', { state: 'attached' });
  return { tab, errors };
}

/**
 * Runs `body` in the page with `el` (the container), `Chartist`, `Live`,
 * `frame()` and `at(time)` (sets the paused timeline of the chart's svg and
 * waits for a frame), and returns its result.
 */
function run(tab, body) {
  return tab.evaluate(
    new Function(`return (async () => {
      const el = document.querySelector('.case');
      const { Chartist, Live } = window;
      const frame = ${FRAME};
      const svg = () => el.querySelector('svg');
      const at = async time => { svg().setCurrentTime(time); await frame(); };
      ${body}
    })();`)
  );
}

const BROWSERS = ['chromium', 'firefox', 'webkit'];

for (const name of BROWSERS) {
  test(`${name}: bars move from their old end to their new one`, async () => {
    const { tab, errors } = await open(name);
    const result = await run(
      tab,
      `
      const renderer = Live.liveDomRenderer({ animations: Live.smilAnimations() });
      const chart = Chartist.barChart(el, { series: [[2, 4]] }, { renderer, low: 0, high: 8 });
      const bar = () => el.querySelectorAll('.ct-bar')[0];
      const before = bar().y2.baseVal.value;
      svg().pauseAnimations();
      await at(0);
      chart.update({ data: { series: [[6, 4]] } });
      const after = bar().y2.baseVal.value;
      await at(0.5);
      const halfway = bar().y2.animVal.value;
      await at(3);
      return { before, after, halfway, end: bar().y2.animVal.value, final: bar().y2.baseVal.value };
    `
    );
    assert.deepEqual(errors, []);
    assert.ok(
      Math.abs(result.halfway - (result.before + result.after) / 2) < 1,
      JSON.stringify(result)
    );
    assert.ok(
      Math.abs(result.end - result.final) < 0.01,
      JSON.stringify(result)
    );
    await tab.close();
  });

  test(`${name}: an update during an animation continues without a jump`, async () => {
    const { tab, errors } = await open(name);
    const result = await run(
      tab,
      `
      // In real time: WebKit starts an animation begun on a paused timeline at 0.
      const renderer = Live.liveDomRenderer({ animations: Live.smilAnimations() });
      const chart = Chartist.barChart(el, { series: [[2]] }, { renderer, low: 0, high: 10 });
      const bar = () => el.querySelector('.ct-bar');
      const start = bar().y2.baseVal.value;
      chart.update({ data: { series: [[8]] } });
      const target = bar().y2.baseVal.value;
      await new Promise(r => setTimeout(r, 500));
      await frame();
      const drawn = bar().y2.animVal.value;
      chart.update({ data: { series: [[0]] } });
      await frame();
      const continued = bar().y2.animVal.value;
      await new Promise(r => setTimeout(r, 1600));
      await frame();
      return { start, target, drawn, continued, end: bar().y2.animVal.value, final: bar().y2.baseVal.value };
    `
    );
    assert.deepEqual(errors, []);
    const distance = Math.abs(result.target - result.start);
    // Moving, and continued from where it was drawn, within a few frames.
    assert.ok(
      Math.abs(result.drawn - result.start) > distance * 0.2,
      JSON.stringify(result)
    );
    assert.ok(
      Math.abs(result.continued - result.drawn) < distance * 0.1,
      JSON.stringify(result)
    );
    assert.ok(
      Math.abs(result.end - result.final) < 0.01,
      JSON.stringify(result)
    );
    await tab.close();
  });

  test(`${name}: a sliding line moves left with its points`, async () => {
    const { tab, errors } = await open(name);
    const result = await run(
      tab,
      `
      const renderer = Live.liveDomRenderer({ key: 'label', animations: Live.smilAnimations() });
      const chart = Chartist.lineChart(el, { labels: ['Mo', 'Tu', 'We', 'Th', 'Fr'], series: [[1, 5, 3, 8, 4]] }, { renderer, low: 0, high: 10, lineSmooth: false });
      const points = () => [...el.querySelectorAll('.ct-point')];
      const tuBefore = points()[1].x1.baseVal.value;
      const start = () => el.querySelector('.ct-line').getPointAtLength(0).x;
      svg().pauseAnimations();
      await at(0);
      chart.update({ data: { labels: ['Tu', 'We', 'Th', 'Fr', 'Sa'], series: [[5, 3, 8, 4, 6]] } });
      const tuAfter = points()[0].x1.baseVal.value;
      await at(0.5);
      return { tuBefore, tuAfter, pointHalfway: points()[0].x1.animVal.value, lineStart: start() };
    `
    );
    assert.deepEqual(errors, []);
    const middle = (result.tuBefore + result.tuAfter) / 2;
    assert.ok(
      Math.abs(result.pointHalfway - middle) < 1,
      JSON.stringify(result)
    );
    // The path starts at Tu, which moves left with its point.
    assert.ok(Math.abs(result.lineStart - middle) < 1, JSON.stringify(result));
    await tab.close();
  });

  test(`${name}: pie slices stay on their arc`, async () => {
    const { tab, errors } = await open(name);
    const result = await run(
      tab,
      `
      const renderer = Live.liveDomRenderer({ animations: Live.smilAnimations() });
      const chart = Chartist.pieChart(el, { series: [10, 90] }, { renderer, donut: true, donutWidth: 20, showLabel: false });
      svg().pauseAnimations();
      await at(0);
      chart.update({ data: { series: [60, 40] } });
      const slice = el.querySelector('.ct-slice-donut');
      const box = svg().getBoundingClientRect();
      // 1 s has 20 keyframes, at k/19 s; between them SMIL moves linearly.
      const sample = async times => {
        const points = [];
        for (const time of times) {
          await at(time);
          const length = slice.getTotalLength();
          for (let i = 0; i <= 20; i++) {
            const { x, y } = slice.getPointAtLength((length * i) / 20);
            points.push({ x, y });
          }
        }
        return points;
      };
      const distances = await sample([5 / 19, 10 / 19, 14 / 19]);
      const between = await sample([0.25, 0.5, 0.75]);
      return { distances, between, width: box.width, height: box.height };
    `
    );
    assert.deepEqual(errors, []);
    const cx = result.width / 2;
    const cy = result.height / 2;
    const spread = points => {
      const radii = points.map(({ x, y }) => Math.hypot(x - cx, y - cy));
      return Math.max(...radii) - Math.min(...radii);
    };
    // Every keyframe is an arc; between keyframes a slice drifts a little.
    assert.ok(
      spread(result.distances) < 0.5,
      `keyframes off the arc by ${spread(result.distances)}`
    );
    assert.ok(
      spread(result.between) < 2,
      `off the arc between keyframes by ${spread(result.between)}`
    );
    await tab.close();
  });

  test(`${name}: an easing that overshoots passes its target and settles`, async () => {
    const { tab, errors } = await open(name, { id: 'overshoot' });
    const result = await run(
      tab,
      `
      const renderer = Live.liveDomRenderer({ animations: Live.smilAnimations() });
      const chart = Chartist.barChart(el, { series: [[2]] }, { renderer, low: 0, high: 10 });
      const bar = () => el.querySelector('.ct-bar');
      svg().pauseAnimations();
      await at(0);
      chart.update({ data: { series: [[6]] } });
      const target = bar().y2.baseVal.value;
      const drawn = [];
      for (let time = 0; time <= 1; time += 0.05) {
        await at(time);
        drawn.push(bar().y2.animVal.value);
      }
      await at(2);
      return { target, highest: Math.min(...drawn), end: bar().y2.animVal.value };
    `
    );
    assert.deepEqual(errors, []);
    // Bars grow upwards: past the target means a smaller y2.
    assert.ok(result.highest < result.target - 1, JSON.stringify(result));
    assert.ok(
      Math.abs(result.end - result.target) < 0.01,
      JSON.stringify(result)
    );
    await tab.close();
  });

  test(`${name}: a path that can't be interpolated is never drawn empty`, async () => {
    const { tab, errors } = await open(name);
    const result = await run(
      tab,
      `
      const { node, chart: create } = Chartist;
      // A layer that draws its series as one straight path, without keyframes.
      const polyline = {
        type: 'polyline',
        coordinates: ['cartesian'],
        compose: ({ data, area }) => [
          node('path', {
            d: data.series[0].values.map((value, i) => (i ? 'L' : 'M') + (area.x1 + i * 40) + ',' + (area.y1 - value * 10)).join('')
          }, 'ct-polyline')
        ]
      };
      const renderer = Live.liveDomRenderer({ animations: Live.smilAnimations() });
      const chart = create(el, { data: { series: [[1, 2, 3]] }, layers: [polyline], renderer });
      svg().pauseAnimations();
      await at(0);
      chart.update({ data: { series: [[1, 2, 3, 4]] } });
      const lengths = [];
      for (const time of [0.1, 0.5, 0.9]) {
        await at(time);
        lengths.push(el.querySelector('.ct-polyline').getTotalLength());
      }
      return { lengths, animations: el.querySelectorAll('.ct-polyline animate').length };
    `
    );
    assert.deepEqual(errors, []);
    assert.equal(result.animations, 0);
    assert.ok(
      result.lengths.every(length => length > 100),
      JSON.stringify(result)
    );
    await tab.close();
  });

  test(`${name}: plugin keyframes win`, async () => {
    const { tab, errors } = await open(name);
    const result = await run(
      tab,
      `
      const plugin = {
        name: 'flat',
        install: () => undefined,
        keyframes: (previous, next, progress) =>
          next.role === 'line' ? progress.map(p => ({ d: p < 1 ? 'M0,0L10,0' : next.attrs.d })) : undefined
      };
      const renderer = Live.liveDomRenderer({ animations: Live.smilAnimations() });
      const chart = Chartist.lineChart(el, { series: [[1, 5, 3]] }, { renderer, plugins: [plugin] });
      svg().pauseAnimations();
      await at(0);
      chart.update({ data: { series: [[3, 1, 5]] } });
      await at(0.5);
      return el.querySelector('.ct-line').getTotalLength();
    `
    );
    assert.deepEqual(errors, []);
    assert.ok(Math.abs(result - 10) < 0.5, String(result));
    await tab.close();
  });

  test(`${name}: Svg#animate runs back easings and CSS easings`, async () => {
    const { tab, errors } = await open(name);
    const result = await run(
      tab,
      `
      el.innerHTML = '<svg width="200" height="100"><line x1="0" y1="0" x2="10" y2="0" /><line x1="0" y1="0" x2="10" y2="0" /></svg>';
      const [back, css] = el.querySelectorAll('line');
      svg().pauseAnimations();
      new Chartist.Svg(back).animate({ x1: { dur: 1000, from: 0, to: 100, easing: 'easeOutBack' } }, false);
      new Chartist.Svg(css).animate({ x1: { dur: 1000, from: 0, to: 100, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' } }, false);
      let backMax = 0;
      let cssMax = 0;
      for (let time = 0; time <= 1; time += 0.05) {
        await at(time);
        backMax = Math.max(backMax, back.x1.animVal.value);
        cssMax = Math.max(cssMax, css.x1.animVal.value);
      }
      return { backMax, cssMax };
    `
    );
    assert.deepEqual(errors, []);
    assert.ok(result.backMax > 100, JSON.stringify(result));
    assert.ok(result.cssMax > 100, JSON.stringify(result));
    await tab.close();
  });

  test(`${name}: no animation on resize or with reduced motion`, async () => {
    const resized = await open(name);
    const onResize = await run(
      resized.tab,
      `
      const renderer = Live.liveDomRenderer({ animations: Live.smilAnimations() });
      Chartist.barChart(el, { series: [[2, 4]] }, { renderer });
      el.style.width = '300px';
      await new Promise(r => setTimeout(r, 200));
      return el.querySelectorAll('.ct-update-animation').length;
    `
    );
    assert.equal(onResize, 0);
    await resized.tab.close();

    const reduced = await open(name, { reducedMotion: 'reduce' });
    const withReducedMotion = await run(
      reduced.tab,
      `
      const renderer = Live.liveDomRenderer({ animations: Live.smilAnimations() });
      const chart = Chartist.barChart(el, { series: [[2, 4]] }, { renderer });
      chart.update({ data: { series: [[4, 2]] } });
      return el.querySelectorAll('.ct-update-animation').length;
    `
    );
    assert.equal(withReducedMotion, 0);
    assert.deepEqual([...resized.errors, ...reduced.errors], []);
    await reduced.tab.close();
  });

  test(`${name}: a stream of updates leaves no ended animations behind`, async () => {
    const { tab, errors } = await open(name);
    const result = await run(
      tab,
      `
      el.style.setProperty('--ct-update-duration', '150ms');
      const renderer = Live.liveDomRenderer({ key: 'label', animations: Live.smilAnimations() });
      let labels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const values = () => labels.map(label => Math.sin(label));
      const chart = Chartist.lineChart(el, { labels, series: [values()] }, { renderer });
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 100));
        labels = [...labels.slice(1), labels.at(-1) + 1];
        chart.update({ data: { labels, series: [values()] } });
      }
      await new Promise(r => setTimeout(r, 500));
      return el.querySelectorAll('.ct-update-animation').length;
    `
    );
    assert.deepEqual(errors, []);
    assert.equal(result, 0);
    await tab.close();
  });
}
