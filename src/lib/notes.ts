import { ROUTES, other, type Lang } from '../i18n/routes';
import { ui } from '../i18n/ui';

export const CATEGORIES = ['process', 'automation', 'engineering', 'cases'] as const;
export type Category = (typeof CATEGORIES)[number];
export interface NoteData {
  id: string;
  lang: Lang;
  slug: string;
  title: string;
  dek: string;
  date: string;
  category: Category;
  minutes: number;
  tags: string[];
  draft: boolean;
}
export interface NoteLike {
  data: NoteData;
}
export type Listed<T> = T & { fallback: boolean };

const published = <T extends NoteLike>(all: T[]) => all.filter((n) => !n.data.draft);
const newestFirst = (a: NoteLike, b: NoteLike) =>
  b.data.date.localeCompare(a.data.date) || b.data.id.localeCompare(a.data.id);

export const noteUrl = (lang: Lang, slug: string) => `${ROUTES.notes[lang]}/${slug}`;
export const noteHref = (n: NoteLike) => noteUrl(n.data.lang, n.data.slug);

/** Published notes for a language, newest first; notes that exist only in the other language
 *  are included with fallback: true (index label "ONLY IN …"). */
export function listNotes<T extends NoteLike>(all: T[], lang: Lang): Listed<T>[] {
  const pub = published(all);
  const own = pub.filter((n) => n.data.lang === lang);
  const ids = new Set(own.map((n) => n.data.id));
  const foreign = pub.filter((n) => n.data.lang !== lang && !ids.has(n.data.id));
  return [
    ...own.map((n) => ({ ...n, fallback: false })),
    ...foreign.map((n) => ({ ...n, fallback: true })),
  ].sort(newestFirst);
}

/** Static paths for one language. Duplicate ids or slugs would silently overwrite a page. */
export function notePaths<T extends NoteLike>(all: T[], lang: Lang) {
  const own = published(all)
    .filter((n) => n.data.lang === lang)
    .sort(newestFirst);
  const seen = { id: new Set<string>(), slug: new Set<string>() };
  for (const n of own) {
    if (seen.id.has(n.data.id)) throw new Error(`notes: duplicate id ${n.data.id} in ${lang}`);
    if (seen.slug.has(n.data.slug))
      throw new Error(`notes: duplicate slug ${n.data.slug} in ${lang}`);
    seen.id.add(n.data.id);
    seen.slug.add(n.data.slug);
  }
  return own.map((entry) => ({ params: { slug: entry.data.slug }, props: { entry } }));
}

export const twinOf = <T extends NoteLike>(all: T[], n: T) =>
  published(all).find((t) => t.data.id === n.data.id && t.data.lang !== n.data.lang);

/** Language switch target: the twin, or the other language's notes index (no hreflang). */
export function noteAlternate<T extends NoteLike>(all: T[], n: T) {
  const twin = twinOf(all, n);
  return twin
    ? { alternate: noteHref(twin), hreflang: true }
    : { alternate: ROUTES.notes[other(n.data.lang)], hreflang: false };
}

/** list is newest first: prev = the older neighbour, next = the newer one. */
export function prevNext<T extends NoteLike>(list: T[], id: string): { prev?: T; next?: T } {
  const i = list.findIndex((n) => n.data.id === id);
  return { prev: list[i + 1], next: i > 0 ? list[i - 1] : undefined };
}

export const dateLabel = (date: string) => date.slice(0, 7).replace('-', '.');
export const categoryLabel = (c: Category, lang: Lang) =>
  ui[lang].notes.cats[CATEGORIES.indexOf(c) + 1];

export function categoryCounts(list: NoteLike[]) {
  const counts = { all: list.length, process: 0, automation: 0, engineering: 0, cases: 0 };
  for (const n of list) counts[n.data.category]++;
  return counts;
}

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
const xml = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);
/** Noon UTC, so the weekday never shifts across time zones. */
export const rfc822 = (date: string) => new Date(`${date}T12:00:00Z`).toUTCString();

export function rssFeed(o: {
  lang: Lang;
  title: string;
  description: string;
  base: string;
  items: NoteData[];
}): string {
  const abs = (p: string) => new URL(p, o.base).href;
  const items = o.items
    .map((n) => {
      const url = abs(noteUrl(n.lang, n.slug));
      return `<item><title>${xml(n.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${rfc822(n.date)}</pubDate><description>${xml(n.dek)}</description></item>`;
    })
    .join('');
  const index = abs(ROUTES.notes[o.lang]);
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${xml(o.title)}</title><link>${index}</link><atom:link href="${index}/rss.xml" rel="self" type="application/rss+xml"/><description>${xml(o.description)}</description><language>${o.lang}</language>${items}</channel></rss>`;
}
