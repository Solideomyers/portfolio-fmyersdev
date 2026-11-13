// Content schemas shared by the site build (src/content.config.ts) and the admin panel.
// Verbatim from docs/handoff/README.md → "Content model". Only imports `zod`, so Node and Vite can load it.
import { z } from 'zod';

export const workSchema = z.object({
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
});

export const notesSchema = z
  .object({
    id: z.string().regex(/^N-\d{2}$/),
    lang: z.enum(['en', 'es']),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string(),
    dek: z.string(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((d) => !Number.isNaN(Date.parse(d)), 'not a real date'),
    category: z.enum(['process', 'automation', 'engineering', 'cases']),
    minutes: z.number().int().min(1),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
  })
  .strict();

export const otherWorkSchema = z.object({
  id: z.string().regex(/^OW-\d{2}$/),
  title: z.string(),
  repo: z.url(),
  stack: z.array(z.string()),
  en: z.string(),
  es: z.string(),
});

export const pricingSchema = z
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
    teaser: z.array(z.string()).min(1),
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
  .strict();

/** One item of src/content/faq/{en,es}.json (the collection adds `lang` and `qid` itself). */
export const faqItemSchema = z.object({
  id: z.string().regex(/^Q-\d{2}$/),
  page: z.enum(['pricing', 'services', 'both']),
  order: z.number(),
  q: z.string(),
  a: z.string(),
});

export const pagesSchema = z.object({ title: z.string(), updated: z.coerce.date() }).strict();
