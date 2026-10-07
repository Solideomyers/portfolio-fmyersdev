import { ROUTES, other, type Lang } from '../i18n/routes';
import { ui } from '../i18n/ui';

export interface CaseLike {
  data: { id: string; slug: string; lang: Lang; draft: boolean };
}
export interface Listed<T> {
  entry: T;
  fallback: boolean;
}

const fm = (id: string) => Number(id.slice(3));
export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Cases for a language: its own non-drafts, plus non-drafts that exist only in the other language. FM-ID desc. */
export function listCases<T extends CaseLike>(all: T[], lang: Lang): Listed<T>[] {
  const live = all.filter((e) => !e.data.draft);
  const own = live.filter((e) => e.data.lang === lang);
  const ownIds = new Set(own.map((e) => e.data.id));
  const borrowed = live.filter((e) => e.data.lang !== lang && !ownIds.has(e.data.id));
  return [
    ...own.map((entry) => ({ entry, fallback: false })),
    ...borrowed.map((entry) => ({ entry, fallback: true })),
  ].sort((a, b) => fm(b.entry.data.id) - fm(a.entry.data.id));
}

/**
 * Static paths for a language: listed cases plus own-language drafts (drafts build but aren't listed).
 * A draft never takes over a listed slug, and duplicate slugs fail the build instead of silently
 * replacing each other.
 */
export function casePaths<T extends CaseLike>(all: T[], lang: Lang) {
  const listed = listCases(all, lang);
  const taken = new Set(listed.map((l) => l.entry.data.slug));
  const drafts = all.filter((e) => e.data.draft && e.data.lang === lang && !taken.has(e.data.slug));
  const paths = [...listed, ...drafts.map((entry) => ({ entry, fallback: false }))];
  const seen = new Set<string>();
  for (const { entry } of paths) {
    if (seen.has(entry.data.slug))
      throw new Error(`Duplicate case slug "${entry.data.slug}" in /${lang} (${entry.data.id})`);
    seen.add(entry.data.slug);
  }
  return paths.map((props) => ({ params: { slug: props.entry.data.slug }, props }));
}

/** Next higher FM-ID, wrapping to the lowest; index is its 1-based position in ascending order. */
export function nextCase<T extends CaseLike>(list: Listed<T>[], id: string) {
  const asc = list.map((l) => l.entry).sort((a, b) => fm(a.data.id) - fm(b.data.id));
  const i = asc.findIndex((e) => e.data.id === id);
  const index = (i + 1) % asc.length;
  return { entry: asc[index], index: index + 1, total: asc.length };
}

/** The published translation of a case (drafts don't count). */
export const twinOf = <T extends CaseLike>(all: T[], entry: T) =>
  all.find((e) => e.data.id === entry.data.id && e.data.lang !== entry.data.lang && !e.data.draft);

/**
 * Language links for a case page on route `lang`:
 * - real twin → LangSwitch + hreflang;
 * - no twin → LangSwitch to the other route's fallback page, no hreflang;
 * - fallback page (other-language content) → back to the original, noindex (duplicate content);
 * - draft → noindex, LangSwitch only to a published twin.
 */
export function caseLinks<T extends CaseLike>(all: T[], entry: T, lang: Lang, fallback: boolean) {
  const twin = twinOf(all, entry);
  if (fallback)
    return { alternate: caseUrl(entry.data.lang, entry.data.slug), hreflang: false, noindex: true };
  if (entry.data.draft)
    return {
      alternate: twin ? caseUrl(other(lang), twin.data.slug) : null,
      hreflang: false,
      noindex: true,
    };
  if (twin)
    return { alternate: caseUrl(other(lang), twin.data.slug), hreflang: true, noindex: false };
  return { alternate: caseUrl(other(lang), entry.data.slug), hreflang: false, noindex: false };
}

export const caseUrl = (lang: Lang, slug: string) => `${ROUTES.work[lang]}/${slug}`;

export function statusLabel(status: 'live' | 'in-use' | 'wip', lang: Lang) {
  const s = ui[lang].status;
  return status === 'live' ? s.live : status === 'in-use' ? s.inUse : s.wip;
}

/** Sentence case for spec cells ("Live", "En uso"); badges use statusLabel's caps. */
export function statusText(status: 'live' | 'in-use' | 'wip', lang: Lang) {
  const s = statusLabel(status, lang).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "AS OF OCT 2026" from the latest YYYY-MM date; '' when there are no metrics. */
export function asOf(metrics: { date: string }[], lang: Lang) {
  if (!metrics.length) return '';
  const [y, m] = metrics
    .map((x) => x.date)
    .sort()
    .at(-1)!
    .split('-');
  return `${ui[lang].case.asOf} ${ui[lang].months[Number(m) - 1]} ${y}`;
}
