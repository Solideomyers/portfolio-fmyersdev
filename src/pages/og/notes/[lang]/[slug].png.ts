import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { blogEnabled } from '../../../../config/blog';
import { categoryLabel, type NoteData } from '../../../../lib/notes';
import { renderNoteOg } from '../../../../lib/og';

export async function getStaticPaths() {
  if (!blogEnabled) return [];
  return (await getCollection('notes'))
    .filter((n) => !n.data.draft)
    .map((n) => ({ params: { lang: n.data.lang, slug: n.data.slug }, props: { note: n.data } }));
}

export const GET: APIRoute = async ({ props }) => {
  const n = props.note as NoteData;
  const png = await renderNoteOg({
    id: n.id,
    lang: n.lang,
    category: categoryLabel(n.category, n.lang),
    title: n.title,
    dek: n.dek,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
