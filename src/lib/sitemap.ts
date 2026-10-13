import { LANGS, type Lang } from '../i18n/routes';

/** A page and its translation; a single-language page has one key. */
export type Pair = Partial<Record<Lang, string>>;

export function sitemapXml(base: string, pairs: Pair[]): string {
  const abs = (p: string) => new URL(p, base).href;
  const urls = pairs.flatMap((pair) => {
    const langs = LANGS.filter((l) => pair[l]);
    const alternates =
      langs.length === 2
        ? [...langs.map((l) => [l, pair[l]!] as const), ['x-default', pair.en!] as const]
            .map(([l, p]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${abs(p)}"/>`)
            .join('')
        : '';
    return langs.map((l) => `<url><loc>${abs(pair[l]!)}</loc>${alternates}</url>`);
  });
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`;
}
