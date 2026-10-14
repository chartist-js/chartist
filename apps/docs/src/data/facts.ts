/**
 * The facts snapshot (facts.json, written by `pnpm nx run docs:facts`),
 * validated at build time: a missing or malformed value fails the build.
 */
import { z } from 'astro/zod';
import raw from './facts.json';

const size = z.object({
  minified: z.number().positive(),
  gzip: z.number().positive()
});

const schema = z.object({
  generatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  npm: z.object({ monthlyDownloads: z.number().positive() }),
  github: z.object({
    stars: z.number().positive(),
    contributors: z.number().positive(),
    dependents: z.number().positive()
  }),
  usedBy: z.array(
    z.object({
      owner: z.string(),
      repo: z.string(),
      stars: z.number(),
      evidence: z.string().url(),
      avatar: z.string()
    })
  ),
  credits: z.object({
    roles: z.record(z.string(), z.enum(['core maintainer', 'maintainer'])),
    people: z
      .array(
        z.object({
          login: z.string(),
          name: z.string(),
          url: z.string().url(),
          commits: z.number().int().positive(),
          role: z.enum(['creator', 'core maintainer', 'maintainer']).optional(),
          avatar: z.string().regex(/^[\w.-]+\.png$/)
        })
      )
      .min(1)
      .refine(
        people =>
          people.filter(person => person.role === 'creator').length === 1,
        'the credits need exactly one creator'
      )
  }),
  plugins: z.record(
    z.string(),
    z.object({
      monthlyDownloads: z.number().int().nonnegative(),
      lastRelease: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    })
  ),
  sizes: z.object({
    method: z.string(),
    versions: z.record(z.string(), z.string()),
    bytes: z.object({
      'chartist (lineChart)': size,
      'chartist (core: chart)': size,
      'chart.js': size,
      apexcharts: size,
      highcharts: size
    })
  })
});

export const facts = schema.parse(raw);

/** 500197 → "500k", 13389 → "13.4k", 1234567 → "1.2M". */
export function formatCount(value: number): string {
  if (value >= 1e6) {
    return `${Number((value / 1e6).toFixed(1))}M`;
  }
  if (value >= 1e4) {
    return `${Number((value / 1e3).toFixed(value >= 1e5 ? 0 : 1))}k`;
  }
  return value.toLocaleString('en');
}

/** Bytes as gzipped kilobytes: 11868 → "11.9 kB". */
export const formatKb = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`;

/** "2026-10-13" → "October 13, 2026". */
export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });

export const yearsSince2014 = () => new Date().getUTCFullYear() - 2014;
