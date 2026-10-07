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
  offer: {
    common: string;
    from: string;
    units: { project: string; month: string; monthShort: string };
  };
  services: {
    sheet: string;
    meta: string;
    lead: string;
    timing: string;
    seePrice: string;
    scope: string;
    deliver: string;
    faqH: string;
    ctaH: string;
    pricing: string;
  };
  pricing: {
    sheet: string;
    lead: string;
    choose: string;
    ngo: string;
    compareH: string;
    compareLabel: string;
    swipe: string;
    faqH: string;
    faqP: string;
    ctaH: string;
    ctaP: string;
  };
  process: { h: string; steps: { n: string; t: string; time: string; d: string }[] };
  compare: {
    timeline: string;
    spec: string;
    weeklyBuilds: string;
    ownership: string;
    fixes: string;
    maintenance: string;
    payment: string;
  };
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
    offer: {
      common: 'MOST CHOSEN',
      from: 'FROM',
      units: { project: 'PER PROJECT', month: 'PER MONTH', monthShort: 'mo' },
    },
    services: {
      sheet: 'SHEET 02 — SERVICES',
      meta: 'P-01 — P-03',
      lead: 'A product built from zero, an automation on the tools you already use, or a senior developer on your team. Each one starts with a short spec.',
      timing: 'TYPICAL TIMELINE',
      seePrice: 'SEE PRICING',
      scope: 'WHAT I DO',
      deliver: 'WHAT YOU GET',
      faqH: 'Working together.',
      ctaH: 'Have a problem that fits?',
      pricing: 'See pricing',
    },
    pricing: {
      sheet: 'SHEET 05 — PRICING',
      lead: 'Every project starts with a one-page spec. Once it is signed, the price is fixed. Prices in USD.',
      choose: 'Start with this',
      ngo: 'I work with churches and nonprofits; ask me about it. Payment: 50% to start, 50% on delivery, by bank transfer, Zelle or crypto.',
      compareH: 'COMPARE',
      compareLabel: 'Package comparison',
      swipe: 'SWIPE',
      faqH: 'Before you ask.',
      faqP: 'Anything else goes in the brief. I reply within 2 business days.',
      ctaH: 'Not sure which one fits?',
      ctaP: 'Describe the problem and I will suggest a package.',
    },
    process: {
      h: 'HOW A PROJECT RUNS',
      steps: [
        {
          n: '01',
          t: 'Spec',
          time: '1 WEEK',
          d: 'One page with modules, data and the metric that matters. You sign it, and the price is fixed.',
        },
        {
          n: '02',
          t: 'Build',
          time: '3–5 WEEKS',
          d: 'Weekly builds on a live link. One call a week; the rest in writing.',
        },
        {
          n: '03',
          t: 'Launch',
          time: '1 WEEK',
          d: 'Deploy to your domain, hand over access and docs, record a walkthrough.',
        },
        {
          n: '04',
          t: 'Support',
          time: '30 DAYS',
          d: 'Bug fixes included. Then an optional maintenance plan from $150 a month.',
        },
      ],
    },
    compare: {
      timeline: 'TIMELINE',
      spec: 'SPEC',
      weeklyBuilds: 'WEEKLY BUILDS',
      ownership: 'CODE OWNERSHIP',
      fixes: 'FIXES AFTER LAUNCH',
      maintenance: 'MAINTENANCE PLAN',
      payment: 'PAYMENT',
    },
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
    offer: {
      common: 'MÁS ELEGIDO',
      from: 'DESDE',
      units: { project: 'POR PROYECTO', month: 'AL MES', monthShort: 'mes' },
    },
    services: {
      sheet: 'LÁMINA 02 — SERVICIOS',
      meta: 'P-01 — P-03',
      lead: 'Un producto desde cero, una automatización sobre las herramientas que ya usas o un desarrollador senior en tu equipo. Todo empieza con una especificación corta.',
      timing: 'PLAZO TÍPICO',
      seePrice: 'VER PRECIOS',
      scope: 'QUÉ HAGO',
      deliver: 'QUÉ RECIBES',
      faqH: 'Trabajar juntos.',
      ctaH: '¿Tienes un problema que encaja?',
      pricing: 'Ver precios',
    },
    pricing: {
      sheet: 'LÁMINA 05 — PRECIOS',
      lead: 'Todo proyecto empieza con una especificación de una página. Una vez firmada, el precio queda fijo. Precios en USD.',
      choose: 'Empezar con este',
      ngo: 'Trabajo con iglesias y ONG; pregúntame. Pago: 50% al iniciar y 50% en la entrega, por transferencia, Zelle o cripto.',
      compareH: 'COMPARAR',
      compareLabel: 'Comparación de paquetes',
      swipe: 'DESLIZA',
      faqH: 'Antes de que preguntes.',
      faqP: 'Lo demás va en el resumen. Respondo en 2 días hábiles.',
      ctaH: '¿No sabes cuál te sirve?',
      ctaP: 'Describe el problema y te sugiero un paquete.',
    },
    process: {
      h: 'CÓMO VA UN PROYECTO',
      steps: [
        {
          n: '01',
          t: 'Especificación',
          time: '1 SEMANA',
          d: 'Una página con módulos, datos y la métrica que importa. La firmas y el precio queda fijo.',
        },
        {
          n: '02',
          t: 'Construcción',
          time: '3–5 SEMANAS',
          d: 'Versiones semanales en un enlace en vivo. Una llamada por semana; lo demás por escrito.',
        },
        {
          n: '03',
          t: 'Lanzamiento',
          time: '1 SEMANA',
          d: 'Despliegue en tu dominio, entrega de accesos y documentación, video de recorrido.',
        },
        {
          n: '04',
          t: 'Soporte',
          time: '30 DÍAS',
          d: 'Corrección de errores incluida. Después, plan de mantenimiento opcional desde $150 al mes.',
        },
      ],
    },
    compare: {
      timeline: 'PLAZO',
      spec: 'ESPECIFICACIÓN',
      weeklyBuilds: 'VERSIONES SEMANALES',
      ownership: 'PROPIEDAD DEL CÓDIGO',
      fixes: 'CORRECCIONES',
      maintenance: 'MANTENIMIENTO',
      payment: 'PAGO',
    },
  },
};
