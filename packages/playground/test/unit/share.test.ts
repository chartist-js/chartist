import { describe, expect, test } from 'vitest';
import { decodeShare, encodeShare } from '../../src/share.ts';

const files = {
  'index.html': '<!doctype html>\n<div id="chart"></div>\n',
  'src/main.ts':
    "import { lineChart } from 'chartist';\n\nlineChart('#chart', { series: [[1, 2, 3]] });\n"
};

describe('share format', () => {
  test('round trip keeps files and title', async () => {
    const payload = await encodeShare({ files, title: 'My chart' });
    expect(await decodeShare(payload)).toEqual({ files, title: 'My chart' });
  });

  test('is versioned and URL-safe', async () => {
    const payload = await encodeShare({ files });
    expect(payload.startsWith('1.')).toBe(true);
    expect(payload).toMatch(/^1\.[A-Za-z0-9_-]+$/);
  });

  test('keeps non-ASCII text', async () => {
    const text = {
      'src/main.ts': "// Grüezi, 日本語, emoji 📈\nconst s = 'é';\n"
    };
    expect(
      (await decodeShare(await encodeShare({ files: text }))).files
    ).toEqual(text);
  });

  test('compresses a typical example well below the source size', async () => {
    const big = {
      ...files,
      'src/style.css': '#chart { --ct-series-a: #0544d3; }\n'.repeat(20)
    };
    const payload = await encodeShare({ files: big });
    expect(payload.length).toBeLessThan(JSON.stringify(big).length / 2);
  });

  test('rejects an unknown version', async () => {
    await expect(decodeShare('2.abc')).rejects.toThrow(/unknown version/);
  });

  test('rejects damaged input', async () => {
    const payload = await encodeShare({ files });
    await expect(decodeShare(payload.slice(0, 12))).rejects.toThrow(
      /incomplete or damaged/
    );
    await expect(decodeShare('1.!!!')).rejects.toThrow(/incomplete or damaged/);
  });

  test('rejects payloads without files', async () => {
    const payload = await encodeShare({ files: {} as never, title: 'x' });
    // An empty object is still files; a non-string content is not.
    expect((await decodeShare(payload)).files).toEqual({});
    const bad = await encodeShare({ files: { a: 1 } as never });
    await expect(decodeShare(bad)).rejects.toThrow(/no files/);
  });
});
