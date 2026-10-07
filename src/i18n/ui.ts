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
  home: {
    sheet00: string;
    lead: string;
    see: string;
    available: string;
    availableNow: string;
    sheet01: string;
    allWork: string;
    sheet02: string;
    pricing: string;
    servicesH: string;
    ngo: string;
    sheet03: string;
    steps: string;
    sheet04: string;
    contactH: string;
    contactP: string;
    facts: { k: string; v: string; accent?: boolean }[];
    process: { n: string; time: string; t: string; d: string }[];
  };
  about: {
    sheet: string;
    role: string;
    portrait: string;
    caption: string;
    timelineH: string;
    ctaH: string;
    work: string;
    bio: string[];
    facts: { k: string; v: string }[];
    timeline: { y: string; m: string; d: string }[];
    stack: { k: string; v: string }[];
  };
  privacyPage: { sheet: string; updated: string; email: string };
  contact: {
    sheet: string;
    meta: string;
    sentMeta: string;
    lead: string;
    fName: string;
    phName: string;
    fEmail: string;
    phEmail: string;
    errEmail: string;
    errMsg: string;
    fType: string;
    fBudget: string;
    fMsg: string;
    phMsg: string;
    privacyNote: string;
    privacyLink: string;
    send: string;
    sending: string;
    netErr: string;
    turnstile: string;
    received: string;
    sentP: string;
    home: string;
    whileWait: string;
    types: Record<'saas' | 'automation' | 'contract' | 'other', string>;
    budgets: Record<'lt1k' | '1-5k' | '5-10k' | '10k+' | 'unsure', string>;
    channels: { k: string; v: string; g: string }[];
    spec: { k: string; v: string }[];
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
      contactSent: "Thanks. I'll reply within 2 business days.",
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
    home: {
      sheet00: 'SHEET 00 — FRANCISCO MYERS · FULLSTACK DEVELOPER',
      lead: 'From a validated idea to a product in production: spec, interface, API, database and deployment. One person accountable from start to finish.',
      see: 'See work',
      available: 'Available for new projects from {date}',
      availableNow: 'Available for new projects',
      sheet01: 'SHEET 01 — SELECTED WORK',
      allWork: 'ALL WORK',
      sheet02: 'SHEET 02 — SERVICES',
      pricing: 'PRICING DETAILS',
      servicesH: 'Three ways to work together.',
      ngo: 'I work with churches and nonprofits. Ask me about it. Prices in USD.',
      sheet03: 'SHEET 03 — PROCESS',
      steps: 'STEPS',
      sheet04: 'SHEET 04 — CONTACT',
      contactH: "Tell me what you're building.",
      contactP: 'Send a short brief and I reply within 2 business days, Venezuela time (UTC−4).',
      facts: [
        { k: 'STACK', v: 'Next.js · NestJS · PostgreSQL', accent: true },
        { k: 'AUTOMATION', v: 'Google Workspace · Apps Script' },
        { k: 'BASED IN', v: 'Venezuela · UTC−4 · remote' },
        { k: 'LANGUAGES', v: 'Spanish · English' },
      ],
      process: [
        {
          n: '01',
          time: '1 WK',
          t: 'Spec',
          d: 'One page with modules, data and the metric that matters. You sign it before any code.',
        },
        {
          n: '02',
          time: '3–5 WKS',
          t: 'Build',
          d: 'Every week you get a working build on a live link.',
        },
        {
          n: '03',
          time: '1 WK',
          t: 'Launch',
          d: 'Deploy, access and docs. The repository is yours from day one.',
        },
        {
          n: '04',
          time: '30 DAYS',
          t: 'Support',
          d: 'Bug fixes included. After that, an optional maintenance plan.',
        },
      ],
    },
    about: {
      sheet: 'SHEET 03 — ABOUT',
      role: 'FULLSTACK DEVELOPER · VENEZUELA · REMOTE',
      portrait: 'PORTRAIT · B&W · 4:5',
      caption: 'FRANCISCO MYERS · CIUDAD GUAYANA',
      timelineH: 'TIMELINE',
      ctaH: "Let's build the next one.",
      work: 'See work',
      bio: [
        'I build web products with JavaScript and TypeScript, React and Node.js, and automations on Google Workspace. Before I wrote code, I ran the contracts database for works and services at an aluminium plant. That is where I learned to organise how information moves between users, contractors and internal teams.',
        'Today I apply that judgement to APIs, databases and interfaces, mostly for organisations with small teams and real constraints. I like projects where one person owns the whole thing, from the spec to the deploy.',
      ],
      facts: [
        { k: 'BASED IN', v: 'Ciudad Guayana, VE' },
        { k: 'TIME ZONE', v: 'VET · UTC−4' },
        { k: 'LANGUAGES', v: 'Spanish (native) · English (B1)' },
        { k: 'WORKS', v: 'Remote, US · EU · LatAm' },
      ],
      timeline: [
        {
          y: '2026 — NOW',
          m: 'Freelance · ChurchApp (Gracia Eterna)',
          d: 'Membership system for a local church in Next.js and Supabase. Public v1.0 ten days after the first commit.',
        },
        {
          y: '2025 — NOW',
          m: 'Developer · Chapel Library',
          d: 'Nonprofit publisher, Pensacola (US), remote. Inventory and distribution across warehouses on Apps Script and Workspace.',
        },
        {
          y: '2024',
          m: 'Full Stack · La Web del Colchón',
          d: 'E-commerce, Spain, remote. New database, data migration, REST API and new frontend in Laravel.',
        },
        {
          y: '2023',
          m: 'Full Stack · Skills EMPLI',
          d: 'Job platform, Lima (PE), remote. Landing pages, dashboards and the candidate–company matching flow in React.',
        },
        {
          y: '2023',
          m: 'Henry · Full Stack bootcamp',
          d: 'Formal switch from operations to software.',
        },
        {
          y: '2018 — 2022',
          m: 'Procurement admin · CVG Venalum',
          d: 'Aluminium industry, Puerto Ordaz. Ran the contracts database for works and services.',
        },
      ],
      stack: [
        { k: 'LANGUAGES', v: 'JavaScript · TypeScript · PHP' },
        { k: 'FRONTEND', v: 'React · Redux Toolkit · Vite · Tailwind CSS' },
        { k: 'BACKEND', v: 'Node.js · NestJS · Laravel · REST APIs' },
        { k: 'DATA', v: 'PostgreSQL · MongoDB · Prisma · Supabase' },
        { k: 'TOOLS', v: 'Git · Figma · Google Apps Script' },
        { k: 'PRACTICES', v: 'Design patterns · Data modelling' },
      ],
    },
    privacyPage: { sheet: 'SHEET 08 — PRIVACY', updated: 'UPDATED', email: 'HOLA@FMYERS.DEV' },
    contact: {
      sheet: 'SHEET 06 — CONTACT',
      meta: 'REPLY IN 2 BUSINESS DAYS',
      sentMeta: '06b',
      lead: 'A few lines are enough. I reply within 2 business days with questions or a first estimate.',
      fName: 'NAME',
      phName: 'Your name',
      fEmail: 'EMAIL',
      phEmail: 'you@company.com',
      errEmail: 'Write the full address, e.g. you@company.com',
      errMsg: 'Write a few lines about the project.',
      fType: 'PROJECT TYPE',
      fBudget: 'BUDGET · OPTIONAL',
      fMsg: 'MESSAGE',
      phMsg: 'What problem should it solve? Who uses it?',
      privacyNote: 'I only use this to reply to you.',
      privacyLink: 'Privacy',
      send: 'Send brief →',
      sending: 'Sending…',
      netErr: "The message didn't go through. Try again, or write to hola@fmyers.dev.",
      turnstile: 'Spam check',
      received: 'BRIEF RECEIVED',
      sentP:
        'A copy of your message is on its way to your inbox. If it is urgent, WhatsApp is the fastest way to reach me.',
      home: 'Back home',
      whileWait: 'SEE SELECTED WORK',
      types: { saas: 'SaaS MVP', automation: 'Automation', contract: 'Contract', other: 'Other' },
      budgets: {
        lt1k: '< $1k',
        '1-5k': '$1–5k',
        '5-10k': '$5–10k',
        '10k+': '$10k+',
        unsure: 'Not sure yet',
      },
      channels: [
        { k: 'WHATSAPP', v: '+58 424 908 0683', g: '↗' },
        { k: 'EMAIL', v: 'hola@fmyers.dev', g: '→' },
        { k: 'LINKEDIN', v: 'in/franciscomyers', g: '↗' },
      ],
      spec: [
        { k: 'REPLY BY', v: '2 business days' },
        { k: 'TIME ZONE', v: 'VET · UTC−4' },
        { k: 'FROM', v: 'hola@fmyers.dev' },
      ],
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
      contactSent: 'Gracias. Te respondo en 2 días hábiles.',
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
    home: {
      sheet00: 'LÁMINA 00 — FRANCISCO MYERS · DESARROLLADOR FULLSTACK',
      lead: 'De una idea validada a un producto en producción: especificación, interfaz, API, base de datos y despliegue. Un solo responsable de principio a fin.',
      see: 'Ver proyectos',
      available: 'Disponible para nuevos proyectos desde {date}',
      availableNow: 'Disponible para nuevos proyectos',
      sheet01: 'LÁMINA 01 — PROYECTOS',
      allWork: 'TODOS LOS PROYECTOS',
      sheet02: 'LÁMINA 02 — SERVICIOS',
      pricing: 'VER PRECIOS',
      servicesH: 'Tres formas de trabajar juntos.',
      ngo: 'Trabajo con iglesias y ONG; pregúntame. Precios en USD.',
      sheet03: 'LÁMINA 03 — PROCESO',
      steps: 'PASOS',
      sheet04: 'LÁMINA 04 — CONTACTO',
      contactH: 'Cuéntame qué estás construyendo.',
      contactP:
        'Envía un resumen corto y te respondo en 2 días hábiles, hora de Venezuela (UTC−4).',
      facts: [
        { k: 'STACK', v: 'Next.js · NestJS · PostgreSQL', accent: true },
        { k: 'AUTOMATIZ.', v: 'Google Workspace · Apps Script' },
        { k: 'BASE', v: 'Venezuela · UTC−4 · remoto' },
        { k: 'IDIOMAS', v: 'Español · Inglés' },
      ],
      process: [
        {
          n: '01',
          time: '1 SEM',
          t: 'Especificación',
          d: 'Una página con módulos, datos y la métrica que importa. La firmas antes de escribir código.',
        },
        {
          n: '02',
          time: '3–5 SEM',
          t: 'Construcción',
          d: 'Cada semana recibes una versión navegable en un enlace en vivo.',
        },
        {
          n: '03',
          time: '1 SEM',
          t: 'Lanzamiento',
          d: 'Despliegue, accesos y documentación. El repositorio es tuyo desde el día uno.',
        },
        {
          n: '04',
          time: '30 DÍAS',
          t: 'Soporte',
          d: 'Corrección de errores incluida. Después, plan de mantenimiento opcional.',
        },
      ],
    },
    about: {
      sheet: 'LÁMINA 03 — SOBRE MÍ',
      role: 'DESARROLLADOR FULLSTACK · VENEZUELA · REMOTO',
      portrait: 'RETRATO · B/N · 4:5',
      caption: 'FRANCISCO MYERS · CIUDAD GUAYANA',
      timelineH: 'TRAYECTORIA',
      ctaH: 'Construyamos el siguiente.',
      work: 'Ver proyectos',
      bio: [
        'Construyo productos web con JavaScript y TypeScript, React y Node.js, y automatizaciones sobre Google Workspace. Antes de programar, administré la base de datos de contrataciones de obras y servicios en una planta de aluminio. Ahí aprendí a ordenar cómo fluye la información entre usuarios, contratistas y áreas internas.',
        'Hoy aplico ese criterio al diseñar APIs, bases de datos e interfaces, sobre todo para organizaciones con equipos pequeños y restricciones reales. Me gustan los proyectos donde una sola persona responde por todo, de la especificación al despliegue.',
      ],
      facts: [
        { k: 'BASE', v: 'Ciudad Guayana, VE' },
        { k: 'ZONA HORARIA', v: 'VET · UTC−4' },
        { k: 'IDIOMAS', v: 'Español (nativo) · Inglés (B1)' },
        { k: 'TRABAJO', v: 'Remoto, EE. UU. · UE · LatAm' },
      ],
      timeline: [
        {
          y: '2026 — HOY',
          m: 'Freelance · ChurchApp (Gracia Eterna)',
          d: 'Sistema de membresía para una iglesia local en Next.js y Supabase. v1.0 pública diez días después del primer commit.',
        },
        {
          y: '2025 — HOY',
          m: 'Desarrollador · Chapel Library',
          d: 'Editorial sin fines de lucro, Pensacola (EE. UU.), remoto. Inventario y distribución entre almacenes con Apps Script y Workspace.',
        },
        {
          y: '2024',
          m: 'Full Stack · La Web del Colchón',
          d: 'E-commerce, España, remoto. Base de datos nueva, migración, API REST y frontend nuevo en Laravel.',
        },
        {
          y: '2023',
          m: 'Full Stack · Skills EMPLI',
          d: 'Plataforma de empleo, Lima (PE), remoto. Landing pages, dashboards y el flujo entre candidatos y empresas en React.',
        },
        {
          y: '2023',
          m: 'Henry · Bootcamp Full Stack',
          d: 'Cambio formal de operaciones a software.',
        },
        {
          y: '2018 — 2022',
          m: 'Asistente administrativo · CVG Venalum',
          d: 'Industria del aluminio, Puerto Ordaz. Administré la base de datos de contrataciones de obras y servicios.',
        },
      ],
      stack: [
        { k: 'LENGUAJES', v: 'JavaScript · TypeScript · PHP' },
        { k: 'FRONTEND', v: 'React · Redux Toolkit · Vite · Tailwind CSS' },
        { k: 'BACKEND', v: 'Node.js · NestJS · Laravel · APIs REST' },
        { k: 'DATOS', v: 'PostgreSQL · MongoDB · Prisma · Supabase' },
        { k: 'HERRAMIENTAS', v: 'Git · Figma · Google Apps Script' },
        { k: 'PRÁCTICAS', v: 'Patrones de diseño · Modelado de datos' },
      ],
    },
    privacyPage: {
      sheet: 'LÁMINA 08 — PRIVACIDAD',
      updated: 'ACTUALIZADO',
      email: 'HOLA@FMYERS.DEV',
    },
    contact: {
      sheet: 'LÁMINA 06 — CONTACTO',
      meta: 'RESPUESTA EN 2 DÍAS HÁBILES',
      sentMeta: '06b',
      lead: 'Unas líneas bastan. Respondo en 2 días hábiles con preguntas o una primera estimación.',
      fName: 'NOMBRE',
      phName: 'Tu nombre',
      fEmail: 'CORREO',
      phEmail: 'tu@empresa.com',
      errEmail: 'Escribe la dirección completa, p. ej. tu@empresa.com',
      errMsg: 'Escribe unas líneas sobre el proyecto.',
      fType: 'TIPO DE PROYECTO',
      fBudget: 'PRESUPUESTO · OPCIONAL',
      fMsg: 'MENSAJE',
      phMsg: '¿Qué problema debe resolver? ¿Quién lo usa?',
      privacyNote: 'Solo lo uso para responderte.',
      privacyLink: 'Privacidad',
      send: 'Enviar resumen →',
      sending: 'Enviando…',
      netErr: 'El mensaje no se envió. Inténtalo de nuevo o escribe a hola@fmyers.dev.',
      turnstile: 'Verificación antispam',
      received: 'RESUMEN RECIBIDO',
      sentP:
        'Te llega una copia de tu mensaje al correo. Si es urgente, WhatsApp es la vía más rápida.',
      home: 'Volver al inicio',
      whileWait: 'VER PROYECTOS',
      types: {
        saas: 'SaaS MVP',
        automation: 'Automatización',
        contract: 'Contrato',
        other: 'Otro',
      },
      budgets: {
        lt1k: '< $1k',
        '1-5k': '$1–5k',
        '5-10k': '$5–10k',
        '10k+': '$10k+',
        unsure: 'No lo sé aún',
      },
      channels: [
        { k: 'WHATSAPP', v: '+58 424 908 0683', g: '↗' },
        { k: 'CORREO', v: 'hola@fmyers.dev', g: '→' },
        { k: 'LINKEDIN', v: 'in/franciscomyers', g: '↗' },
      ],
      spec: [
        { k: 'RESPUESTA', v: '2 días hábiles' },
        { k: 'ZONA HORARIA', v: 'VET · UTC−4' },
        { k: 'DESDE', v: 'hola@fmyers.dev' },
      ],
    },
  },
};
