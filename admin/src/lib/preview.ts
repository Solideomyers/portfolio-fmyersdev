// "How it will read" lines for the editor. They read the strings from the working UI files, so a
// price or date preview follows an edited UI text. Same rules as src/lib/home.ts (`availability`),
// which cannot be imported here: it loads the generated ui module.
export type Lang = 'en' | 'es';

type Ui = {
  offer: { from: string; units: Record<string, string> };
  home: { available: string; availableNow: string };
  months: string[];
};

export const usd = (n: number) => '$' + new Intl.NumberFormat('en-US').format(n);

export const priceLine = (ui: Ui, from: number, billing: string) => ({
  from: ui.offer.from,
  price: usd(from),
  unit: ui.offer.units[billing] ?? billing,
});

/** "Available for new projects from Nov 2026" until that month starts (UTC), then the dateless line. */
export function availabilityText(ui: Ui, from: string, lang: Lang, now = new Date()): string {
  const m = /^(\d{4})-(\d{2})$/.exec(from);
  if (!m) return '—';
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return '—';
  if (now.getTime() >= Date.UTC(year, month - 1, 1)) return ui.home.availableNow;
  const mon = ui.months[month - 1];
  const label = lang === 'es' ? mon.toLowerCase() : mon.charAt(0) + mon.slice(1).toLowerCase();
  return ui.home.available.replace('{date}', `${label} ${year}`);
}
