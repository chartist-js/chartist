/**
 * Renders a share card (lib/og.ts) to PNG: satori lays it out as SVG, resvg
 * paints it. The look is the landing hero's: the yellow band, the Chartist
 * Guy, Zilla Slab headlines and Atkinson text. The mascot and the logomark
 * are the site's own components, rendered to SVG strings with Astro's
 * container API, so there is one drawing of each.
 */
import { createRequire } from 'node:module';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { root } from 'astro:config/server';
import type { ResvgRenderOptions } from '@resvg/resvg-js';
import zillaSlab700 from '@fontsource/zilla-slab/files/zilla-slab-latin-700-normal.woff?inline';
import atkinson from '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2?inline';
import jetbrainsMono from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?inline';
import tokensCss from '../styles/tokens.css?raw';
import chartThemeCss from '../styles/chart-theme.css?raw';
import mascotCss from '../styles/mascot.css?raw';
import Mascot from '../components/Mascot.astro';
import Logomark from '../components/Logomark.astro';
import { BOARD_DATA, BOARD_HIGH } from '../scripts/board-chart';
import { CARD_HEIGHT, CARD_WIDTH, type Card } from './og';
import { woff2ToSfnt } from './woff2';

// The prerendered endpoint runs from the build's output folder, where these
// packages don't resolve: load them from the project instead.
const require = createRequire(new URL('package.json', root));
const { Resvg } =
  require('@resvg/resvg-js') as typeof import('@resvg/resvg-js');
const satori = (require('satori') as typeof import('satori')).default;

const bytes = (dataUrl: string) =>
  Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

/**
 * The variable fonts ship WOFF2 only: decoded, and without their variation
 * tables (satori's font parser fails on them), they're static fonts at
 * their default instance.
 */
const VARIATIONS = ['fvar', 'gvar', 'avar', 'cvar', 'HVAR', 'MVAR', 'STAT'];
const FONTS = [
  {
    name: 'Zilla Slab',
    data: bytes(zillaSlab700),
    weight: 700,
    style: 'normal'
  },
  {
    name: 'Atkinson',
    data: Buffer.from(woff2ToSfnt(bytes(atkinson), VARIATIONS)),
    weight: 400,
    style: 'normal'
  },
  {
    name: 'JetBrains Mono',
    data: Buffer.from(woff2ToSfnt(bytes(jetbrainsMono), VARIATIONS)),
    weight: 400,
    style: 'normal'
  }
] as const;

/** The light theme's custom properties, from the site's stylesheets. */
const TOKENS = new Map<string, string>();
for (const css of [tokensCss, chartThemeCss]) {
  const light = css.split(/:root\[data-theme='dark'\]/)[0];
  for (const [, name, value] of light.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    TOKENS.set(name, value.trim());
  }
}

/** Replaces var(--x) with its light value, as resvg knows no custom properties. */
function resolveVars(svg: string): string {
  let out = svg;
  for (let depth = 0; depth < 5 && out.includes('var(--'); depth++) {
    out = out.replace(
      /var\(--([\w-]+)\)/g,
      (match, name: string) => TOKENS.get(name) ?? match
    );
  }
  return out;
}

/** The board's own label and grid colors (mascot.css). */
const boardVar = (name: string) =>
  mascotCss.match(new RegExp(`--${name}:\\s*([^;]+);`))![1];

const C = {
  bg: resolveVars('var(--p-mustard-400)'),
  ink: resolveVars('var(--p-ink-800)'),
  ink2: resolveVars('var(--p-ink-700)'),
  paper: resolveVars('var(--p-cream-50)'),
  vest: resolveVars('var(--p-waistcoat-500)')
};

/** The board's line chart in the drawing's units (chart area x 34, y 102, 220 × 152). */
function boardChart(): string {
  // Insets as on the site: chart padding, the y labels' and x labels' room.
  const left = 34 + 30;
  const right = 34 + 220 - 22;
  const top = 102 + 12;
  const bottom = 102 + 152 - 20;
  const x = (index: number) =>
    left + ((right - left) * index) / (BOARD_DATA.labels.length - 1);
  const y = (value: number) => bottom - ((bottom - top) * value) / BOARD_HIGH;
  const steps = Array.from({ length: 7 }, (_, step) => step);
  const grid = steps.map(
    step =>
      `<path d="M${left},${y((BOARD_HIGH / 6) * step)} L${right},${y((BOARD_HIGH / 6) * step)}" />`
  );
  const labels = [
    ...steps.map(
      step =>
        `<text x="${left - 5}" y="${y((BOARD_HIGH / 6) * step) + 3}" text-anchor="end">${step ? `${step}m.` : '0'}</text>`
    ),
    ...BOARD_DATA.labels.map(
      (label, i) =>
        `<text x="${x(i)}" y="${bottom + 13}" text-anchor="middle">${label}</text>`
    )
  ];
  const series = BOARD_DATA.series.map((values, index) => {
    const color = index === 0 ? 'var(--ct-series-a)' : 'var(--ct-series-b)';
    const d = values
      .map((value, i) => `${i ? 'L' : 'M'}${x(i)},${y(value)}`)
      .join(' ');
    const points = values
      .map((value, i) => `M${x(i)},${y(value)} L${x(i) + 0.01},${y(value)}`)
      .join(' ');
    const dash = index === 0 ? ' stroke-dasharray="5"' : '';
    const cap = index === 0 ? 'square' : 'round';
    return (
      `<path d="${d}" stroke="${color}" stroke-width="5" fill="none"${dash} />` +
      `<path d="${points}" stroke="${color}" stroke-width="10" stroke-linecap="${cap}" />`
    );
  });
  return (
    `<g><g stroke="${boardVar('ct-grid-color')}" stroke-width="1" stroke-dasharray="2 4">${grid.join('')}</g>` +
    `<g fill="${boardVar('ct-label-color')}" font-size="9">${labels.join('')}</g>${series.reverse().join('')}</g>`
  );
}

let container: AstroContainer | undefined;

/** A component's SVG, ready for an image: resolved colors, CSS-only parts dropped. */
async function componentSvg(
  component: Parameters<AstroContainer['renderToString']>[0],
  props: Record<string, unknown>
) {
  container ??= await AstroContainer.create();
  const html = await container.renderToString(component, { props });
  let svg = html.match(/<svg[\s\S]*<\/svg>/)![0];
  // mascot.css shows the default mouth only, and no brow.
  svg = svg.replace(
    /<path class="(m-mouth [^"]*|m-brow)"[^>]*>(<\/path>)?/g,
    (path, cls: string) => (cls.includes('m-mouth-default') ? path : '')
  );
  svg = svg.replace(/ (role|aria-label|aria-hidden|style)="[^"]*"/g, '');
  if (!svg.includes('xmlns=')) {
    svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return resolveVars(svg);
}

const dataUri = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const mascots = new Map<
  Card['pose'],
  { svg: string; width: number; height: number }
>();

async function mascot(pose: Card['pose']) {
  if (!mascots.has(pose)) {
    let svg = await componentSvg(Mascot, { pose });
    if (pose === 'hero') {
      svg = svg.replace(/<\/svg>$/, `${resolveVars(boardChart())}</svg>`);
    }
    const [, , w, h] = svg
      .match(/viewBox="([^"]+)"/)![1]
      .split(' ')
      .map(Number);
    mascots.set(pose, { svg, width: w, height: h });
  }
  return mascots.get(pose)!;
}

let logomark: string | undefined;

type Node = { type: string; props: Record<string, unknown> };
const h = (
  type: string,
  style: Record<string, unknown>,
  ...children: (Node | string)[]
): Node => ({
  type,
  props: { style, children }
});

/** Title size by length, so long titles wrap to at most three lines. */
function titleSize(title: string) {
  if (title.length <= 18) {
    return 96;
  }
  if (title.length <= 30) {
    return 80;
  }
  if (title.length <= 48) {
    return 68;
  }
  return 56;
}

export async function renderCard(card: Card): Promise<Buffer> {
  logomark ??= dataUri(await componentSvg(Logomark, { variant: 'paper' }));
  const guy = await mascot(card.pose);
  // The figure stands on the card's bottom edge, on the right.
  const figureHeight = card.pose === 'point' ? 540 : 460;
  const figureWidth = (guy.width / guy.height) * figureHeight;
  const figureRight = card.pose === 'point' ? 80 : 24;
  // The text column (its left padding included) ends where the figure starts;
  // the pointing pose has room on its left, in front of the nose.
  const textWidth =
    CARD_WIDTH - figureRight - figureWidth + (card.pose === 'point' ? 16 : -24);

  const tree = h(
    'div',
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      display: 'flex',
      position: 'relative',
      backgroundColor: C.bg,
      color: C.ink,
      fontFamily: 'Atkinson'
    },
    h(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        width: textWidth,
        padding: '56px 0 56px 72px',
        height: '100%'
      },
      // The wordmark, as in the site header.
      h(
        'div',
        { display: 'flex', alignItems: 'center', gap: 14 },
        h(
          'div',
          {
            display: 'flex',
            backgroundColor: C.paper,
            borderRadius: 12,
            boxShadow: `0 2px 0 ${C.ink}`
          },
          { type: 'img', props: { src: logomark, width: 52, height: 52 } }
        ),
        h(
          'div',
          {
            fontFamily: 'Zilla Slab',
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: '-0.01em'
          },
          'Chartist'
        )
      ),
      h(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flexGrow: 1,
          gap: 22
        },
        h(
          'div',
          {
            display: 'flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 12,
            padding: '6px 16px',
            borderRadius: 999,
            backgroundColor: C.paper,
            border: `2px solid ${C.ink}`,
            boxShadow: `3px 3px 0 ${C.ink}`,
            fontFamily: 'JetBrains Mono',
            fontSize: 22,
            letterSpacing: '0.08em'
          },
          ...card.eyebrow.flatMap((part, index) => {
            // Uppercase as the site's eyebrows, but versions stay as written.
            const text = h(
              'span',
              index ? {} : { color: C.vest },
              /^\d+\.x$/.test(part) ? part : part.toUpperCase()
            );
            return index ? [h('span', { color: C.ink2 }, '·'), text] : [text];
          })
        ),
        h(
          'div',
          {
            fontFamily: 'Zilla Slab',
            fontWeight: 700,
            fontSize: titleSize(card.title),
            lineHeight: 1.02,
            letterSpacing: '-0.015em',
            lineClamp: 3,
            display: 'block'
          },
          card.title
        ),
        h(
          'div',
          {
            fontSize: 29,
            lineHeight: 1.4,
            color: C.ink2,
            lineClamp: 3,
            display: 'block',
            maxWidth: 640
          },
          card.description
        )
      )
    )
  );

  const layout = await satori(tree as never, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: FONTS.map(font => ({ ...font }))
  });
  // The figure goes into the card's SVG as it is, not as an image, so its
  // text (the board's labels, the 404's question mark) gets the fonts.
  const figure = guy.svg.replace(
    '<svg',
    `<svg x="${CARD_WIDTH - figureRight - figureWidth}" y="${CARD_HEIGHT - 14 - figureHeight}" width="${figureWidth}" height="${figureHeight}"`
  );
  const svg = layout.replace(/<\/svg>$/, `${figure}</svg>`);
  // fontBuffers works in resvg-js 2.6 but is missing from its types.
  const font = {
    fontBuffers: [FONTS[1].data],
    defaultFontFamily: 'Atkinson Hyperlegible Next',
    loadSystemFonts: false
  };
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: CARD_WIDTH },
    font: font as ResvgRenderOptions['font']
  })
    .render()
    .asPng();
}
