import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Groups of the docs sidebar, in order. */
export const GROUPS = ['Start here', 'Chart types', 'Guides'] as const;

const docs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    group: z.enum(GROUPS),
    order: z.number(),
    /** Short sidebar label; defaults to the title. */
    label: z.string().optional()
  })
});

/**
 * The pages of the package subsites: `src/content/packages/<slug>/`, with
 * `index.mdx` as the package's overview and the other files as its guides,
 * in `order`. `api` isn't a guide name: the package's API page has it.
 */
const packages = defineCollection({
  loader: glob({ pattern: '*/*.mdx', base: './src/content/packages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    /** Short sidebar label; defaults to the title. */
    label: z.string().optional()
  })
});

export const collections = { docs, packages };
