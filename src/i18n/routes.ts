export type Lang = 'en' | 'es';
export const LANGS: readonly Lang[] = ['en', 'es'];

// The only place URLs are written. Grows per sub-project (contact/sent in SP5, notes in SP7).
export const ROUTES = {
  home: { en: '/en', es: '/es' },
  services: { en: '/en/services', es: '/es/servicios' },
  work: { en: '/en/work', es: '/es/proyectos' },
  about: { en: '/en/about', es: '/es/sobre-mi' },
  pricing: { en: '/en/pricing', es: '/es/precios' },
  contact: { en: '/en/contact', es: '/es/contacto' },
  contactSent: { en: '/en/contact/sent', es: '/es/contacto/enviado' },
  privacy: { en: '/en/privacy', es: '/es/privacidad' },
  notes: { en: '/en/notes', es: '/es/notas' },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteKey = keyof typeof ROUTES;

export const NAV = [
  'services',
  'work',
  'about',
  'pricing',
  'contact',
] as const satisfies readonly RouteKey[];
export type NavKey = (typeof NAV)[number];

export const path = (key: RouteKey, lang: Lang): string => ROUTES[key][lang];
export const other = (lang: Lang): Lang => (lang === 'en' ? 'es' : 'en');
export const langOf = (pathname: string): Lang =>
  pathname === '/es' || pathname.startsWith('/es/') ? 'es' : 'en';

const trim = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

export function routeKeyOf(pathname: string): RouteKey | undefined {
  const p = trim(pathname);
  return (Object.keys(ROUTES) as RouteKey[]).find((k) => ROUTES[k].en === p || ROUTES[k].es === p);
}

/** This page in the other language. `alternate` overrides: a URL, or null when no translation exists. */
export function alternateOf(pathname: string, alternate?: string | null): string | null {
  if (alternate !== undefined) return alternate;
  const target = other(langOf(trim(pathname)));
  const key = routeKeyOf(pathname);
  return key ? ROUTES[key][target] : ROUTES.home[target];
}

/** Nav section for a path, including its sub-pages (/en/work/chapel → work). Home never matches. */
export function navKeyOf(pathname: string): NavKey | undefined {
  const p = trim(pathname);
  return NAV.find((k) => LANGS.some((l) => p === ROUTES[k][l] || p.startsWith(ROUTES[k][l] + '/')));
}
