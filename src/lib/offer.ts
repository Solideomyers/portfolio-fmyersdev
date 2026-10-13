import type { Lang } from '../i18n/routes';
import { ui } from '../i18n/ui';

type Billing = 'project' | 'month';

/** "$4,500" — the design uses US formatting in both languages. */
export const formatUsd = (n: number) => '$' + new Intl.NumberFormat('en-US').format(n);

export const unitLabel = (billing: Billing, lang: Lang) => ui[lang].offer.units[billing];

/** Services FROM cell: "$900", "$2,800 / mo", "$2,800 / mes". */
export const priceShort = (p: { from: number; billing: Billing }, lang: Lang) =>
  p.billing === 'month'
    ? `${formatUsd(p.from)} / ${ui[lang].offer.units.monthShort}`
    : formatUsd(p.from);

interface FaqLike {
  data: { lang: Lang; page: 'pricing' | 'services' | 'both'; order: number };
}

/** FAQ items for a page: its own plus the shared ones, in that language, by `order`. */
export const faqFor = <T extends FaqLike>(all: T[], page: 'pricing' | 'services', lang: Lang) =>
  all
    .filter((e) => e.data.lang === lang && (e.data.page === page || e.data.page === 'both'))
    .sort((a, b) => a.data.order - b.data.order);

export const byOrder = <T extends { data: { order: number } }>(list: T[]) =>
  [...list].sort((a, b) => a.data.order - b.data.order);
