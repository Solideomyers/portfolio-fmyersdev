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
  notFound: {
    sheet: string;
    missing: string;
    h1: string;
    p: string;
    home: string;
    links: [string, string];
  };
  work: {
    sheet: string;
    cases: string;
    repos: string;
    lead: string;
    shot: string;
    readCaps: string;
    otherH: string;
    otherNote: string;
    ctaH: string;
    start: string;
    keys: { sector: string; stack: string; role: string; year: string };
  };
  case: {
    allWork: string;
    caseStudy: string;
    contents: string;
    next: string;
    similar: string;
    onlyIn: string;
    asOf: string;
    keys: { sector: string; modules: string; stack: string; status: string };
  };
  status: { live: string; inUse: string; wip: string };
  months: string[];
}

// Copy is verbatim from docs/handoff/design/*.dc.html COPY objects.
export const ui: Record<Lang, Ui> = {
  en: {
    nav: {
      services: 'SERVICES',
      work: 'WORK',
      about: 'ABOUT',
      pricing: 'PRICING',
      contact: 'CONTACT',
    },
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
    work: {
      sheet: 'SHEET 01 — WORK',
      cases: 'CASE STUDIES',
      repos: 'REPOS',
      lead: 'Case studies of products in production, newest first. Below, smaller open-source pieces.',
      shot: 'SCREENSHOT',
      readCaps: 'READ CASE',
      otherH: 'OTHER WORK',
      otherNote: 'OPEN SOURCE · GITHUB',
      ctaH: 'Want yours on this sheet?',
      start: 'Start a project',
      keys: { sector: 'SECTOR', stack: 'STACK', role: 'ROLE', year: 'YEAR' },
    },
    case: {
      allWork: 'ALL WORK',
      caseStudy: 'CASE STUDY',
      contents: 'CONTENTS',
      next: 'NEXT PROJECT',
      similar: 'Want something similar?',
      onlyIn: 'ONLY IN ENGLISH',
      asOf: 'AS OF',
      keys: { sector: 'SECTOR', modules: 'MODULES', stack: 'STACK', status: 'STATUS' },
    },
    status: { live: 'LIVE', inUse: 'IN USE', wip: 'PILOT' },
    months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  },
  es: {
    nav: {
      services: 'SERVICIOS',
      work: 'PROYECTOS',
      about: 'SOBRE MÍ',
      pricing: 'PRECIOS',
      contact: 'CONTACTO',
    },
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
    work: {
      sheet: 'LÁMINA 01 — PROYECTOS',
      cases: 'CASOS',
      repos: 'REPOS',
      lead: 'Casos de productos en producción, del más reciente al más antiguo. Debajo, piezas open source más pequeñas.',
      shot: 'CAPTURA',
      readCaps: 'LEER CASO',
      otherH: 'OTROS TRABAJOS',
      otherNote: 'OPEN SOURCE · GITHUB',
      ctaH: '¿Quieres el tuyo en esta lámina?',
      start: 'Iniciar un proyecto',
      keys: { sector: 'SECTOR', stack: 'STACK', role: 'ROL', year: 'AÑO' },
    },
    case: {
      allWork: 'TODOS LOS PROYECTOS',
      caseStudy: 'CASO DE ESTUDIO',
      contents: 'CONTENIDO',
      next: 'SIGUIENTE PROYECTO',
      similar: '¿Quieres algo parecido?',
      onlyIn: 'SOLO EN ESPAÑOL',
      asOf: 'DATOS A',
      keys: { sector: 'SECTOR', modules: 'MÓDULOS', stack: 'STACK', status: 'ESTADO' },
    },
    status: { live: 'EN VIVO', inUse: 'EN USO', wip: 'PILOTO' },
    months: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
  },
};
