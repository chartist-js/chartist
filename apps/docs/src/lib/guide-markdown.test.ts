import { describe, expect, test, vi } from 'vitest';
import { guideMarkdown } from './guide-markdown';

// Astro sets the site from its config; links are made absolute on it.
vi.stubEnv('SITE', 'https://chartist.dev');

const guide = (body: string) =>
  guideMarkdown(
    { body, data: { title: 'A guide', description: 'What it covers.' } },
    'docs/a-guide/'
  );

describe('guide Markdown', () => {
  test('starts with the title and the description', () => {
    expect(guide('Text.')).toMatch(/^# A guide\n\n> What it covers\./);
  });

  test('drops component imports and data exports', () => {
    const markdown = guide(
      [
        "import Callout from '../../components/docs/Callout.astro';",
        '',
        'export const data = {',
        "  labels: ['a']",
        '};',
        '',
        'The text.'
      ].join('\n')
    );
    expect(markdown).not.toMatch(/^import |^export const|labels/m);
    expect(markdown).toContain('The text.');
  });

  test('turns a gallery example into its files', () => {
    const markdown = guide(
      [
        '<LiveExample',
        "  title='Live gauge'",
        "  show='src/style.css'",
        "  gallery='live/gauge'",
        '/>'
      ].join('\n')
    );
    expect(markdown).toContain('**Live gauge**');
    const files = [...markdown.matchAll(/^`([^`]+)`:$/gm)].map(m => m[1]);
    expect(files).toEqual([
      'src/style.css',
      'src/load.ts',
      'src/main.ts',
      'index.html'
    ]);
    expect(markdown).toContain('smilAnimations');
  });

  test('turns a live example into its files, the shown file first', () => {
    const markdown = guide(
      [
        '<LiveExample',
        "  title='A lollipop layer'",
        "  example='custom-layers/lollipop'",
        "  show='src/lollipop.ts'",
        '/>'
      ].join('\n')
    );
    expect(markdown).not.toContain('<LiveExample');
    expect(markdown).toContain('**A lollipop layer**');
    const files = [...markdown.matchAll(/^`([^`]+)`:$/gm)].map(m => m[1]);
    expect(files[0]).toBe('src/lollipop.ts');
    expect(files).toEqual(
      expect.arrayContaining(['src/main.ts', 'src/style.css', 'index.html'])
    );
  });

  test('a callout becomes a blockquote, steps lose their tag', () => {
    const markdown = guide(
      [
        "<Callout kind='warn'>",
        '  **Careful.** It may change.',
        '</Callout>',
        '',
        '<Step n={1}>',
        'Do this.',
        '</Step>'
      ].join('\n')
    );
    expect(markdown).toContain('> **Careful.** It may change.');
    expect(markdown).not.toMatch(/<\/?(Callout|Step)\b/);
    expect(markdown).toContain('Do this.');
  });

  test('leaves code blocks alone and makes links absolute', () => {
    const markdown = guide(
      [
        '```ts',
        "import { lineChart } from 'chartist';",
        '<LiveExample />',
        '```',
        '',
        'See [line charts](../line-charts/).'
      ].join('\n')
    );
    expect(markdown).toContain(
      "```ts\nimport { lineChart } from 'chartist';\n<LiveExample />\n```"
    );
    expect(markdown).toMatch(/\]\(https?:\/\/[^)]+\/docs\/line-charts\/\)/);
  });
});
