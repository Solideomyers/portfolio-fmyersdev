import type { Lang } from '../i18n/routes';
import { ui } from '../i18n/ui';

/**
 * Availability sentence from site.availableFrom ("YYYY-MM"). "Available from Nov 2026" means
 * from Nov 1 (UTC); from then on the dateless sentence shows.
 */
export function availability(from: string, now: Date, lang: Lang) {
  const m = /^(\d{4})-(\d{2})$/.exec(from);
  if (!m) throw new Error(`site.availableFrom must be YYYY-MM, got "${from}"`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const h = ui[lang].home;
  if (now.getTime() >= Date.UTC(year, month - 1, 1)) return { text: h.availableNow, dated: false };
  const mon = ui[lang].months[month - 1];
  const label = lang === 'es' ? mon.toLowerCase() : mon.charAt(0) + mon.slice(1).toLowerCase();
  return { text: h.available.replace('{date}', `${label} ${year}`), dated: true };
}

/** Home "Selected work": own-language, featured, non-draft cases by `order`, at most 3. */
export const featuredCases = <
  T extends { data: { lang: Lang; draft: boolean; featured: boolean; order: number } },
>(
  all: T[],
  lang: Lang,
) =>
  all
    .filter((e) => e.data.lang === lang && e.data.featured && !e.data.draft)
    .sort((a, b) => a.data.order - b.data.order)
    .slice(0, 3);
