import type { Lang, NavKey, RouteKey } from './routes';

interface Ui {
  nav: Record<NavKey, string>;
  menu: string;
  close: string;
  startCaps: string;
  privacy: string;
  langName: string;
  themeLabel: string;
  homeLabel: string;
  navLabel: string;
  h1: Record<RouteKey, string>;
  notFound: { sheet: string; missing: string; h1: string; p: string; home: string; links: [string, string] };
}

// Copy is verbatim from docs/handoff/design/*.dc.html COPY objects.
export const ui: Record<Lang, Ui> = {
  en: {
    nav: { services: 'SERVICES', work: 'WORK', about: 'ABOUT', pricing: 'PRICING', contact: 'CONTACT' },
    menu: 'MENU',
    close: 'CLOSE',
    startCaps: 'START A PROJECT',
    privacy: 'PRIVACY',
    langName: 'ENGLISH',
    themeLabel: 'Toggle theme',
    homeLabel: 'fmyers.dev home',
    navLabel: 'Main',
    h1: {
      home: 'I build SaaS products end to end.',
      services: 'Three ways to work together.',
      work: 'Work',
      about: 'Francisco Myers',
      pricing: 'Clear starting prices. A fixed quote after the spec.',
      contact: "Tell me what you're building.",
      privacy: 'Privacy',
    },
    notFound: {
      sheet: 'SHEET 404',
      missing: 'NOT FOUND',
      h1: "This sheet isn't in the set.",
      p: 'The link may be old or mistyped. Everything that exists is one click away.',
      home: 'Back home',
      links: ['WORK', 'CONTACT'],
    },
  },
  es: {
    nav: { services: 'SERVICIOS', work: 'PROYECTOS', about: 'SOBRE MÍ', pricing: 'PRECIOS', contact: 'CONTACTO' },
    menu: 'MENÚ',
    close: 'CERRAR',
    startCaps: 'INICIAR PROYECTO',
    privacy: 'PRIVACIDAD',
    langName: 'ESPAÑOL',
    themeLabel: 'Cambiar tema',
    homeLabel: 'Inicio de fmyers.dev',
    navLabel: 'Principal',
    h1: {
      home: 'Construyo productos SaaS de punta a punta.',
      services: 'Tres formas de trabajar juntos.',
      work: 'Proyectos',
      about: 'Francisco Myers',
      pricing: 'Precios de partida claros. Cotización fija tras la especificación.',
      contact: 'Cuéntame qué estás construyendo.',
      privacy: 'Privacidad',
    },
    notFound: {
      sheet: 'LÁMINA 404',
      missing: 'NO ENCONTRADA',
      h1: 'Esta lámina no está en el juego.',
      p: 'El enlace puede ser antiguo o tener un error. Todo lo que existe está a un clic.',
      home: 'Volver al inicio',
      links: ['PROYECTOS', 'CONTACTO'],
    },
  },
};
