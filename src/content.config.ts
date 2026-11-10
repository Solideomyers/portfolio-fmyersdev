import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import faqEn from './content/faq/en.json';
import faqEs from './content/faq/es.json';
import {
  faqItemSchema,
  notesSchema,
  otherWorkSchema,
  pagesSchema,
  pricingSchema,
  workSchema,
} from './lib/content-schemas';

// Schemas live in src/lib/content-schemas.ts (shared with the admin panel).
const work = defineCollection({
  // Id from the file path (en/fm-02-chapel): both languages share the frontmatter slug, which glob would use as id.
  loader: glob({
    base: './src/content/work',
    pattern: '**/*.mdx',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: workSchema,
});

const notes = defineCollection({
  // Id from the file path (en/n-02-…): the EN and ES twins share `id`, not the entry id.
  loader: glob({
    base: './src/content/notes',
    pattern: '**/*.mdx',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: notesSchema,
});

const otherWork = defineCollection({
  loader: file('src/content/other-work.json'),
  schema: otherWorkSchema,
});

const pricing = defineCollection({
  loader: glob({
    base: './src/content/pricing',
    pattern: '**/*.md',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: pricingSchema,
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
  schema: faqItemSchema
    .omit({ id: true })
    .extend({ qid: faqItemSchema.shape.id, lang: z.enum(['en', 'es']) }),
});

const pages = defineCollection({
  loader: glob({
    base: './src/content/pages',
    pattern: '**/*.md',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: pagesSchema,
});

export const collections = { work, notes, otherWork, pricing, faq, pages };
