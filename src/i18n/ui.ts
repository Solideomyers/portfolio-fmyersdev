import type { Lang, NavKey, RouteKey } from './routes';
import { site } from '../config/site';
import { fillTokens } from '../lib/tokens';
import en from './ui.en.json' with { type: 'json' };
import es from './ui.es.json' with { type: 'json' };

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
    sentNoCopy: string;
    home: string;
    whileWait: string;
    types: Record<'saas' | 'automation' | 'contract' | 'other', string>;
    budgets: Record<'lt1k' | '1-5k' | '5-10k' | '10k+' | 'unsure', string>;
    channels: { k: string; v: string; g: string }[];
    spec: { k: string; v: string }[];
  };
  notes: {
    sheet: string;
    lead: string;
    filterLabel: string;
    cats: string[];
    onlyEn: string;
    emptyK: string;
    emptyH: string;
    showAll: string;
    allNotes: string;
    author: string;
    write: string;
    related: string;
    prev: string;
    next: string;
    latest: string;
    rssTitle: string;
  };
}

// Copy lives in ui.en.json / ui.es.json (editable from the admin panel); {{email}} and {{EMAIL}}
// come from the single-source site config. The key parity of both files is checked in tests.
const tokens = { email: site.email, EMAIL: site.email.toUpperCase() };
const fill = (v: unknown): unknown =>
  typeof v === 'string'
    ? fillTokens(v, tokens)
    : Array.isArray(v)
      ? v.map(fill)
      : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
        : v;

export const ui = fill({ en, es }) as unknown as Record<Lang, Ui>;
