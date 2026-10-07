import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import faqEn from './content/faq/en.json';
import faqEs from './content/faq/es.json';

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

const pricing = defineCollection({
  loader: glob({
    base: './src/content/pricing',
    pattern: '**/*.md',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z
    .object({
      id: z.string().regex(/^P-\d{2}$/),
      lang: z.enum(['en', 'es']),
      order: z.number(),
      name: z.string(),
      for: z.string(),
      from: z.number().int().positive(),
      billing: z.enum(['project', 'month']),
      includes: z.array(z.string()),
      timeline: z.string(),
      featured: z.boolean().default(false),
      service: z
        .object({
          for: z.string(),
          scope: z.array(z.string()),
          deliver: z.array(z.string()),
          stack: z.array(z.string()),
          proof: z.string(),
        })
        .strict(),
      compare: z
        .object({
          timeline: z.string(),
          spec: z.string(),
          weeklyBuilds: z.string(),
          ownership: z.string(),
          fixes: z.string(),
          maintenance: z.string(),
          payment: z.string(),
        })
        .strict(),
    })
    .strict(),
});

// Both JSON files share ids (Q-01…), so the entry id carries the language; the JSON id becomes qid.
const faq = defineCollection({
  loader: () =>
    (
      [
        ['en', faqEn],
        ['es', faqEs],
      ] as const
    ).flatMap(([lang, items]) =>
      items.map(({ id, ...rest }) => ({ ...rest, id: `${lang}/${id}`, qid: id, lang })),
    ),
  schema: z.object({
    qid: z.string().regex(/^Q-\d{2}$/),
    lang: z.enum(['en', 'es']),
    page: z.enum(['pricing', 'services', 'both']),
    order: z.number(),
    q: z.string(),
    a: z.string(),
  }),
});

export const collections = { work, otherWork, pricing, faq };
