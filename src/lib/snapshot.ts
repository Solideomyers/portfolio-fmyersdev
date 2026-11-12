// A content snapshot is a map { repoPath: fileText } of the managed content files. Pure module (no
// `node:` imports) so the site build, scripts and the admin panel share it.
import { parse } from 'yaml';
import type { ZodType } from 'zod';
import {
  faqItemSchema,
  notesSchema,
  otherWorkSchema,
  pagesSchema,
  pricingSchema,
  workSchema,
} from './content-schemas.ts';

export type Files = Record<string, string>;

const MANAGED = [
  /^src\/content\//,
  /^src\/i18n\/ui\.(en|es)\.json$/,
  /^src\/config\/site\.data\.json$/,
];
export const isManaged = (path: string): boolean => MANAGED.some((re) => re.test(path));

export function splitFrontmatter(text: string): { data: unknown; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  return m ? { data: parse(m[1]), body: m[2] } : { data: null, body: text };
}

export const SITE_KEYS = ['rev', 'availableFrom', 'email', 'whatsapp', 'github', 'linkedin'];
const TWIN_KEYS = ['id', 'order', 'from', 'billing', 'featured'] as const;
const WORK_REQUIRED = ['title', 'summary', 'client', 'role', 'timeline'] as const;

const leafPaths = (v: unknown, p = ''): string[] =>
  v && typeof v === 'object'
    ? Object.entries(v).flatMap(([k, x]) => leafPaths(x, p ? `${p}.${k}` : k))
    : [p];

/** Returns human-readable problems; an empty array means the snapshot is valid. */
export function validateFiles(files: Files): string[] {
  const errors: string[] = [];
  const check = (path: string, schema: ZodType, value: unknown) => {
    const r = schema.safeParse(value);
    if (!r.success)
      for (const i of r.error.issues)
        errors.push(`${path}: ${i.path.join('.') || '(root)'}: ${i.message}`);
  };
  const json = (path: string): unknown => {
    try {
      return JSON.parse(files[path]);
    } catch {
      errors.push(`${path}: not valid JSON`);
      return null;
    }
  };

  const pricing: Record<string, Record<string, unknown>> = {};
  const work: Record<string, Record<string, unknown> | null> = {};
  for (const [path, text] of Object.entries(files)) {
    const frontmatter = (schema: ZodType) => {
      const { data } = splitFrontmatter(text);
      check(path, schema, data);
      return data as Record<string, unknown>;
    };
    if (/^src\/content\/work\/.+\.mdx$/.test(path)) work[path] = frontmatter(workSchema);
    else if (/^src\/content\/notes\/.+\.mdx$/.test(path)) frontmatter(notesSchema);
    else if (/^src\/content\/pages\/.+\.md$/.test(path)) frontmatter(pagesSchema);
    else if (/^src\/content\/pricing\/.+\.md$/.test(path))
      pricing[path] = frontmatter(pricingSchema);
    else if (path === 'src/content/other-work.json') {
      const list = json(path);
      if (Array.isArray(list)) list.forEach((x, i) => check(`${path}[${i}]`, otherWorkSchema, x));
    } else if (/^src\/content\/faq\/(en|es)\.json$/.test(path)) {
      const list = json(path);
      if (Array.isArray(list)) list.forEach((x, i) => check(`${path}[${i}]`, faqItemSchema, x));
    } else if (path === 'src/config/site.data.json') {
      const site = json(path) as Record<string, unknown> | null;
      for (const k of SITE_KEYS)
        if (typeof site?.[k] !== 'string' || !site[k]) errors.push(`${path}: ${k}: required text`);
    }
  }

  // A published case study needs its texts and a cover; a draft one (draft: true) may be unfinished.
  // Two cases with the same slug in one language fail the site build (casePaths), so refuse them here.
  const slugs = new Map<string, string>();
  for (const [path, d] of Object.entries(work)) {
    if (!d) continue;
    if (d.draft !== true) {
      for (const k of WORK_REQUIRED) {
        const v = d[k];
        if (typeof v !== 'string' || !v.trim()) errors.push(`${path}: ${k}: required text`);
      }
      const src = (d.cover as { src?: unknown } | undefined)?.src;
      if (typeof src !== 'string' || !src.trim()) errors.push(`${path}: cover.src: required text`);
    }
    const slug = `${d.lang}/${d.slug}`;
    const first = slugs.get(slug);
    if (first) errors.push(`${path}: slug "${d.slug}" is also used by ${first}`);
    else slugs.set(slug, path);
  }

  for (const [path, a] of Object.entries(pricing)) {
    if (!path.includes('/pricing/en/')) continue;
    const twin = pricing[path.replace('/pricing/en/', '/pricing/es/')];
    if (!twin) {
      errors.push(`${path}: missing Spanish twin`);
      continue;
    }
    for (const k of TWIN_KEYS)
      if (a[k] !== twin[k]) errors.push(`${path}: ${k} differs from its Spanish twin`);
  }

  const ui = ['en', 'es'].map((l) => json(`src/i18n/ui.${l}.json`));
  if (ui[0] && ui[1]) {
    const en = new Set(leafPaths(ui[0]));
    const es = new Set(leafPaths(ui[1]));
    for (const k of en) if (!es.has(k)) errors.push(`src/i18n/ui.es.json: missing ${k}`);
    for (const k of es) if (!en.has(k)) errors.push(`src/i18n/ui.en.json: missing ${k}`);
  }
  return errors;
}
