/**
 * The home page shows the newest news entries, at most three.
 */
import { describe, expect, test } from 'vitest';
import { NEWS, NEWS_ROWS, latestNews, type NewsEntry } from './news';

const entry = (title: string): NewsEntry => ({
  tag: 'New',
  title,
  text: `${title} is out.`,
  href: 'https://example.com/',
  linkLabel: 'Read more'
});

describe('latestNews', () => {
  test('shows every entry when there are fewer than three', () => {
    expect(latestNews([entry('a'), entry('b')]).map(e => e.title)).toEqual([
      'a',
      'b'
    ]);
  });

  test('shows exactly three', () => {
    const news = [entry('a'), entry('b'), entry('c')];
    expect(latestNews(news)).toEqual(news);
  });

  test('drops the oldest beyond three', () => {
    const news = [entry('d'), entry('c'), entry('b'), entry('a')];
    expect(latestNews(news).map(e => e.title)).toEqual(['d', 'c', 'b']);
  });

  test('the site news fits', () => {
    expect(latestNews()).toEqual(NEWS.slice(0, NEWS_ROWS));
    expect(NEWS.length).toBeGreaterThan(0);
  });
});
