/**
 * Share cards: which pages have one, what it
 * says, and where it lives. A card's path follows its page's path:
 * `docs/line-charts/` has `og/docs/line-charts.png`, the landing page
 * `og/index.png`. The cards are listed from the same sources as the pages
 * (the docs collection, the API pages, the package pages, the examples
 * gallery), so a new page
 * gets its card without extra work. Rendering: lib/og-card.ts.
 */
import { PACKAGES } from '../data/packages';
import { navPages } from './docs';
import { TYPES, gallery } from './gallery';
import { pluginSlug, sortedPlugins } from './plugins';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

export interface Card {
  /** The page's path without slashes around it; `index` for the landing. */
  key: string;
  /** The eyebrow: the section, and the group within it. */
  eyebrow: string[];
  title: string;
  description: string;
  /** The mascot's pose: presenting the board, pointing, or lost (404). */
  pose: 'hero' | 'point' | 'lost';
}

/** The card's site path (no base) for a page's pathname, base included. */
export function cardPath(pathname: string, base: string): string {
  const prefix = base.replace(/\/?$/, '/');
  const path = pathname.startsWith(prefix)
    ? pathname.slice(prefix.length)
    : pathname.replace(/^\//, '');
  const key = path.replace(/(\/|\/index\.html|\.html)$/, '');
  return `og/${key || 'index'}.png`;
}

/** Every page's card. */
export async function cards(): Promise<Card[]> {
  const typeTitle = (type: string) =>
    TYPES.find(entry => entry.type === type)?.title;
  return [
    {
      key: 'index',
      eyebrow: ['Open source', 'since 2014'],
      title: 'Simple charts, dressed in CSS.',
      description:
        'Clean, responsive SVG charts that leave the styling to you. Tiny, typed, and happy without a build step.',
      pose: 'hero'
    },
    ...[...(await navPages('docs')), ...(await navPages('api'))].map(
      (page): Card => ({
        key: page.path.replace(/\/$/, ''),
        eyebrow:
          page.section === 'docs'
            ? ['Docs', page.group]
            : page.group === '1.x'
              ? ['API', '1.x']
              : ['API'],
        title: page.title,
        description: page.description,
        pose: 'point'
      })
    ),
    {
      key: 'packages',
      eyebrow: ['Packages'],
      title: 'More than SVG',
      description:
        "Packages by Chartist's author that take your charts further: layers and renderers, open source, under @chartist-js.",
      pose: 'hero'
    },
    ...(await Promise.all(PACKAGES.map(pkg => navPages('packages', pkg.slug))))
      .flat()
      .map((page): Card => ({
        key: page.path.replace(/\/$/, ''),
        eyebrow: ['Packages', page.pkg ?? ''].filter(Boolean),
        title: page.title,
        description: page.description,
        pose: 'point'
      })),
    {
      key: 'examples',
      eyebrow: ['Examples'],
      title: `${gallery.length} charts to take apart`,
      description:
        'Lines, bars, pies, composed charts and styling. Each one a small project to edit in place or open in the playground.',
      pose: 'hero'
    },
    ...gallery.map((example): Card => ({
      key: `examples/${example.id}`,
      eyebrow: ['Examples', typeTitle(example.type) ?? ''].filter(Boolean),
      title: example.title,
      description:
        example.description ??
        `${example.title}, a Chartist example to edit and take with you.`,
      pose: 'hero'
    })),
    {
      key: 'plugins',
      eyebrow: ['Plugins'],
      title: 'Small add-ons, big tricks',
      description:
        'Community plugins for Chartist: legends, zoom, thresholds and more, each running live on v2.',
      pose: 'point'
    },
    ...sortedPlugins().map((plugin): Card => ({
      key: `plugins/${pluginSlug(plugin)}`,
      eyebrow: ['Plugins'],
      title: plugin.title,
      description: plugin.description,
      pose: 'point'
    })),
    {
      key: 'playground',
      eyebrow: ['Playground'],
      title: 'Write a chart, watch it draw',
      description:
        'Write a Chartist chart in your browser, see it update as you type, and share it with a link.',
      pose: 'point'
    },
    {
      key: 'credits',
      eyebrow: ['Credits'],
      title: 'Hats off.',
      description:
        'The people behind Chartist: its creator, the maintainers and the top contributors, and its sponsor, Cube.',
      pose: 'hero'
    },
    {
      key: '404',
      eyebrow: ['404'],
      title: 'This chart fell off the easel.',
      description: "The page you're looking for doesn't exist, or it moved.",
      pose: 'lost'
    }
  ];
}
