import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// Schemas verbatim from docs/handoff/README.md → "Content model".
const work = defineCollection({
  // Id from the file path (en/fm-02-chapel): both languages share the frontmatter slug, which glob would use as id.
  loader: glob({
    base: './src/content/work',
    pattern: '**/*.mdx',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: z.object({
    id: z.string().regex(/^FM-\d{2}$/),
    slug: z.string(),
    lang: z.enum(['en', 'es']),
    title: z.string(),
    summary: z.string(),
    client: z.string(),
    sector: z.array(z.string()),
    modules: z.array(z.string()),
    stack: z.array(z.string()),
    status: z.enum(['live', 'in-use', 'wip']),
    version: z.string().optional(),
    role: z.string(),
    timeline: z.string(),
    year: z.number(),
    cover: z.object({ src: z.string(), alt: z.string() }),
    // strict: an unquoted comma in a YAML flow mapping splits the value into a stray key; fail instead.
    shots: z.array(z.object({ src: z.string(), alt: z.string(), caption: z.string() }).strict()),
    metrics: z
      .array(z.object({ label: z.string(), value: z.string(), date: z.string() }))
      .default([]),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    draft: z.boolean().default(false),
  }),
});

const otherWork = defineCollection({
  loader: file('src/content/other-work.json'),
  schema: z.object({
    id: z.string().regex(/^OW-\d{2}$/),
    title: z.string(),
    repo: z.url(),
    stack: z.array(z.string()),
    en: z.string(),
    es: z.string(),
  }),
});

export const collections = { work, otherWork };
