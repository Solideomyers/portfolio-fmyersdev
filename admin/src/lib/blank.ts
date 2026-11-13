import { stringify } from 'yaml';
import type { Files } from '../../../src/lib/snapshot.ts';

export const OTHER_WORK = 'src/content/other-work.json';

const pad = (n: number) => String(n).padStart(2, '0');

export const newId = (collection: 'work' | 'otherWork', n: number) =>
  `${collection === 'work' ? 'FM' : 'OW'}-${pad(n)}`;

/** The next free number for `FM-nn` (case studies, both languages) or `OW-nn` (other work). */
export function nextNumber(files: Files, collection: 'work' | 'otherWork'): number {
  const used =
    collection === 'work'
      ? Object.entries(files)
          .filter(([p]) => /^src\/content\/work\/(en|es)\/.+\.mdx$/.test(p))
          .map(([, text]) => /^id: FM-(\d+)/m.exec(text)?.[1])
      : (JSON.parse(files[OTHER_WORK] ?? '[]') as { id: string }[]).map(
          (x) => /^OW-(\d+)$/.exec(x.id)?.[1],
        );
  return Math.max(0, ...used.filter((n): n is string => !!n).map(Number)) + 1;
}

/** Puts a removed other-work entry back where it was in the published list. */
export function restoreEntry(current: string, working: string, id: string): string {
  const was = JSON.parse(current) as { id: string }[];
  const list = JSON.parse(working) as { id: string }[];
  const index = was.findIndex((e) => e.id === id);
  if (index < 0 || list.some((e) => e.id === id)) return working;
  list.splice(Math.min(index, list.length), 0, was[index]);
  return JSON.stringify(list, null, 2) + '\n';
}

const frontmatter = (data: Record<string, unknown>) =>
  `---\n${stringify(data, { lineWidth: 0, flowCollectionPadding: false })}---\n\n`;

/**
 * The files of a new project or other-work entry, with values that satisfy the schema. A new case
 * study is a pair of files (ES and EN) and starts as a draft (`draft: true`), so it stays off the
 * site while it is unfinished; validateFiles asks for its texts and cover only once it is published.
 * A new other-work entry is the existing list plus one blank item: its repository must be a URL,
 * so validateFiles refuses it until the owner fills it in or removes it.
 */
export function blankFor(collection: 'work' | 'otherWork', n: number, files: Files = {}): Files {
  if (collection === 'otherWork') {
    const list = JSON.parse(files[OTHER_WORK] ?? '[]') as unknown[];
    const entry = { id: newId('otherWork', n), title: '', repo: '', stack: [], en: '', es: '' };
    return { [OTHER_WORK]: JSON.stringify([...list, entry], null, 2) + '\n' };
  }
  const name = `fm-${pad(n)}-proyecto`;
  const base = (lang: 'en' | 'es') => ({
    id: newId('work', n),
    slug: `proyecto-${pad(n)}`,
    lang,
    title: '',
    summary: '',
    client: '',
    sector: [],
    modules: [],
    stack: [],
    status: 'wip',
    role: '',
    timeline: '',
    year: new Date().getFullYear(),
    cover: { src: '', alt: '' },
    shots: [],
    metrics: [],
    featured: false,
    order: 99,
    draft: true,
  });
  return {
    [`src/content/work/en/${name}.mdx`]: frontmatter(base('en')),
    [`src/content/work/es/${name}.mdx`]: frontmatter(base('es')),
  };
}
