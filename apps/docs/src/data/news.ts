/**
 * The news rows on the home page, newest first: an announcement is a new
 * entry at the top. The page shows the newest few (`latestNews()`); older
 * news lives in the changelog and the GitHub releases.
 */
export interface NewsEntry {
  /** A short tag before the title, e.g. `New`. */
  readonly tag: string;
  readonly title: string;
  /** One sentence. */
  readonly text: string;
  /** Where the row links to: a site path or an absolute URL. */
  readonly href: string;
  readonly linkLabel: string;
}

export const NEWS: readonly NewsEntry[] = [
  {
    tag: 'New',
    title: '@chartist-js/tooltips',
    text: 'Tooltips for mouse, touch and keyboard that stay on their value while the chart updates.',
    href: 'packages/tooltips/',
    linkLabel: 'Meet it'
  },
  {
    tag: 'New',
    title: '@chartist-js/essentials',
    text: 'Axis titles, trend lines, a log axis and more: the additions people ask for most, in a package of their own.',
    href: 'packages/essentials/',
    linkLabel: 'Meet it'
  },
  {
    tag: 'New',
    title: '@chartist-js/terminal',
    text: 'Chartist charts in your terminal and as text art in HTML, with the ct-cli command.',
    href: 'packages/terminal/',
    linkLabel: 'Meet it'
  },
  {
    tag: 'New',
    title: 'Chartist 2.0',
    text: 'Functional API, composed charts, server rendering, and your 1.x charts look exactly the same.',
    href: 'https://github.com/chartist-js/chartist/blob/main/CHANGELOG.md',
    linkLabel: 'Release notes'
  }
];

/** How many news rows the home page shows. */
export const NEWS_ROWS = 3;

/** The newest entries, at most {@link NEWS_ROWS}. */
export const latestNews = (news: readonly NewsEntry[] = NEWS) =>
  news.slice(0, NEWS_ROWS);
