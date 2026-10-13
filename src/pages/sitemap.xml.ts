import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { blogEnabled } from '../config/blog';
import { site } from '../config/site';
import { ROUTES, type RouteKey } from '../i18n/routes';
import { noteUrl } from '../lib/notes';
import { sitemapXml, type Pair } from '../lib/sitemap';
import { caseUrl } from '../lib/work';

const NOINDEX: RouteKey[] = ['contactSent'];

/** Published entries grouped by id into language pairs. */
function pairsOf(
  entries: { data: { id: string; lang: 'en' | 'es'; slug: string; draft: boolean } }[],
  url: (l: 'en' | 'es', s: string) => string,
) {
  const byId = new Map<string, Pair>();
  for (const e of entries.filter((x) => !x.data.draft))
    byId.set(e.data.id, { ...byId.get(e.data.id), [e.data.lang]: url(e.data.lang, e.data.slug) });
  return [...byId.values()];
}

export const GET: APIRoute = async () => {
  const pages: Pair[] = (Object.keys(ROUTES) as RouteKey[])
    .filter((k) => !NOINDEX.includes(k) && (k !== 'notes' || blogEnabled))
    .map((k) => ({ ...ROUTES[k] }));
  const work = pairsOf(await getCollection('work'), caseUrl);
  const notes = blogEnabled ? pairsOf(await getCollection('notes'), noteUrl) : [];
  return new Response(sitemapXml(site.url, [...pages, ...work, ...notes]), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
