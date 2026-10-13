import type { APIRoute } from 'astro';
import { ui } from '../../../i18n/ui';
import type { Lang } from '../../../i18n/routes';
import { renderSheetOg } from '../../../lib/og';

export function getStaticPaths() {
  return [{ params: { lang: 'en' } }, { params: { lang: 'es' } }];
}

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang as Lang;
  const t = ui[lang];
  const png = await renderSheetOg({
    lang,
    sheet: t.home.sheet00,
    meta: '',
    title: t.h1.home,
    dek: t.home.lead,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
