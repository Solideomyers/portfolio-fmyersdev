import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { blogEnabled } from '../../../config/blog';
import { site } from '../../../config/site';
import { ui } from '../../../i18n/ui';
import { listNotes, rssFeed } from '../../../lib/notes';

// [file].xml rather than rss.xml: a static endpoint would be built with the blog off.
export function getStaticPaths() {
  return blogEnabled ? [{ params: { file: 'rss' } }] : [];
}

export const GET: APIRoute = async () => {
  const items = listNotes(await getCollection('notes'), 'es')
    .filter((n) => !n.fallback)
    .map((n) => n.data);
  const body = rssFeed({
    lang: 'es',
    title: ui.es.notes.rssTitle,
    description: ui.es.notes.lead,
    base: site.url,
    items,
  });
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
